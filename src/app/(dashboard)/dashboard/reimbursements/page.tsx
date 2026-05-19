import Link from 'next/link';
import { redirect } from 'next/navigation';
import { buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getCurrentUserProfileId, getReimbursementStats, getReimbursableReceipts } from '@/lib/db/queries';
import { cn } from '@/lib/utils';

function fmt(n: number) {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(n);
}

function StatusBadge({ status }: { status: string | null | undefined }) {
  if (!status || status === 'pending') {
    return <Badge variant="outline" className="text-xs text-yellow-700 border-yellow-300 bg-yellow-50">Pending</Badge>;
  }
  if (status === 'submitted') {
    return <Badge variant="outline" className="text-xs text-blue-700 border-blue-300 bg-blue-50">Submitted</Badge>;
  }
  if (status === 'reimbursed') {
    return <Badge variant="outline" className="text-xs text-green-700 border-green-300 bg-green-50">Paid</Badge>;
  }
  if (status === 'declined') {
    return <Badge variant="outline" className="text-xs text-red-700 border-red-300 bg-red-50">Declined</Badge>;
  }
  return <Badge variant="secondary" className="text-xs capitalize">{status}</Badge>;
}

export default async function ReimbursementsPage() {
  const profileId = await getCurrentUserProfileId();
  if (!profileId) redirect('/sign-in');

  const [stats, allReceipts] = await Promise.all([
    getReimbursementStats(profileId),
    getReimbursableReceipts(profileId),
  ]);

  const agingTotal = stats.aging.d0_30 + stats.aging.d30_60 + stats.aging.d60_90 + stats.aging.d90plus;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Reimbursements</h1>
        <div className="flex items-center gap-2">
          {allReceipts.length > 0 && (
            <>
              <a
                href="/api/exports/reimbursements"
                className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
              >
                Export CSV
              </a>
              <a
                href="/api/exports/reimbursements/pdf"
                target="_blank"
                rel="noreferrer"
                className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
              >
                Claim PDF
              </a>
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">{fmt(stats.outstandingTotal)}</p>
            <p className="text-xs text-muted-foreground">{stats.counts.pending + stats.counts.submitted} receipts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total tracked</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.counts.total}</p>
            <p className="text-xs text-muted-foreground">receipts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Paid back</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{stats.counts.reimbursed}</p>
            <p className="text-xs text-muted-foreground">receipts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Declined</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-500">{stats.counts.declined}</p>
            <p className="text-xs text-muted-foreground">receipts</p>
          </CardContent>
        </Card>
      </div>

      {stats.counts.total === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <div className="text-5xl">💳</div>
          <h2 className="text-xl font-semibold">No reimbursements tracked</h2>
          <p className="text-muted-foreground max-w-sm">
            Mark receipts as reimbursable from the receipts page to start tracking what you&apos;re owed.
          </p>
          <Link href="/dashboard/receipts" className={cn(buttonVariants())}>
            View receipts
          </Link>
        </div>
      ) : (
        <>
          {/* By source */}
          {Object.keys(stats.bySource).length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Outstanding by source</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(stats.bySource)
                  .sort((a, b) => b[1] - a[1])
                  .map(([src, amt]) => (
                    <div key={src} className="flex justify-between items-center">
                      <span className="text-sm truncate">{src}</span>
                      <span className="text-sm font-semibold">{fmt(amt)}</span>
                    </div>
                  ))}
              </CardContent>
            </Card>
          )}

          {/* Aging */}
          {agingTotal > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Aging analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: '0–30 days', amount: stats.aging.d0_30 },
                  { label: '30–60 days', amount: stats.aging.d30_60 },
                  { label: '60–90 days', amount: stats.aging.d60_90 },
                  { label: '90+ days', amount: stats.aging.d90plus },
                ].filter(b => b.amount > 0).map((bucket) => (
                  <div key={bucket.label} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{bucket.label}</span>
                      <span className="font-medium">{fmt(bucket.amount)}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${Math.min(100, (bucket.amount / agingTotal) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Receipt list */}
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">All reimbursable receipts</h2>
            <div className="rounded-lg border divide-y">
              {allReceipts.map((r) => (
                <Link
                  key={r.id}
                  href={`/dashboard/receipts/${r.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{r.merchant ?? 'Unknown merchant'}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {r.receiptDate && (
                        <span className="text-xs text-muted-foreground">
                          {new Date(r.receiptDate).toLocaleDateString('en-AU')}
                        </span>
                      )}
                      {r.reimbursementSource && (
                        <span className="text-xs text-muted-foreground">· {r.reimbursementSource}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                    <StatusBadge status={r.reimbursementStatus} />
                    <span className="text-sm font-semibold">
                      {r.reimbursementAmount
                        ? fmt(parseFloat(r.reimbursementAmount))
                        : r.totalAmount
                          ? fmt(parseFloat(r.totalAmount))
                          : '—'}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
