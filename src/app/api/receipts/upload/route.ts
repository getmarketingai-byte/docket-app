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

  const MAX_SIZE = 20 * 1024 * 1024; // 20MB
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File too large. Maximum size is 20MB.' }, { status: 413 });
  }

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

  let blob: Awaited<ReturnType<typeof put>>;
  try {
    blob = await put(
      `receipts/${up.id}/${Date.now()}-${file.name}`,
      file,
      { access: 'public' },
    );
  } catch {
    return NextResponse.json({ error: 'File storage failed' }, { status: 502 });
  }

  let rec: (typeof receipts.$inferSelect)[];
  try {
    rec = await db
      .insert(receipts)
      .values({ userId: up.id, status: 'processing', originalBlobUrl: blob.url, source: 'upload' })
      .returning();
  } catch {
    return NextResponse.json({ error: 'Failed to create receipt record' }, { status: 500 });
  }

  try {
    await inngest.send({
      name: 'receipt/uploaded',
      data: { receiptId: rec[0].id, blobUrl: blob.url, userId: up.id },
    });
  } catch {
    // Inngest failure is non-fatal — receipt record exists, can be retried
  }

  return NextResponse.json({ receiptId: rec[0].id, status: 'processing' });
}
