import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { userFeedback } from '@/lib/db/schema';
import { inngest } from '@/lib/inngest/client';
import { put } from '@vercel/blob';

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: {
    type?: string;
    description?: string;
    pageUrl?: string;
    browserInfo?: string;
    screenshotDataUrl?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { type, description, pageUrl, browserInfo, screenshotDataUrl } = body;

  if (!type || !['bug', 'feature', 'suggestion'].includes(type)) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  }
  if (!description || description.trim().length < 5) {
    return NextResponse.json({ error: 'Description too short' }, { status: 400 });
  }
  if (description.length > 5000) {
    return NextResponse.json({ error: 'Description too long' }, { status: 400 });
  }

  let screenshotUrl: string | null = null;

  if (screenshotDataUrl) {
    try {
      const matches = screenshotDataUrl.match(/^data:(.+);base64,(.+)$/);
      if (matches) {
        const mimeType = matches[1];
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, 'base64');
        const ext = mimeType.includes('png') ? 'png' : 'jpg';
        const blob = await put(`feedback/${userId}-${Date.now()}.${ext}`, buffer, {
          access: 'public',
          contentType: mimeType,
        });
        screenshotUrl = blob.url;
      }
    } catch {
      // Non-fatal — proceed without screenshot
    }
  }

  const user = await currentUser();
  const userEmail = user?.emailAddresses?.[0]?.emailAddress ?? null;

  const [row] = await db
    .insert(userFeedback)
    .values({
      userId,
      type,
      description: description.trim(),
      screenshotUrl,
      pageUrl: pageUrl?.slice(0, 500) ?? null,
      browserInfo: browserInfo?.slice(0, 500) ?? null,
    })
    .returning({ id: userFeedback.id });

  // Trigger Inngest notification
  await inngest.send({
    name: 'feedback/submitted',
    data: {
      feedbackId: row.id,
      type,
      description: description.trim(),
      userEmail,
      pageUrl: pageUrl ?? null,
    },
  });

  return NextResponse.json({ success: true, id: row.id });
}
