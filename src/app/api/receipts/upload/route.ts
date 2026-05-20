import { auth } from '@clerk/nextjs/server';
import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { receipts, userProfiles } from '@/lib/db/schema';
import { inngest } from '@/lib/inngest/client';
import { eq } from 'drizzle-orm';

const MAX_SIZE = 20 * 1024 * 1024; // 20MB

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'application/pdf',
]);

// Sanitise filename to prevent path traversal or injection
function sanitiseFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.{2,}/g, '_')
    .slice(0, 200);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid multipart form data' }, { status: 400 });
  }

  const file = formData.get('file') as File | null;
  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File too large. Maximum size is 20MB.' }, { status: 413 });
  }

  if (file.size === 0) {
    return NextResponse.json({ error: 'File is empty' }, { status: 400 });
  }

  // Validate MIME type from declared content type
  const mimeType = file.type.toLowerCase().split(';')[0].trim();
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    return NextResponse.json(
      { error: 'Unsupported file type. Please upload a JPEG, PNG, WEBP, HEIC, or PDF.' },
      { status: 415 },
    );
  }

  // Validate magic bytes for common types to catch MIME spoofing
  const header = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  const isValidMagic = validateMagicBytes(header, mimeType);
  if (!isValidMagic) {
    return NextResponse.json(
      { error: 'File content does not match declared type.' },
      { status: 415 },
    );
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

  const safeFilename = sanitiseFilename(file.name || 'receipt');
  let blob: Awaited<ReturnType<typeof put>>;
  try {
    blob = await put(
      `receipts/${up.id}/${Date.now()}-${safeFilename}`,
      file,
      { access: 'public', contentType: mimeType },
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

function validateMagicBytes(bytes: Uint8Array, mimeType: string): boolean {
  // JPEG: FF D8 FF
  if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (mimeType === 'image/png') {
    return (
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47
    );
  }
  // PDF: %PDF
  if (mimeType === 'application/pdf') {
    return bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
  }
  // WEBP: RIFF....WEBP
  if (mimeType === 'image/webp') {
    return bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46;
  }
  // HEIC/HEIF — magic bytes vary widely; skip strict check, trust declared type
  if (mimeType === 'image/heic' || mimeType === 'image/heif') {
    return true;
  }
  return false;
}
