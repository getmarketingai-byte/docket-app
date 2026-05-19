import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getCurrentUserProfileId, getReimbursableReceipts } from '@/lib/db/queries';
import { buildReimbursementCsv } from '@/lib/exports/csv';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const profileId = await getCurrentUserProfileId();
  if (!profileId) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const receipts = await getReimbursableReceipts(profileId);
  const csv = buildReimbursementCsv(receipts);

  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="docket-reimbursements-${date}.csv"`,
    },
  });
}
