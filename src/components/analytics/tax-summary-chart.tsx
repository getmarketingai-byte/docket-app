'use client';

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface TaxSummary {
  claimableTotal: number;
  notClaimableTotal: number;
  unreviewedTotal: number;
  claimableGst: number;
  totalSpend: number;
  totalGst: number;
  claimableCount: number;
  totalCount: number;
}

interface TaxSummaryChartProps {
  summary: TaxSummary;
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: 0,
  }).format(n);
}

const COLORS = {
  claimable: '#10b981',
  notClaimable: '#ef4444',
  unreviewed: '#d1d5db',
};

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number }>;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-background px-3 py-2 text-sm shadow-sm">
      <p className="font-medium">{payload[0].name}</p>
      <p>{fmt(payload[0].value)}</p>
    </div>
  );
}

export function TaxSummaryChart({ summary }: TaxSummaryChartProps) {
  const pieData = [
    { name: 'Claimable', value: summary.claimableTotal, color: COLORS.claimable },
    { name: 'Not claimable', value: summary.notClaimableTotal, color: COLORS.notClaimable },
    { name: 'Unreviewed', value: summary.unreviewedTotal, color: COLORS.unreviewed },
  ].filter((d) => d.value > 0);

  const claimablePct =
    summary.totalSpend > 0
      ? ((summary.claimableTotal / summary.totalSpend) * 100).toFixed(0)
      : '0';

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-6">
        {/* Donut chart */}
        <div className="shrink-0" style={{ width: 120, height: 120 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={32}
                outerRadius={52}
                paddingAngle={2}
                strokeWidth={0}
              >
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend + numbers */}
        <div className="flex-1 space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS.claimable }} />
            <span className="flex-1 text-muted-foreground">Claimable</span>
            <span className="font-medium text-green-600">{fmt(summary.claimableTotal)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS.notClaimable }} />
            <span className="flex-1 text-muted-foreground">Not claimable</span>
            <span className="font-medium">{fmt(summary.notClaimableTotal)}</span>
          </div>
          {summary.unreviewedTotal > 0 && (
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS.unreviewed }} />
              <span className="flex-1 text-muted-foreground">Unreviewed</span>
              <span className="font-medium">{fmt(summary.unreviewedTotal)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Key stats */}
      <div className="grid grid-cols-3 gap-3 rounded-lg bg-muted/40 p-3 text-center text-xs">
        <div>
          <p className="text-lg font-bold text-green-600">{claimablePct}%</p>
          <p className="text-muted-foreground">Claimable</p>
        </div>
        <div>
          <p className="text-lg font-bold">{fmt(summary.claimableGst)}</p>
          <p className="text-muted-foreground">GST claimable</p>
        </div>
        <div>
          <p className="text-lg font-bold">{fmt(summary.totalGst)}</p>
          <p className="text-muted-foreground">Total GST</p>
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground italic text-center">
        AI estimate — review with your accountant
      </p>
    </div>
  );
}
