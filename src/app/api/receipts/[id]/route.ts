import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { receipts, userProfiles, auditLogs } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

async function getProfileId(clerkUserId: string) {
  const profiles = await db
    .select({ id: userProfiles.id })
    .from(userProfiles)
    .where(eq(userProfiles.clerkUserId, clerkUserId))
    .limit(1);
  return profiles[0]?.id ?? null;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const profileId = await getProfileId(userId);
  if (!profileId) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const rows = await db
    .select()
    .from(receipts)
    .where(and(eq(receipts.id, id), eq(receipts.userId, profileId)))
    .limit(1);

  if (!rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ receipt: rows[0] });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const profileId = await getProfileId(userId);
  if (!profileId) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const existing = await db
    .select({ id: receipts.id })
    .from(receipts)
    .where(and(eq(receipts.id, id), eq(receipts.userId, profileId)))
    .limit(1);

  if (!existing[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();
  const allowed = [
    'merchant', 'merchantAbn', 'receiptDate', 'totalAmount', 'gstAmount',
    'subtotalAmount', 'category', 'subcategory', 'notes', 'paymentMethod',
    'receiptType', 'taxClaimable', 'taxCategory', 'businessPercentage',
    'fuelType', 'fuelLitres', 'odometerReading',
    'reimbursable', 'reimbursementStatus', 'reimbursementSource',
    'reimbursementAmount', 'reimbursementSubmittedAt', 'reimbursementReceivedAt',
  ];

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  const auditEntries: { field: string; newValue: string | null }[] = [];

  for (const key of allowed) {
    if (key in body) {
      updates[key] = body[key];
      auditEntries.push({ field: key, newValue: body[key] == null ? null : String(body[key]) });
    }
  }

  if (Object.keys(updates).length > 1) {
    await db.update(receipts).set(updates).where(eq(receipts.id, id));
    for (const entry of auditEntries) {
      await db.insert(auditLogs).values({
        userId: profileId,
        receiptId: id,
        action: 'manual_edit',
        fieldChanged: entry.field,
        newValue: entry.newValue,
      });
    }
  }

  const updated = await db.select().from(receipts).where(eq(receipts.id, id)).limit(1);
  return NextResponse.json({ receipt: updated[0] });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const profileId = await getProfileId(userId);
  if (!profileId) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await db
    .delete(receipts)
    .where(and(eq(receipts.id, id), eq(receipts.userId, profileId)));

  return NextResponse.json({ deleted: true });
}
