import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { receipts, userProfiles } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const profiles = await db.select().from(userProfiles).where(eq(userProfiles.clerkUserId, userId)).limit(1);
  if (!profiles[0]) return NextResponse.json({ receipts: [] });

  const userReceipts = await db
    .select()
    .from(receipts)
    .where(eq(receipts.userId, profiles[0].id))
    .orderBy(desc(receipts.createdAt))
    .limit(50);

  return NextResponse.json({ receipts: userReceipts });
}
