import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { userFeedback } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { isAdmin } from '@/lib/admin';

export async function GET(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const url = new URL(req.url);
  const status = url.searchParams.get('status') ?? undefined;
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1'));
  const limit = 50;
  const offset = (page - 1) * limit;

  const conditions = status && status !== 'all'
    ? [eq(userFeedback.status, status)]
    : [];

  const rows = await db
    .select()
    .from(userFeedback)
    .where(conditions.length ? conditions[0] : undefined)
    .orderBy(desc(userFeedback.createdAt))
    .limit(limit)
    .offset(offset);

  return NextResponse.json({ feedback: rows, page, limit });
}
