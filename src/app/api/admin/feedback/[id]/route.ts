import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { userFeedback } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { isAdmin } from '@/lib/admin';

const VALID_STATUSES = ['new', 'reviewing', 'approved', 'rejected', 'implemented'];
const VALID_PRIORITIES = ['critical', 'high', 'medium', 'low'];

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;

  let body: { status?: string; ceoNotes?: string; priority?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const updates: Record<string, string | null> = { updatedAt: new Date().toISOString() };

  if (body.status !== undefined) {
    if (!VALID_STATUSES.includes(body.status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }
    updates.status = body.status;
  }

  if (body.ceoNotes !== undefined) {
    updates.ceoNotes = body.ceoNotes ?? null;
  }

  if (body.priority !== undefined) {
    if (body.priority && !VALID_PRIORITIES.includes(body.priority)) {
      return NextResponse.json({ error: 'Invalid priority' }, { status: 400 });
    }
    updates.priority = body.priority || null;
  }

  const [row] = await db
    .update(userFeedback)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(userFeedback.id, id))
    .returning();

  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ feedback: row });
}
