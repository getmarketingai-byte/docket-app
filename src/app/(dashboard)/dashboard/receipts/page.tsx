import Link from 'next/link';
import { redirect } from 'next/navigation';
import { buttonVariants } from '@/components/ui/button';
import { ReceiptsTimeline } from '@/components/receipts/receipts-timeline';
import { getCurrentUserProfileId, getUserReceipts } from '@/lib/db/queries';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 24;

function getDateLabel(date: Date | null): string {
  if (!date) return 'Unknown date';
  const d = new Date(date);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = Math.floor((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));

  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return 'This Week';
  if (diff < 14) return 'Last Week';
  if (diff < 31) return 'This Month';

  return d.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' });
}

type PageProps = {
  searchParams: Promise<{ page?: string }>;
};

export default async function ReceiptsPage({ searchParams }: PageProps) {
  const { page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? '1'));
  const offset = (page - 1) * PAGE_SIZE;

  const profileId = await getCurrentUserProfileId();
  if (!profileId) redirect('/sign-in');

  const allReceipts = await getUserReceipts(profileId, {
    limit: PAGE_SIZE + 1,
    offset,
    sortBy: 'date',
  });

  const hasMore = allReceipts.length > PAGE_SIZE;
  const receipts = allReceipts.slice(0, PAGE_SIZE);

  const groups: { label: string; items: typeof receipts }[] = [];
  let currentLabel = '';

  for (const r of receipts) {
    const label = getDateLabel(r.receiptDate);
    if (label !== currentLabel) {
      groups.push({ label, items: [] });
      currentLabel = label;
    }
    groups[groups.length - 1].items.push(r);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Receipts</h1>
        <Link href="/dashboard/upload" className={cn(buttonVariants({ size: 'sm' }))}>
          Upload
        </Link>
      </div>

      {receipts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <div className="text-5xl">🧾</div>
          <h2 className="text-xl font-semibold">No receipts yet</h2>
          <p className="text-muted-foreground max-w-sm">
            Upload your first receipt and let AI extract and categorise it automatically.
          </p>
          <Link href="/dashboard/upload" className={cn(buttonVariants())}>
            Upload receipts
          </Link>
        </div>
      ) : (
        <>
          <ReceiptsTimeline groups={groups} />

          <div className="flex justify-between items-center pt-4">
            {page > 1 ? (
              <Link href={`/dashboard/receipts?page=${page - 1}`} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
                ← Previous
              </Link>
            ) : (
              <div />
            )}
            {hasMore && (
              <Link href={`/dashboard/receipts?page=${page + 1}`} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
                Next →
              </Link>
            )}
          </div>
        </>
      )}
    </div>
  );
}
