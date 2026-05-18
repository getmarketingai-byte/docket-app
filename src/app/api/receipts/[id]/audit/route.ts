import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getReceiptAuditLog, getCurrentUserProfileId, getReceiptById } from '@/lib/db/queries';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const profileId = await getCurrentUserProfileId();
  if (!profileId) return NextResponse.json({ logs: [] });

  const { id } = await params;

  // Verify ownership
  const receipt = await getReceiptById(profileId, id);
  if (!receipt) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const logs = await getReceiptAuditLog(id);
  return NextResponse.json({ logs });
}
