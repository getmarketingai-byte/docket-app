import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { shareTokens, userProfiles } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { randomBytes } from 'crypto';

async function getProfileId(clerkUserId: string) {
  const rows = await db
    .select({ id: userProfiles.id })
    .from(userProfiles)
    .where(eq(userProfiles.clerkUserId, clerkUserId))
    .limit(1);
  return rows[0]?.id ?? null;
}

// GET /api/shares — list user's share tokens
export async function GET() {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const profileId = await getProfileId(clerkUserId);
  if (!profileId) return NextResponse.json({ shares: [] });

  const shares = await db
    .select()
    .from(shareTokens)
    .where(eq(shareTokens.userId, profileId))
    .orderBy(desc(shareTokens.createdAt));

  return NextResponse.json({ shares });
}

// POST /api/shares — create a new share token
export async function POST(req: NextRequest) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const profileId = await getProfileId(clerkUserId);
  if (!profileId) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

  const body = await req.json() as {
    label?: string;
    dateFrom?: string;
    dateTo?: string;
    expiresInDays?: number;
  };

  const token = randomBytes(32).toString('hex');
  const expiresAt = body.expiresInDays
    ? new Date(Date.now() + body.expiresInDays * 24 * 60 * 60 * 1000)
    : null;

  const [share] = await db.insert(shareTokens).values({
    userId: profileId,
    token,
    label: body.label ?? 'Accountant access',
    dateFrom: body.dateFrom ? new Date(body.dateFrom) : null,
    dateTo: body.dateTo ? new Date(body.dateTo) : null,
    expiresAt,
  }).returning();

  return NextResponse.json({ share }, { status: 201 });
}
