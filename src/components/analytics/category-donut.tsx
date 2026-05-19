'use client';

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface CategoryItem {
  category: string;
  amount: number;
}

interface CategoryDonutProps {
  data: CategoryItem[];
}

const COLORS = [
  'hsl(var(--primary))',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
];

function fmt(n: number) {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(n);
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number }> }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-background px-3 py-2 text-sm shadow-sm">
      <p className="font-medium">{payload[0].name}</p>
      <p className="text-primary">{fmt(payload[0].value)}</p>
    </div>
  );
}

export function CategoryDonut({ data }: CategoryDonutProps) {
  if (!data.length) return null;

  const total = data.reduce((s, d) => s + d.amount, 0);

  return (
    <div className="flex items-center gap-6">
      <div className="shrink-0" style={{ width: 140, height: 140 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="amount"
              nameKey="category"
              cx="50%"
              cy="50%"
              innerRadius={38}
              outerRadius={60}
              paddingAngle={2}
              strokeWidth={0}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex-1 space-y-2 min-w-0">
        {data.map((item, i) => {
          const pct = total > 0 ? ((item.amount / total) * 100).toFixed(0) : '0';
          return (
            <div key={item.category} className="flex items-center gap-2 text-sm min-w-0">
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: COLORS[i % COLORS.length] }}
              />
              <span className="truncate text-muted-foreground flex-1">{item.category}</span>
              <span className="text-xs text-muted-foreground shrink-0">{pct}%</span>
              <span className="font-medium shrink-0">{fmt(item.amount)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
