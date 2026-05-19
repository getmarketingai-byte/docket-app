import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SpendingChart } from '@/components/analytics/spending-chart';
import { CategoryDonut } from '@/components/analytics/category-donut';
import { MerchantList } from '@/components/analytics/merchant-list';
import { TaxSummaryChart } from '@/components/analytics/tax-summary-chart';
import { getCurrentUserProfileId, getAnalyticsData, getTaxSummary } from '@/lib/db/queries';

function fmt(n: number) {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(n);
}

export default async function AnalyticsPage() {
  const profileId = await getCurrentUserProfileId();
  if (!profileId) redirect('/sign-in');

  const [analytics, taxSummary] = await Promise.all([
    getAnalyticsData(profileId),
    getTaxSummary(profileId),
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

      <p className="text-xs text-muted-foreground text-center">
        AI estimates only — review all tax decisions with your accountant.
      </p>
    </div>
  );
}
