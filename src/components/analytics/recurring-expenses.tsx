'use client';

import { Badge } from '@/components/ui/badge';

interface RecurringItem {
  merchant: string;
  category: string | null;
  monthlyAvg: number;
  occurrences: number;
  months: string[];
  lastAmount: number;
  lastDate: Date | null;
}

interface RecurringExpensesProps {
  data: RecurringItem[];
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: 0,
  }).format(n);
}

export function RecurringExpenses({ data }: RecurringExpensesProps) {
  if (!data.length) {
    return (
      <p className="text-sm text-muted-foreground">
        No recurring patterns detected yet. Upload more receipts to identify subscriptions and regular expenses.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((item) => (
        <div
          key={item.merchant}
          className="flex items-start justify-between gap-3 py-3 border-b last:border-0"
        >
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium truncate">{item.merchant}</span>
              {item.category && (
                <Badge variant="secondary" className="text-xs capitalize">
                  {item.category}
                </Badge>
              )}
              <Badge variant="outline" className="text-xs text-blue-600 border-blue-200">
                ↻ {item.months.length} months
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {item.occurrences} receipt{item.occurrences !== 1 ? 's' : ''} · avg {fmt(item.monthlyAvg)}/mo
              {item.lastDate && (
                <> · last {new Date(item.lastDate).toLocaleDateString('en-AU', { month: 'short', day: 'numeric' })}</>
              )}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="font-semibold">{fmt(item.lastAmount)}</p>
            <p className="text-xs text-muted-foreground">last charge</p>
          </div>
        </div>
      ))}
      <p className="text-[11px] text-muted-foreground italic pt-1">
        Recurring = same merchant in 3+ of the last 6 months
      </p>
    </div>
  );
}
