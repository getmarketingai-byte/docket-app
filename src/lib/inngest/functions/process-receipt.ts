import { inngest } from '../client';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

export const processReceipt = inngest.createFunction(
  {
    id: 'process-receipt',
    name: 'Process Receipt',
    triggers: [{ event: 'receipt/uploaded' }],
  },
  async ({ event, step }) => {
    const { receiptId, blobUrl } = event.data as { receiptId: string; blobUrl: string };

    const extraction = await step.run('extract-with-claude', async () => {
      const response = await anthropic.messages.create({
        model: 'claude-opus-4-5',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image', source: { type: 'url', url: blobUrl } },
              {
                type: 'text',
                text: 'Extract receipt data as JSON with fields: merchant, merchant_abn, receipt_date (ISO), total_amount, gst_amount, subtotal_amount, currency, payment_method, line_items (array), category (one of: meals, travel, accommodation, office_supplies, equipment, software, utilities, professional_services, vehicle, other), tax_claimable (boolean), tax_claimable_confidence (0-1), tax_claimable_reasoning, tax_category. Australian context. Respond with JSON only.',
              },
            ],
          },
        ],
      });

      const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
      try {
        return JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim());
      } catch {
        return {};
      }
    });

    return { receiptId, extraction };
  },
);
