'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { budgets } from '@/lib/db/schema';
import { getCurrentUserProfileId } from '@/lib/db/queries';
import { eq, and } from 'drizzle-orm';

export async function upsertBudget(category: string, monthlyLimit: number) {
  const profileId = await getCurrentUserProfileId();
  if (!profileId) throw new Error('Not authenticated');

  if (monthlyLimit < 0) throw new Error('Monthly limit must be non-negative');

  await db
    .insert(budgets)
    .values({
      userId: profileId,
      category,
      monthlyLimit: monthlyLimit.toFixed(2),
    })
    .onConflictDoUpdate({
      target: [budgets.userId, budgets.category],
      set: {
        monthlyLimit: monthlyLimit.toFixed(2),
        updatedAt: new Date(),
      },
    });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/budgets');
}

export async function deleteBudget(category: string) {
  const profileId = await getCurrentUserProfileId();
  if (!profileId) throw new Error('Not authenticated');

  await db
    .delete(budgets)
    .where(and(eq(budgets.userId, profileId), eq(budgets.category, category)));

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/budgets');
}
