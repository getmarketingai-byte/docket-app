import { db } from '@/lib/db';
import { receipts } from '@/lib/db/schema';
import { and, eq, gte, lte, ne, sql } from 'drizzle-orm';

/**
 * Detect if a newly-processed receipt is a duplicate of an existing one.
 *
 * Match criteria:
 * - Same userId
 * - Same merchant (case-insensitive)
 * - Same totalAmount (within $0.01)
 * - receiptDate within ±7 days
 * - Not the same receipt (id != receiptId)
 * - status = 'complete'
 *
 * Returns the id of the original receipt if a duplicate is found, else null.
 */
export async function detectDuplicate(
  receiptId: string,
  userId: string,
  merchant: string | null,
  totalAmount: string | null,
  receiptDate: Date | null,
): Promise<string | null> {
  if (!merchant || !totalAmount || !receiptDate) return null;

  const windowDays = 7;
  const dateFrom = new Date(receiptDate);
  dateFrom.setDate(dateFrom.getDate() - windowDays);
  const dateTo = new Date(receiptDate);
  dateTo.setDate(dateTo.getDate() + windowDays);

  const amount = parseFloat(totalAmount);
  if (isNaN(amount)) return null;

  // Use sql cast for decimal comparison
  const matches = await db
    .select({ id: receipts.id, createdAt: receipts.createdAt })
    .from(receipts)
    .where(
      and(
        eq(receipts.userId, userId),
        ne(receipts.id, receiptId),
        eq(receipts.status, 'complete'),
        sql`LOWER(${receipts.merchant}) = LOWER(${merchant})`,
        sql`ABS(CAST(${receipts.totalAmount} AS NUMERIC) - ${amount}) < 0.01`,
        gte(receipts.receiptDate, dateFrom),
        lte(receipts.receiptDate, dateTo),
      ),
    )
    .limit(1);

  return matches[0]?.id ?? null;
}
