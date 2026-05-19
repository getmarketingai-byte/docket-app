'use client';

interface TaxSummaryProps {
  claimableTotal: number;
  nonClaimableTotal: number;
  uncertainTotal: number;
  gstTotal: number;
  claimableCount: number;
  totalCount: number;
  fyLabel: string;
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(n);
}

export function TaxSummary({
  claimableTotal,
  nonClaimableTotal,
  uncertainTotal,
  gstTotal,
  claimableCount,
  totalCount,
  fyLabel,
}: TaxSummaryProps) {
  const totalSpend = claimableTotal + nonClaimableTotal + uncertainTotal;
  const claimablePct = totalSpend > 0 ? (claimableTotal / totalSpend) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{fyLabel} year-to-date</span>
        <span>{claimableCount} of {totalCount} receipts claimable</span>
      </div>

      {/* Stacked bar */}
      <div className="h-3 rounded-full bg-secondary overflow-hidden flex">
        <div
          className="h-full bg-green-500 transition-all"
          style={{ width: `${claimablePct}%` }}
          title={`Claimable: ${fmt(claimableTotal)}`}
        />
        {uncertainTotal > 0 && (
          <div
            className="h-full bg-yellow-400 transition-all"
            style={{ width: `${totalSpend > 0 ? (uncertainTotal / totalSpend) * 100 : 0}%` }}
            title={`Uncertain: ${fmt(uncertainTotal)}`}
          />
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 text-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-green-500 shrink-0" />
            <span className="text-xs text-muted-foreground">Claimable</span>
          </div>
          <p className="font-bold text-green-600">{fmt(claimableTotal)}</p>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-yellow-400 shrink-0" />
            <span className="text-xs text-muted-foreground">Uncertain</span>
          </div>
          <p className="font-bold text-yellow-600">{fmt(uncertainTotal)}</p>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-secondary shrink-0 border" />
            <span className="text-xs text-muted-foreground">GST paid</span>
          </div>
          <p className="font-bold">{fmt(gstTotal)}</p>
        </div>
      </div>

      <p className="text-xs text-muted-foreground italic">
        AI estimate — review all tax decisions with your accountant.
      </p>
    </div>
  );
}
