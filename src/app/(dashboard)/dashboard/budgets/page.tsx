import { redirect } from 'next/navigation';
import { getCurrentUserProfileId, getBudgets, getSpendingInsights } from '@/lib/db/queries';
import { BudgetSettingsClient } from './budget-settings-client';

export const metadata = { title: 'Budgets & Insights — Docket' };

export default async function BudgetsPage() {
  const profileId = await getCurrentUserProfileId();
  if (!profileId) redirect('/sign-in');

  const [existingBudgets, insights] = await Promise.all([
    getBudgets(profileId),
    getSpendingInsights(profileId),
  ]);

  const budgetMap: Record<string, number> = {};
  for (const b of existingBudgets) {
    budgetMap[b.category] = parseFloat(b.monthlyLimit);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Budgets &amp; Insights</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Set monthly spending limits by category and track your progress.
        </p>
      </div>

      <BudgetSettingsClient
        budgetMap={budgetMap}
        insights={insights}
      />

      <p className="text-xs text-muted-foreground text-center">
        AI estimates only — review all tax decisions with your accountant.
      </p>
    </div>
  );
}
