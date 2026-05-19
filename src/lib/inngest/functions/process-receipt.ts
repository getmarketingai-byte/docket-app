import { inngest } from '../client';
import { db } from '@/lib/db';
import { receipts, auditLogs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { put } from '@vercel/blob';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

const EXTRACTION_PROMPT = `You are an Australian receipt and invoice extraction assistant. Analyze this receipt image and extract all data.

Return ONLY valid JSON (no markdown, no explanation) with this exact structure:
{
  "merchant": "string or null",
  "merchant_abn": "string (XX XXX XXX XXX format) or null",
  "receipt_date": "ISO 8601 date string or null",
  "total_amount": number or null,
  "gst_amount": number or null,
  "subtotal_amount": number or null,
  "currency": "AUD",
  "payment_method": "cash|card|eftpos|bank_transfer|other or null",
  "receipt_type": "tax_invoice|receipt|quote|other",
  "line_items": [{"description": "string", "quantity": number, "unit_price": number, "total": number}],
  "ocr_raw_text": "full raw text of receipt",
  "category": "meals|travel|accommodation|office_supplies|equipment|software|utilities|professional_services|vehicle|other",
  "subcategory": "string or null",
  "tax_claimable": boolean,
  "tax_claimable_confidence": number between 0 and 1,
  "tax_claimable_reasoning": "brief explanation",
  "tax_category": "D1_work_related_expenses|D2_work_related_travel|D3_clothing|D4_self_education|D5_other_deductions|business_expense|non_deductible or null",
  "odometer_reading": number or null,
  "fuel_litres": number or null,
  "fuel_type": "unleaded|premium|diesel|lpg or null",
  "is_duplicate": false
}

Australian tax context: GST is 10%. Tax invoices must show supplier ABN. Work-related expenses are deductible if incurred earning income. AI estimate — review with your accountant.`;

export const processReceipt = inngest.createFunction(
  {
    id: 'process-receipt',
    name: 'Process Receipt',
    triggers: [{ event: 'receipt/uploaded' }],
    timeouts: { finish: '5m' },
    onFailure: async ({ error, event: failEvent }) => {
      const receiptId = (failEvent.data as { receiptId?: string })?.receiptId;
      if (!receiptId) return;
      const isTimeout = error?.message?.toLowerCase().includes('timeout') ||
        error?.name === 'InngestFunctionTimeoutError';
      await db.update(receipts)
        .set({
          status: 'error',
          aiExtractionRaw: { error: isTimeout ? 'Processing timed out' : 'Processing failed' },
          updatedAt: new Date(),
        })
        .where(eq(receipts.id, receiptId));
    },
  },
  async ({ event, step }) => {
    const { receiptId, blobUrl, userId } = event.data as {
      receiptId: string;
      blobUrl: string;
      userId: string;
    };

    // Step 1: Compress
    const compressedUrl = await step.run('compress', async () => {
      const isPdf = blobUrl.toLowerCase().includes('.pdf');
      if (isPdf) return blobUrl;

      try {
        const sharp = (await import('sharp')).default;
        const response = await fetch(blobUrl);
        const buffer = Buffer.from(await response.arrayBuffer());
        const compressed = await sharp(buffer)
          .resize({ width: 2000, withoutEnlargement: true })
          .webp({ quality: 80 })
          .toBuffer();

        const blob = await put(
          `receipts-compressed/${userId}/${receiptId}.webp`,
          compressed,
          { access: 'public', contentType: 'image/webp' },
        );

        await db.update(receipts)
          .set({ compressedBlobUrl: blob.url })
          .where(eq(receipts.id, receiptId));

        return blob.url;
      } catch {
        return blobUrl;
      }
    });

    // Step 2: AI extract
    const extraction = await step.run('ai-extract', async () => {
      try {
        const response = await anthropic.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 2048,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'image', source: { type: 'url', url: compressedUrl } },
                { type: 'text', text: EXTRACTION_PROMPT },
              ],
            },
          ],
        });

        const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
        try {
          return JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim()) as Record<string, unknown>;
        } catch {
          return {} as Record<string, unknown>;
        }
      } catch {
        // If AI extraction fails, update status to error and rethrow
        await db.update(receipts)
          .set({ status: 'error', updatedAt: new Date() })
          .where(eq(receipts.id, receiptId));
        throw new Error('AI extraction failed');
      }
    });

    // Step 3: Store results (skip if user already manually entered data)
    await step.run('store-results', async () => {
      const [current] = await db.select({ status: receipts.status }).from(receipts).where(eq(receipts.id, receiptId));
      if (current?.status === 'complete') return; // manual entry took precedence

      await db.update(receipts)
        .set({
          status: 'complete',
          merchant: d.merchant as string | null,
          merchantAbn: d.merchant_abn as string | null,
          receiptDate: d.receipt_date ? new Date(d.receipt_date as string) : null,
          totalAmount: d.total_amount != null ? String(d.total_amount) : null,
          gstAmount: d.gst_amount != null ? String(d.gst_amount) : null,
          subtotalAmount: d.subtotal_amount != null ? String(d.subtotal_amount) : null,
          currency: (d.currency as string) ?? 'AUD',
          paymentMethod: d.payment_method as string | null,
          receiptType: d.receipt_type as string | null,
          lineItems: (d.line_items as unknown[]) ?? [],
          ocrRawText: d.ocr_raw_text as string | null,
          category: d.category as string | null,
          subcategory: d.subcategory as string | null,
          taxClaimable: d.tax_claimable as boolean | null,
          taxClaimableConfidence: d.tax_claimable_confidence != null ? String(d.tax_claimable_confidence) : null,
          taxClaimableReasoning: d.tax_claimable_reasoning as string | null,
          taxCategory: d.tax_category as string | null,
          odometerReading: d.odometer_reading as number | null,
          fuelLitres: d.fuel_litres != null ? String(d.fuel_litres) : null,
          fuelType: d.fuel_type as string | null,
          aiExtractionRaw: d,
          updatedAt: new Date(),
        })
        .where(eq(receipts.id, receiptId));
    });

    // Step 4: Audit log
    await step.run('audit-log', async () => {
      await db.insert(auditLogs).values({
        userId,
        receiptId,
        action: 'ai_classified',
        newValue: JSON.stringify({ model: 'claude-sonnet-4-6', status: 'complete' }),
      });
    });

    return { receiptId, status: 'complete' };
  },
);
