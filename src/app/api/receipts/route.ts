import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { userProfiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getUserReceipts } from '@/lib/db/queries';

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const profiles = await db
    .select({ id: userProfiles.id })
    .from(userProfiles)
    .where(eq(userProfiles.clerkUserId, userId))
    .limit(1);

  if (!profiles[0]) return NextResponse.json({ receipts: [] });

  const url = new URL(req.url);
  const filters = {
    q: url.searchParams.get('q') ?? undefined,
    category: url.searchParams.get('category') ?? undefined,
    dateFrom: url.searchParams.get('dateFrom') ?? undefined,
    dateTo: url.searchParams.get('dateTo') ?? undefined,
    minAmount: url.searchParams.get('minAmount') ?? undefined,
    maxAmount: url.searchParams.get('maxAmount') ?? undefined,
    claimable: url.searchParams.get('claimable') ?? undefined,
    hasGst: url.searchParams.get('hasGst') ?? undefined,
    sortBy: url.searchParams.get('sortBy') ?? undefined,
    limit: parseInt(url.searchParams.get('limit') ?? '50'),
    offset: parseInt(url.searchParams.get('offset') ?? '0'),
  };

  const userReceipts = await getUserReceipts(profiles[0].id, filters);
  return NextResponse.json({ receipts: userReceipts });
}
