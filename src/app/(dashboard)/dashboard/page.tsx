import Link from 'next/link';
import { redirect } from 'next/navigation';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ReceiptCard } from '@/components/receipts/receipt-card';
import { SpendingChart } from '@/components/analytics/spending-chart';
import { CategoryDonut } from '@/components/analytics/category-donut';
import { MerchantList } from '@/components/analytics/merchant-list';
import { TaxSummary } from '@/components/analytics/tax-summary';
import {
  getCurrentUserProfileId,
  getUserReceipts,
  getDashboardStats,
  getReimbursementStats,
  getBudgetMap,
  getSpendingInsights,
  getTaxSummary,
} from '@/lib/db/queries';
import { cn } from '@/lib/utils';

function fmt(n: number) {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(n);
}

export default async function DashboardPage() {
  const profileId = await getCurrentUserProfileId();
  if (!profileId) redirect('/sign-in');

  const [stats, recentReceipts, reimbStats, budgetMap, insights, taxSummary] = await Promise.all([
    getDashboardStats(profileId),
    getUserReceipts(profileId, { limit: 6, sortBy: 'date' }),
    getReimbursementStats(profileId),
    getBudgetMap(profileId),
    getSpendingInsights(profileId),
    getTaxSummary(profileId),
  ]);

  const hasAnalyticsData = insights.monthlyTrend.some((m) => m.amount > 0);

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

      {/* Visual analytics — only show when there's data */}
      {hasAnalyticsData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Monthly spending chart */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Monthly spending</CardTitle>
                <div className="flex items-baseline gap-3 text-sm">
                  <span className="text-muted-foreground">This month</span>
                  <span className="font-bold">{fmt(insights.thisMonthTotal)}</span>
                  {insights.lastMonthTotal > 0 && (
                    <span className={cn(
                      'text-xs',
                      insights.thisMonthTotal > insights.lastMonthTotal ? 'text-red-500' : 'text-green-600'
                    )}>
                      {insights.thisMonthTotal > insights.lastMonthTotal ? '▲' : '▼'}
                      {' '}
                      {Math.abs(((insights.thisMonthTotal - insights.lastMonthTotal) / insights.lastMonthTotal) * 100).toFixed(0)}%
                      {' vs last month'}
                    </span>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <SpendingChart data={insights.monthlyTrend} />
            </CardContent>
          </Card>

          {/* Category breakdown */}
          {insights.topCategories.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Spending by category</CardTitle>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardHeader>
              <CardContent>
                <CategoryDonut data={insights.topCategories} />
              </CardContent>
            </Card>
          )}

          {/* Top merchants */}
          {insights.topMerchants.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Top merchants</CardTitle>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardHeader>
              <CardContent>
                <MerchantList data={insights.topMerchants} />
              </CardContent>
            </Card>
          )}

          {/* Tax summary */}
          {taxSummary.totalCount > 0 && (
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Tax summary</CardTitle>
              </CardHeader>
              <CardContent>
                <TaxSummary
                  fyLabel={taxSummary.fyLabel}
                  claimableTotal={taxSummary.claimableTotal}
                  nonClaimableTotal={taxSummary.nonClaimableTotal}
                  uncertainTotal={taxSummary.uncertainTotal}
                  gstTotal={taxSummary.gstTotal}
                  claimableCount={taxSummary.claimableCount}
                  totalCount={taxSummary.totalCount}
                />
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Reimbursement widget */}
      {reimbStats.counts.total > 0 && (
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Reimbursements</CardTitle>
            <Link href="/dashboard/reimbursements" className="text-xs text-primary hover:underline">
              View all →
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-blue-600">{fmt(reimbStats.outstandingTotal)}</span>
              <span className="text-sm text-muted-foreground">outstanding</span>
            </div>
            {Object.keys(reimbStats.bySource).length > 0 && (
              <div className="space-y-1">
                {Object.entries(reimbStats.bySource).slice(0, 3).map(([src, amt]) => (
                  <div key={src} className="flex justify-between text-sm">
                    <span className="text-muted-foreground truncate">{src}</span>
                    <span className="font-medium">{fmt(amt)}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="grid grid-cols-4 gap-2 text-xs text-center pt-1 border-t">
              <div><p className="font-medium">{reimbStats.counts.pending}</p><p className="text-muted-foreground">Pending</p></div>
              <div><p className="font-medium">{reimbStats.counts.submitted}</p><p className="text-muted-foreground">Submitted</p></div>
              <div><p className="font-medium text-green-600">{reimbStats.counts.reimbursed}</p><p className="text-muted-foreground">Paid</p></div>
              <div><p className="font-medium text-red-500">{reimbStats.counts.declined}</p><p className="text-muted-foreground">Declined</p></div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Budget widget */}
      {Object.keys(budgetMap).length > 0 && (
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Budgets this month</CardTitle>
            <Link href="/dashboard/budgets" className="text-xs text-primary hover:underline">
              Manage →
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(budgetMap).slice(0, 4).map(([cat, limit]) => {
              const spent = insights.categorySpendThisMonth[cat] ??
                (cat === 'overall' ? insights.thisMonthTotal : 0);
              const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
              const over = spent > limit;
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="capitalize">{cat}</span>
                    <span className={over ? 'text-red-600 font-medium' : 'text-muted-foreground'}>
                      {fmt(spent)} / {fmt(limit)}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div
                      className={`h-full rounded-full ${over ? 'bg-red-500' : pct > 80 ? 'bg-yellow-500' : 'bg-primary'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
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
              <Link key={r.id} href={`/dashboard/receipts/${r.id}`}>
                <ReceiptCard
                  id={r.id}
                  merchant={r.merchant}
                  totalAmount={r.totalAmount}
                  receiptDate={r.receiptDate}
                  category={r.category}
                  gstAmount={r.gstAmount}
                  taxClaimable={r.taxClaimable}
                  taxClaimableConfidence={r.taxClaimableConfidence}
                  status={r.status}
                  reimbursable={r.reimbursable}
                />
              </Link>
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
