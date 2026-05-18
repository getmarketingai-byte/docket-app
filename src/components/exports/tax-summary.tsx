import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ATO_LABELS: Record<string, string> = {
  D1_work_related_expenses: 'D1 — Work-related expenses',
  D2_work_related_travel: 'D2 — Work-related travel',
  D3_clothing: 'D3 — Clothing & laundry',
  D4_self_education: 'D4 — Self-education',
  D5_other_deductions: 'D5 — Other deductions',
  business_expense: 'Business expense',
  non_deductible: 'Non-deductible',
  unclassified: 'Unclassified',
};

type Receipt = {
  totalAmount?: string | null;
  gstAmount?: string | null;
  taxClaimable?: boolean | null;
  taxCategory?: string | null;
  businessPercentage?: number | null;
  category?: string | null;
};

type Props = {
  receipts: Receipt[];
  fy: string;
};

function fmt(n: number) {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(n);
}

export function TaxSummary({ receipts, fy }: Props) {
  const totalSpend = receipts.reduce((s, r) => s + parseFloat(r.totalAmount ?? '0'), 0);
  const totalGst = receipts.reduce((s, r) => s + parseFloat(r.gstAmount ?? '0'), 0);

  const claimable = receipts.filter((r) => r.taxClaimable === true);
  const claimableSpend = claimable.reduce((s, r) => s + parseFloat(r.totalAmount ?? '0'), 0);
  const claimableGst = claimable.reduce((s, r) => s + parseFloat(r.gstAmount ?? '0'), 0);

  // Business/personal split
  const businessSpend = receipts.reduce((s, r) => {
    const bp = r.businessPercentage ?? 0;
    return s + parseFloat(r.totalAmount ?? '0') * (bp / 100);
  }, 0);

  // ATO category breakdown
  const byAto: Record<string, { spend: number; gst: number; count: number }> = {};
  for (const r of claimable) {
    const key = r.taxCategory ?? 'unclassified';
    if (!byAto[key]) byAto[key] = { spend: 0, gst: 0, count: 0 };
    byAto[key].spend += parseFloat(r.totalAmount ?? '0');
    byAto[key].gst += parseFloat(r.gstAmount ?? '0');
    byAto[key].count += 1;
  }

  const atoEntries = Object.entries(byAto).sort((a, b) => b[1].spend - a[1].spend);

  const fyStart = parseInt(fy) - 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          Tax Summary — FY{fy}
          <span className="text-sm font-normal text-muted-foreground ml-2">
            (Jul {fyStart} – Jun {fy})
          </span>
        </h2>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardHeader className="pb-1 pt-3 px-4">
            <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide">Total spend</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <p className="text-xl font-bold">{fmt(totalSpend)}</p>
            <p className="text-xs text-muted-foreground">{receipts.length} receipts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 pt-3 px-4">
            <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide">Total GST</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <p className="text-xl font-bold">{fmt(totalGst)}</p>
            <p className="text-xs text-muted-foreground">Input tax credits</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 pt-3 px-4">
            <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide">Claimable spend</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <p className="text-xl font-bold text-green-600">{fmt(claimableSpend)}</p>
            <p className="text-xs text-muted-foreground">{claimable.length} receipts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 pt-3 px-4">
            <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide">Claimable GST</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <p className="text-xl font-bold text-green-600">{fmt(claimableGst)}</p>
            <p className="text-xs text-muted-foreground">AI estimate</p>
          </CardContent>
        </Card>
      </div>

      {/* Business/personal split */}
      {businessSpend > 0 && (
        <Card>
          <CardContent className="px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Business use spend</p>
              <p className="text-xs text-muted-foreground">Based on business % set on each receipt</p>
            </div>
            <p className="text-lg font-bold">{fmt(businessSpend)}</p>
          </CardContent>
        </Card>
      )}

      {/* ATO breakdown */}
      {atoEntries.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Claimable by ATO Category</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="space-y-2">
              {atoEntries.map(([key, d]) => (
                <div key={key} className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm truncate">{ATO_LABELS[key] ?? key.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-muted-foreground">{d.count} receipt{d.count !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-green-600">{fmt(d.spend)}</p>
                    {d.gst > 0 && (
                      <p className="text-xs text-muted-foreground">GST {fmt(d.gst)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-muted-foreground italic">
        AI estimate — review all tax decisions with your accountant before lodging with the ATO.
      </p>
    </div>
  );
}
