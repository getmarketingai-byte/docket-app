'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface MonthlyTrendItem {
  month: string;
  amount: number;
  gst?: number;
}

interface SpendingChartProps {
  data: MonthlyTrendItem[];
  showGst?: boolean;
  height?: number;
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(n);
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-background px-3 py-2 text-sm shadow-sm space-y-1">
      <p className="font-medium">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {fmt(p.value)}
        </p>
      ))}
    </div>
  );
}

export function SpendingChart({ data, showGst = false, height = 180 }: SpendingChartProps) {
  if (!data.length) return null;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          className="fill-muted-foreground"
        />
        <YAxis
          tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`}
          tick={{ fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          className="fill-muted-foreground"
          width={44}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--accent))' }} />
        {showGst && <Legend wrapperStyle={{ fontSize: 11 }} />}
        <Bar dataKey="amount" name="Spend" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
        {showGst && (
          <Bar dataKey="gst" name="GST" fill="#10b981" radius={[3, 3, 0, 0]} />
        )}
      </BarChart>
    </ResponsiveContainer>
  );
}
