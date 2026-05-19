'use client';

interface MerchantItem {
  merchant: string;
  amount: number;
  count?: number;
}

interface MerchantListProps {
  data: MerchantItem[];
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(n);
}

export function MerchantList({ data }: MerchantListProps) {
  if (!data.length) return <p className="text-sm text-muted-foreground">No data this month.</p>;

  const max = data[0]?.amount ?? 1;

  return (
    <div className="space-y-3">
      {data.map((item, i) => {
        const pct = (item.amount / max) * 100;
        return (
          <div key={item.merchant} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs text-muted-foreground w-4 text-right shrink-0">{i + 1}</span>
                <span className="truncate font-medium">{item.merchant}</span>
                {item.count !== undefined && (
                  <span className="text-xs text-muted-foreground shrink-0">×{item.count}</span>
                )}
              </div>
              <span className="text-muted-foreground shrink-0 ml-2">{fmt(item.amount)}</span>
            </div>
            <div className="h-1.5 rounded-full bg-secondary overflow-hidden ml-6">
              <div
                className="h-full rounded-full bg-primary opacity-70"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
