import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserProfileId, deleteShareLink, deactivateShareLink } from '@/lib/db/queries';

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_request: NextRequest, { params }: Params) {
  const profileId = await getCurrentUserProfileId();
  if (!profileId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await deleteShareLink(profileId, id);
  return NextResponse.json({ ok: true });
}

export async function PATCH(_request: NextRequest, { params }: Params) {
  const profileId = await getCurrentUserProfileId();
  if (!profileId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await deactivateShareLink(profileId, id);
  return NextResponse.json({ ok: true });
}
