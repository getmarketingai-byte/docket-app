import { isAdmin } from '@/lib/admin';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { userFeedback } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';
import { AdminFeedbackTable } from '@/components/admin/admin-feedback-table';

export default async function AdminFeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  if (!(await isAdmin())) redirect('/dashboard');

  const { status, page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? '1'));
  const limit = 50;
  const offset = (page - 1) * limit;

  const statusFilter = status && status !== 'all' ? status : undefined;

  const rows = await db
    .select()
    .from(userFeedback)
    .where(statusFilter ? eq(userFeedback.status, statusFilter) : undefined)
    .orderBy(desc(userFeedback.createdAt))
    .limit(limit)
    .offset(offset);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">User Feedback</h1>
          <p className="text-muted-foreground text-sm">Review and manage feedback from users.</p>
        </div>
        <AdminFeedbackTable feedback={rows} currentStatus={status ?? 'all'} />
      </div>
    </div>
  );
}
