import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { z } from 'zod/v4';
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

const ReceiptPatchSchema = z.object({
  merchant: z.string().max(200).nullish(),
  merchantAbn: z.string().max(20).nullish(),
  receiptDate: z.string().date().nullish(),
  totalAmount: z.string().regex(/^\d+(\.\d{1,2})?$/).nullish(),
  gstAmount: z.string().regex(/^\d+(\.\d{1,2})?$/).nullish(),
  subtotalAmount: z.string().regex(/^\d+(\.\d{1,2})?$/).nullish(),
  category: z.string().max(100).nullish(),
  subcategory: z.string().max(100).nullish(),
  notes: z.string().max(2000).nullish(),
  paymentMethod: z.string().max(50).nullish(),
  receiptType: z.string().max(50).nullish(),
  taxClaimable: z.boolean().nullish(),
  taxCategory: z.string().max(100).nullish(),
  businessPercentage: z.number().min(0).max(100).nullish(),
  fuelType: z.string().max(50).nullish(),
  fuelLitres: z.string().regex(/^\d+(\.\d{1,3})?$/).nullish(),
  odometerReading: z.number().int().min(0).nullish(),
  reimbursable: z.boolean().nullish(),
  reimbursementStatus: z.enum(['pending', 'submitted', 'approved', 'paid', 'rejected']).nullish(),
  reimbursementSource: z.string().max(200).nullish(),
  reimbursementAmount: z.string().regex(/^\d+(\.\d{1,2})?$/).nullish(),
  reimbursementSubmittedAt: z.string().datetime().nullish(),
  reimbursementReceivedAt: z.string().datetime().nullish(),
});

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

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = ReceiptPatchSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues.map((i) => i.message) },
      { status: 422 },
    );
  }

  const body = parsed.data;
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  const auditEntries: { field: string; newValue: string | null }[] = [];

  for (const [key, value] of Object.entries(body)) {
    if (value !== undefined) {
      updates[key] = value;
      auditEntries.push({ field: key, newValue: value == null ? null : String(value) });
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
