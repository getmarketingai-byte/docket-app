import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SpendingChart } from '@/components/analytics/spending-chart';
import { CategoryDonut } from '@/components/analytics/category-donut';
import { MerchantList } from '@/components/analytics/merchant-list';
import { TaxSummaryChart } from '@/components/analytics/tax-summary-chart';
import { RecurringExpenses } from '@/components/analytics/recurring-expenses';
import {
  getCurrentUserProfileId,
  getAnalyticsData,
  getTaxSummary,
  getRecurringExpenses,
  getDuplicateReceipts,
} from '@/lib/db/queries';

function fmt(n: number) {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(n);
}

export default async function AnalyticsPage() {
  const profileId = await getCurrentUserProfileId();
  if (!profileId) redirect('/sign-in');

  const [analytics, taxSummary, recurring, duplicates] = await Promise.all([
    getAnalyticsData(profileId),
    getTaxSummary(profileId),
    getRecurringExpenses(profileId),
    getDuplicateReceipts(profileId),
  ]);

  const hasData = analytics.monthlySpend.some((m) => m.amount > 0);

  if (!hasData) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <div className="text-5xl">📊</div>
          <h2 className="text-xl font-semibold">No data yet</h2>
          <p className="text-muted-foreground max-w-sm">
            Upload and process receipts to see spending charts, merchant insights, and tax breakdowns here.
          </p>
        </div>
      </div>
    );
  }

  // Claimable % for headline
  const claimablePct =
    analytics.taxSummary.totalSpend > 0
      ? ((analytics.taxSummary.claimableTotal / analytics.taxSummary.totalSpend) * 100).toFixed(0)
      : '0';

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">Last 6 months · {taxSummary.fyLabel} tax year</p>
      </div>

      {/* Headline stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Total spend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{fmt(analytics.taxSummary.totalSpend)}</p>
            <p className="text-xs text-muted-foreground">Last 6 months</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Total GST
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{fmt(analytics.taxSummary.totalGst)}</p>
            <p className="text-xs text-muted-foreground">Last 6 months</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Claimable
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{fmt(analytics.taxSummary.claimableTotal)}</p>
            <p className="text-xs text-muted-foreground italic">AI estimate</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Claimable rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{claimablePct}%</p>
            <p className="text-xs text-muted-foreground italic">AI estimate</p>
          </CardContent>
        </Card>
      </div>

      {/* Spending trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Monthly spending trend</CardTitle>
        </CardHeader>
        <CardContent>
          <SpendingChart data={analytics.monthlySpend} showGst height={220} />
        </CardContent>
      </Card>

      {/* Category + Tax summary row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Spending by category</CardTitle>
            <p className="text-xs text-muted-foreground">Last 6 months</p>
          </CardHeader>
          <CardContent>
            {analytics.categoryBreakdown.length > 0 ? (
              <CategoryDonut data={analytics.categoryBreakdown} />
            ) : (
              <p className="text-sm text-muted-foreground">No category data yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Tax summary ({taxSummary.fyLabel})</CardTitle>
          </CardHeader>
          <CardContent>
            <TaxSummaryChart
              summary={{
                claimableTotal: taxSummary.claimableTotal,
                notClaimableTotal: taxSummary.nonClaimableTotal,
                unreviewedTotal: taxSummary.uncertainTotal,
                claimableGst: analytics.taxSummary.claimableGst,
                totalSpend: taxSummary.claimableTotal + taxSummary.nonClaimableTotal + taxSummary.uncertainTotal,
                totalGst: taxSummary.gstTotal,
                claimableCount: taxSummary.claimableCount,
                totalCount: taxSummary.totalCount,
              }}
            />
          </CardContent>
        </Card>
      </div>

      {/* Top merchants */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Top merchants</CardTitle>
          <p className="text-xs text-muted-foreground">Last 6 months · by total spend</p>
        </CardHeader>
        <CardContent>
          {analytics.topMerchants.length > 0 ? (
            <MerchantList data={analytics.topMerchants} />
          ) : (
            <p className="text-sm text-muted-foreground">No merchant data yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Claimable by ATO category */}
      {taxSummary.claimableByCategory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Claimable by category ({taxSummary.fyLabel})</CardTitle>
            <p className="text-xs text-muted-foreground italic">AI estimate — review with your accountant</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {taxSummary.claimableByCategory.map((item) => {
                const pct = taxSummary.claimableTotal > 0
                  ? (item.amount / taxSummary.claimableTotal) * 100
                  : 0;
                return (
                  <div key={item.category} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="capitalize">{item.category}</span>
                      <span className="font-medium text-green-600">{fmt(item.amount)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full rounded-full bg-green-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recurring expenses */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Recurring expenses</CardTitle>
          <p className="text-xs text-muted-foreground">Merchants appearing in 3+ months over last 6 months</p>
        </CardHeader>
        <CardContent>
          <RecurringExpenses data={recurring} />
        </CardContent>
      </Card>

      {/* Duplicate receipts */}
      {duplicates.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-medium">Possible duplicates</CardTitle>
              <p className="text-xs text-muted-foreground">{duplicates.length} receipt{duplicates.length !== 1 ? 's' : ''} flagged as potential duplicates</p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {duplicates.slice(0, 8).map((d) => (
                <div key={d.id} className="flex items-center justify-between gap-3 py-2 border-b last:border-0 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{d.merchant ?? 'Unknown merchant'}</p>
                    <p className="text-xs text-muted-foreground">
                      {d.receiptDate ? new Date(d.receiptDate).toLocaleDateString('en-AU') : '—'}
                      {d.totalAmount && ` · $${parseFloat(d.totalAmount).toFixed(2)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/dashboard/receipts/${d.id}`}
                      className="text-xs text-primary hover:underline"
                    >
                      Review →
                    </Link>
                  </div>
                </div>
              ))}
              {duplicates.length > 8 && (
                <p className="text-xs text-muted-foreground pt-1">+ {duplicates.length - 8} more — review receipts to dismiss false positives</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-muted-foreground text-center">
        AI estimates only — review all tax decisions with your accountant.
      </p>
    </div>
  );
}
