import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { shareTokens, receipts } from '@/lib/db/schema';
import { eq, and, gte, lte, isNull, or } from 'drizzle-orm';

// GET /api/shared/[token] — public endpoint, returns receipts for a valid share token
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  // Validate token
  const [share] = await db
    .select()
    .from(shareTokens)
    .where(eq(shareTokens.token, token))
    .limit(1);

  if (!share) {
    return NextResponse.json({ error: 'Invalid link' }, { status: 404 });
  }

  if (share.revokedAt) {
    return NextResponse.json({ error: 'This link has been revoked' }, { status: 410 });
  }

  if (share.expiresAt && share.expiresAt < new Date()) {
    return NextResponse.json({ error: 'This link has expired' }, { status: 410 });
  }

  // Build receipt query conditions
  const conditions = [
    eq(receipts.userId, share.userId),
    eq(receipts.status, 'complete'),
  ];

  if (share.dateFrom) {
    conditions.push(gte(receipts.receiptDate, share.dateFrom));
  }
  if (share.dateTo) {
    conditions.push(lte(receipts.receiptDate, share.dateTo));
  }

  const rows = await db
    .select({
      id: receipts.id,
      merchant: receipts.merchant,
      merchantAbn: receipts.merchantAbn,
      receiptDate: receipts.receiptDate,
      totalAmount: receipts.totalAmount,
      gstAmount: receipts.gstAmount,
      subtotalAmount: receipts.subtotalAmount,
      currency: receipts.currency,
      category: receipts.category,
      taxCategory: receipts.taxCategory,
      taxClaimable: receipts.taxClaimable,
      taxClaimableConfidence: receipts.taxClaimableConfidence,
      paymentMethod: receipts.paymentMethod,
      notes: receipts.notes,
      compressedBlobUrl: receipts.compressedBlobUrl,
      originalBlobUrl: receipts.originalBlobUrl,
      businessPercentage: receipts.businessPercentage,
    })
    .from(receipts)
    .where(and(...conditions))
    .orderBy(receipts.receiptDate);

  return NextResponse.json({
    share: {
      label: share.label,
      dateFrom: share.dateFrom,
      dateTo: share.dateTo,
      expiresAt: share.expiresAt,
    },
    receipts: rows,
    count: rows.length,
  });
}
