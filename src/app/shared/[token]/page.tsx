import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { shareTokens, receipts } from '@/lib/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';

type Receipt = {
  id: string;
  merchant: string | null;
  merchantAbn: string | null;
  receiptDate: Date | null;
  totalAmount: string | null;
  gstAmount: string | null;
  category: string | null;
  taxCategory: string | null;
  taxClaimable: boolean | null;
  paymentMethod: string | null;
  notes: string | null;
  compressedBlobUrl: string | null;
  originalBlobUrl: string | null;
  businessPercentage: number | null;
};

function fmt(n: string | null) {
  if (!n) return '—';
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(parseFloat(n));
}

type PageProps = { params: Promise<{ token: string }> };

export default async function SharedPortalPage({ params }: PageProps) {
  const { token } = await params;

  const [share] = await db
    .select()
    .from(shareTokens)
    .where(eq(shareTokens.token, token))
    .limit(1);

  if (!share || share.revokedAt || (share.expiresAt && share.expiresAt < new Date())) {
    notFound();
  }

  const conditions = [
    eq(receipts.userId, share.userId),
    eq(receipts.status, 'complete'),
  ];
  if (share.dateFrom) conditions.push(gte(receipts.receiptDate, share.dateFrom));
  if (share.dateTo) conditions.push(lte(receipts.receiptDate, share.dateTo));

  const rows = await db
    .select({
      id: receipts.id,
      merchant: receipts.merchant,
      merchantAbn: receipts.merchantAbn,
      receiptDate: receipts.receiptDate,
      totalAmount: receipts.totalAmount,
      gstAmount: receipts.gstAmount,
      category: receipts.category,
      taxCategory: receipts.taxCategory,
      taxClaimable: receipts.taxClaimable,
      paymentMethod: receipts.paymentMethod,
      notes: receipts.notes,
      compressedBlobUrl: receipts.compressedBlobUrl,
      originalBlobUrl: receipts.originalBlobUrl,
      businessPercentage: receipts.businessPercentage,
    })
    .from(receipts)
    .where(and(...conditions))
    .orderBy(receipts.receiptDate);

  const totalSpend = rows.reduce((sum, r) => sum + (r.totalAmount ? parseFloat(r.totalAmount) : 0), 0);
  const totalGst = rows.reduce((sum, r) => sum + (r.gstAmount ? parseFloat(r.gstAmount) : 0), 0);
  const claimableCount = rows.filter(r => r.taxClaimable).length;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-5xl mx-auto px-4 py-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold">Docket — {share.label}</h1>
              <p className="text-sm text-muted-foreground">
                Read-only receipt portal
                {share.dateFrom && ` · From ${new Date(share.dateFrom).toLocaleDateString('en-AU')}`}
                {share.dateTo && ` · To ${new Date(share.dateTo).toLocaleDateString('en-AU')}`}
              </p>
            </div>
            <div className="text-right text-xs text-muted-foreground">
              {share.expiresAt && (
                <p>Expires {new Date(share.expiresAt).toLocaleDateString('en-AU')}</p>
              )}
              <p className="italic mt-0.5">AI estimates — review with accountant</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Receipts', value: rows.length.toString() },
            { label: 'Total spend', value: fmt(totalSpend.toFixed(2)) },
            { label: 'Total GST', value: fmt(totalGst.toFixed(2)) },
            { label: 'Claimable', value: `${claimableCount} of ${rows.length}` },
          ].map(stat => (
            <div key={stat.label} className="rounded-lg border bg-card p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">{stat.label}</p>
              <p className="text-xl font-bold mt-1">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Receipt table */}
        {rows.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p>No receipts found for this period.</p>
          </div>
        ) : (
          <div className="rounded-xl border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Merchant</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Category</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">GST</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Total</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">Claimable</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {rows.map((r: Receipt) => (
                    <tr key={r.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                        {r.receiptDate
                          ? new Date(r.receiptDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{r.merchant ?? '—'}</p>
                        {r.merchantAbn && <p className="text-xs text-muted-foreground">ABN {r.merchantAbn}</p>}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground capitalize">
                        {r.category?.replace(/_/g, ' ') ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-right">{fmt(r.gstAmount)}</td>
                      <td className="px-4 py-3 text-right font-semibold">{fmt(r.totalAmount)}</td>
                      <td className="px-4 py-3 text-center">
                        {r.taxClaimable === true ? (
                          <span className="inline-flex items-center gap-1 text-green-600 text-xs font-medium">✓ Yes</span>
                        ) : r.taxClaimable === false ? (
                          <span className="text-muted-foreground text-xs">No</span>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {(r.compressedBlobUrl || r.originalBlobUrl) ? (
                          <a
                            href={r.compressedBlobUrl ?? r.originalBlobUrl ?? ''}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary text-xs hover:underline"
                          >
                            View →
                          </a>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-muted/30 border-t font-semibold">
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-muted-foreground">
                      {rows.length} receipt{rows.length !== 1 ? 's' : ''}
                    </td>
                    <td className="px-4 py-3 text-right">{fmt(totalGst.toFixed(2))}</td>
                    <td className="px-4 py-3 text-right">{fmt(totalSpend.toFixed(2))}</td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        <p className="text-xs text-center text-muted-foreground">
          AI estimates only — all tax decisions should be reviewed with a qualified accountant.
          This is a read-only view generated by Docket.
        </p>
      </div>
    </div>
  );
}
