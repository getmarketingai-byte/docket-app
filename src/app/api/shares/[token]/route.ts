import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { shareTokens, userProfiles } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

async function getProfileId(clerkUserId: string) {
  const rows = await db
    .select({ id: userProfiles.id })
    .from(userProfiles)
    .where(eq(userProfiles.clerkUserId, clerkUserId))
    .limit(1);
  return rows[0]?.id ?? null;
}

// DELETE /api/shares/[token] — revoke a share token
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const profileId = await getProfileId(clerkUserId);
  if (!profileId) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

  const { token } = await params;

  await db
    .update(shareTokens)
    .set({ revokedAt: new Date() })
    .where(and(eq(shareTokens.token, token), eq(shareTokens.userId, profileId)));

  return NextResponse.json({ ok: true });
}
