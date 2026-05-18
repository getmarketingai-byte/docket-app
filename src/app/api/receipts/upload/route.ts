import { auth } from '@clerk/nextjs/server';
import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { receipts, userProfiles } from '@/lib/db/schema';
import { inngest } from '@/lib/inngest/client';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('file') as File;
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

  const ex = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.clerkUserId, userId))
    .limit(1);
  let up = ex[0];
  if (!up) {
    const ins = await db.insert(userProfiles).values({ clerkUserId: userId }).returning();
    up = ins[0];
  }

  const blob = await put(
    `receipts/${up.id}/${Date.now()}-${file.name}`,
    file,
    { access: 'public' },
  );

  const rec = await db
    .insert(receipts)
    .values({ userId: up.id, status: 'processing', originalBlobUrl: blob.url, source: 'upload' })
    .returning();

  await inngest.send({
    name: 'receipt/uploaded',
    data: { receiptId: rec[0].id, blobUrl: blob.url, userId: up.id },
  });

  return NextResponse.json({ receiptId: rec[0].id, status: 'processing' });
}
