import Link from 'next/link';
import { redirect } from 'next/navigation';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ReceiptCard } from '@/components/receipts/receipt-card';
import { getCurrentUserProfileId, getUserReceipts, getDashboardStats } from '@/lib/db/queries';
import { cn } from '@/lib/utils';

function fmt(n: number) {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(n);
}

export default async function DashboardPage() {
  const profileId = await getCurrentUserProfileId();
  if (!profileId) redirect('/sign-in');

  const [stats, recentReceipts] = await Promise.all([
    getDashboardStats(profileId),
    getUserReceipts(profileId, { limit: 6, sortBy: 'date' }),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Link href="/dashboard/upload" className={cn(buttonVariants({ size: 'sm' }))}>
          Upload receipts
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Total receipts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Total spend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{fmt(stats.totalSpend)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Total GST
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{fmt(stats.totalGst)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Claimable spend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{fmt(stats.claimableAmount)}</p>
            <p className="text-xs text-muted-foreground italic">AI estimate</p>
          </CardContent>
        </Card>
      </div>

      {stats.pendingReview > 0 && (
        <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4 flex items-center justify-between">
          <span className="text-sm text-yellow-800">
            {stats.pendingReview} receipt{stats.pendingReview !== 1 ? 's' : ''} still processing…
          </span>
          <Link href="/dashboard/upload" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
            View
          </Link>
        </div>
      )}

      {/* Recent receipts */}
      {recentReceipts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Recent receipts
            </h2>
            <Link href="/dashboard/receipts" className="text-xs text-primary hover:underline">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentReceipts.map((r) => (
              <ReceiptCard
                key={r.id}
                id={r.id}
                merchant={r.merchant}
                totalAmount={r.totalAmount}
                receiptDate={r.receiptDate}
                category={r.category}
                gstAmount={r.gstAmount}
                taxClaimable={r.taxClaimable}
                taxClaimableConfidence={r.taxClaimableConfidence}
                status={r.status}
              />
            ))}
          </div>
        </div>
      )}

      {stats.total === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <div className="text-5xl">🧾</div>
          <h2 className="text-xl font-semibold">Welcome to Docket</h2>
          <p className="text-muted-foreground max-w-sm">
            Upload your first receipt and AI will extract and categorise it automatically.
          </p>
          <Link href="/dashboard/upload" className={cn(buttonVariants())}>
            Upload receipts
          </Link>
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center">
        AI estimates only — review all tax decisions with your accountant.
      </p>
    </div>
  );
}
