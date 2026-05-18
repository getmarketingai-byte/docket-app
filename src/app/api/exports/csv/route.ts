import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { userProfiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getUserReceipts } from '@/lib/db/queries';
import { buildCsv, buildHnryCsv } from '@/lib/exports/csv';

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
  const format = url.searchParams.get('format') ?? 'standard'; // standard | hnry
  const dateFrom = url.searchParams.get('dateFrom') ?? undefined;
  const dateTo = url.searchParams.get('dateTo') ?? undefined;
  const category = url.searchParams.get('category') ?? undefined;

  const receipts = await getUserReceipts(profiles[0].id, {
    dateFrom,
    dateTo,
    category,
    limit: 5000,
  });

  const csv = format === 'hnry' ? buildHnryCsv(receipts) : buildCsv(receipts);
  const filename = format === 'hnry' ? 'docket-hnry-export.csv' : 'docket-receipts.csv';

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
