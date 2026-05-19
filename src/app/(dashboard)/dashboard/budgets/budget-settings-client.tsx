'use client';

import { useState, useTransition } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { upsertBudget, deleteBudget } from '@/lib/actions/budgets';
import { Trash2, Plus, TrendingUp, TrendingDown } from 'lucide-react';

const CATEGORY_OPTIONS = [
  'overall',
  'fuel',
  'meals',
  'office supplies',
  'travel',
  'accommodation',
  'equipment',
  'subscriptions',
  'professional services',
  'utilities',
  'advertising',
  'other',
];

type SpendingInsights = {
  topCategories: { category: string; amount: number }[];
  topMerchants: { merchant: string; amount: number }[];
  thisMonthTotal: number;
  lastMonthTotal: number;
  avg3Month: number;
  avgReceiptValue: number;
  monthlyTrend: { month: string; amount: number }[];
  categorySpendThisMonth: Record<string, number>;
  thisMonthCount: number;
};

function fmt(n: number) {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(n);
}

function BudgetRow({
  category,
  limit,
  spent,
  onDelete,
}: {
  category: string;
  limit: number;
  spent: number;
  onDelete: () => void;
}) {
  const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
  const over = spent > limit && limit > 0;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium capitalize">{category}</span>
        <div className="flex items-center gap-3">
          <span className={over ? 'text-red-600 font-medium' : 'text-muted-foreground'}>
            {fmt(spent)} / {fmt(limit)}
          </span>
          <button onClick={onDelete} className="text-muted-foreground hover:text-red-500">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div className="h-2 rounded-full bg-secondary overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${over ? 'bg-red-500' : pct > 80 ? 'bg-yellow-500' : 'bg-primary'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {over && (
        <p className="text-xs text-red-600">
          Over budget by {fmt(spent - limit)}
        </p>
      )}
    </div>
  );
}

export function BudgetSettingsClient({
  budgetMap,
  insights,
}: {
  budgetMap: Record<string, number>;
  insights: SpendingInsights;
}) {
  const [budgets, setBudgets] = useState(budgetMap);
  const [newCategory, setNewCategory] = useState('');
  const [newLimit, setNewLimit] = useState('');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');

  const handleAdd = () => {
    const cat = newCategory.trim().toLowerCase();
    const limit = parseFloat(newLimit);
    if (!cat || isNaN(limit) || limit < 0) {
      setError('Please enter a valid category and amount.');
      return;
    }
    setError('');
    startTransition(async () => {
      await upsertBudget(cat, limit);
      setBudgets((prev) => ({ ...prev, [cat]: limit }));
      setNewCategory('');
      setNewLimit('');
    });
  };

  const handleDelete = (category: string) => {
    startTransition(async () => {
      await deleteBudget(category);
      setBudgets((prev) => {
        const next = { ...prev };
        delete next[category];
        return next;
      });
    });
  };

  const trend = insights.thisMonthTotal - insights.lastMonthTotal;
  const trendPct =
    insights.lastMonthTotal > 0
      ? ((trend / insights.lastMonthTotal) * 100).toFixed(1)
      : null;

  return (
    <div className="space-y-8">
      {/* Spending summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              This month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{fmt(insights.thisMonthTotal)}</p>
            {trendPct && (
              <p className={`text-xs flex items-center gap-1 mt-1 ${trend > 0 ? 'text-red-500' : 'text-green-600'}`}>
                {trend > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {Math.abs(parseFloat(trendPct))}% vs last month
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Last month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{fmt(insights.lastMonthTotal)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              3-month avg
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{fmt(insights.avg3Month)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Avg receipt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{fmt(insights.avgReceiptValue)}</p>
            <p className="text-xs text-muted-foreground">{insights.thisMonthCount} this month</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Monthly trend chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Monthly spend (6 months)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={insights.monthlyTrend} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `$${v}`} width={50} />
                <Tooltip
                  formatter={(v) => fmt(Number(v ?? 0))}
                  labelStyle={{ fontSize: 12 }}
                  contentStyle={{ fontSize: 12 }}
                />
                <Bar dataKey="amount" radius={[3, 3, 0, 0]}>
                  {insights.monthlyTrend.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={i === insights.monthlyTrend.length - 1 ? 'hsl(var(--primary))' : 'hsl(var(--primary) / 0.4)'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top categories */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Top categories this month</CardTitle>
          </CardHeader>
          <CardContent>
            {insights.topCategories.length === 0 ? (
              <p className="text-sm text-muted-foreground">No receipts this month.</p>
            ) : (
              <div className="space-y-3">
                {insights.topCategories.map(({ category, amount }) => {
                  const max = insights.topCategories[0].amount;
                  return (
                    <div key={category} className="space-y-0.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="capitalize">{category}</span>
                        <span className="font-medium">{fmt(amount)}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${(amount / max) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top merchants */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Top merchants this month</CardTitle>
          </CardHeader>
          <CardContent>
            {insights.topMerchants.length === 0 ? (
              <p className="text-sm text-muted-foreground">No receipts this month.</p>
            ) : (
              <div className="space-y-2">
                {insights.topMerchants.map(({ merchant, amount }) => (
                  <div key={merchant} className="flex items-center justify-between text-sm">
                    <span className="truncate max-w-[200px]">{merchant}</span>
                    <span className="font-medium tabular-nums">{fmt(amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Budget settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Monthly budgets</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {Object.entries(budgets).length === 0 ? (
              <p className="text-sm text-muted-foreground">No budgets set yet.</p>
            ) : (
              <div className="space-y-4">
                {Object.entries(budgets).map(([cat, limit]) => (
                  <BudgetRow
                    key={cat}
                    category={cat}
                    limit={limit}
                    spent={insights.categorySpendThisMonth[cat] ?? (cat === 'overall' ? insights.thisMonthTotal : 0)}
                    onDelete={() => handleDelete(cat)}
                  />
                ))}
              </div>
            )}

            <div className="border-t pt-4 space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Add budget
              </p>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label className="sr-only" htmlFor="cat-input">Category</Label>
                  <Input
                    id="cat-input"
                    list="cat-options"
                    placeholder="Category (e.g. meals)"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                  />
                  <datalist id="cat-options">
                    {CATEGORY_OPTIONS.map((o) => (
                      <option key={o} value={o} />
                    ))}
                  </datalist>
                </div>
                <div className="w-28">
                  <Label className="sr-only" htmlFor="limit-input">Monthly limit</Label>
                  <Input
                    id="limit-input"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="$500"
                    value={newLimit}
                    onChange={(e) => setNewLimit(e.target.value)}
                  />
                </div>
                <Button
                  size="sm"
                  onClick={handleAdd}
                  disabled={isPending}
                  className="shrink-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {error && <p className="text-xs text-red-500">{error}</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
