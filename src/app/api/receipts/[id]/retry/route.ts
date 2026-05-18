import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { receipts, userProfiles } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { inngest } from '@/lib/inngest/client';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const profiles = await db.select().from(userProfiles).where(eq(userProfiles.clerkUserId, userId)).limit(1);
  if (!profiles[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const receipt = await db
    .select()
    .from(receipts)
    .where(and(eq(receipts.id, id), eq(receipts.userId, profiles[0].id)))
    .limit(1);

  if (!receipt[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await db.update(receipts).set({ status: 'processing', updatedAt: new Date() }).where(eq(receipts.id, id));

  await inngest.send({
    name: 'receipt/uploaded',
    data: {
      receiptId: id,
      blobUrl: receipt[0].originalBlobUrl!,
      userId: profiles[0].id,
    },
  });

  return NextResponse.json({ status: 'processing' });
}
