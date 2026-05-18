import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { receipts, userProfiles } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const profiles = await db.select().from(userProfiles).where(eq(userProfiles.clerkUserId, userId)).limit(1);
  if (!profiles[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const receipt = await db
    .select()
    .from(receipts)
    .where(and(eq(receipts.id, id), eq(receipts.userId, profiles[0].id)))
    .limit(1);

  if (!receipt[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ receipt: receipt[0] });
}
