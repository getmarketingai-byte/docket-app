import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { userProfiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getUserReceipts } from '@/lib/db/queries';
import { buildBasCsv, getQuarterBounds, currentFY, quarterLabel } from '@/lib/exports/csv';

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const profiles = await db
    .select({ id: userProfiles.id })
    .from(userProfiles)
    .where(eq(userProfiles.clerkUserId, userId))
    .limit(1);

  if (!profiles[0]) return new NextResponse('No profile', { status: 404 });

  const url = new URL(req.url);
  const quarter = url.searchParams.get('quarter') ?? 'Q1';
  const fy = url.searchParams.get('fy') ?? currentFY();

  const { start, end } = getQuarterBounds(quarter, fy);

  const receipts = await getUserReceipts(profiles[0].id, {
    dateFrom: start.toISOString().slice(0, 10),
    dateTo: end.toISOString().slice(0, 10),
    limit: 5000,
  });

  const csv = buildBasCsv(receipts, `${quarter} (${quarterLabel(quarter)})`, fy);

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="docket-bas-${quarter}-FY${fy}.csv"`,
    },
  });
}
