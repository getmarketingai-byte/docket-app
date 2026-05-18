'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { userProfiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function saveSettings(formData: FormData) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) throw new Error('Unauthorized');

  const profiles = await db
    .select({ id: userProfiles.id })
    .from(userProfiles)
    .where(eq(userProfiles.clerkUserId, clerkUserId))
    .limit(1);

  if (!profiles[0]) {
    // Create profile if it doesn't exist (fallback for users who joined before webhook was set up)
    await db.insert(userProfiles).values({ clerkUserId });
    return saveSettings(formData); // retry
  }

  const taxProfile = {
    abn: formData.get('abn') || null,
    entityType: formData.get('entityType') || null,
    industry: formData.get('industry') || null,
    fyPreference: formData.get('fyPreference') || null,
  };

  const displayName = (formData.get('displayName') as string) || null;
  const defaultBusinessPct = parseInt((formData.get('defaultBusinessPct') as string) ?? '0') || 0;

  await db
    .update(userProfiles)
    .set({
      displayName,
      taxProfile,
      settings: { defaultBusinessPercentage: defaultBusinessPct },
      updatedAt: new Date(),
    })
    .where(eq(userProfiles.id, profiles[0].id));

  revalidatePath('/dashboard/settings');
}

export async function getProfile(clerkUserId: string) {
  const profiles = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.clerkUserId, clerkUserId))
    .limit(1);
  return profiles[0] ?? null;
}
