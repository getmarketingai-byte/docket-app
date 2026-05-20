import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserProfileId, getShareLinksForUser, createShareLink } from '@/lib/db/queries';

export async function GET() {
  const profileId = await getCurrentUserProfileId();
  if (!profileId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const links = await getShareLinksForUser(profileId);
  return NextResponse.json(links);
}

export async function POST(request: NextRequest) {
  const profileId = await getCurrentUserProfileId();
  if (!profileId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { label?: string; expiresAt?: string } = {};
  try {
    body = await request.json();
  } catch {
    // empty body is fine
  }

  const expiresAt = body.expiresAt ? new Date(body.expiresAt) : undefined;
  const link = await createShareLink(profileId, body.label, expiresAt);
  return NextResponse.json(link, { status: 201 });
}
