import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getCurrentUserProfileId, getReimbursableReceipts } from '@/lib/db/queries';
import { buildReimbursementHtml } from '@/lib/exports/csv';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const profileId = await getCurrentUserProfileId();
  if (!profileId) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const receipts = await getReimbursableReceipts(profileId);
  const generatedDate = new Date().toLocaleDateString('en-AU', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
  const html = buildReimbursementHtml(receipts, generatedDate);

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}
