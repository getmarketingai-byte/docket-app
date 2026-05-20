import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { SettingsForm } from '@/components/settings/settings-form';
import { BillingSection } from '@/components/settings/billing-section';
import { ShareLinksSection } from '@/components/settings/share-links-section';
import { getProfile } from '@/lib/actions/settings';
import { getCurrentUserProfileId, getShareLinksForUser } from '@/lib/db/queries';

export default async function SettingsPage() {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) redirect('/sign-in');

  const [profile, profileId] = await Promise.all([
    getProfile(clerkUserId),
    getCurrentUserProfileId(),
  ]);

  const shareLinks = profileId ? await getShareLinksForUser(profileId) : [];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your profile, tax configuration, and preferences.
        </p>
      </div>

      <SettingsForm
        displayName={profile?.displayName}
        taxProfile={profile?.taxProfile as Record<string, string | null> | null}
        settings={profile?.settings as Record<string, unknown> | null}
      />

      <ShareLinksSection
        initialLinks={shareLinks.map((l) => ({
          id: l.id,
          token: l.token,
          label: l.label,
          isActive: l.isActive,
          viewCount: l.viewCount,
          expiresAt: l.expiresAt ? l.expiresAt.toISOString() : null,
          lastViewedAt: l.lastViewedAt ? l.lastViewedAt.toISOString() : null,
          createdAt: l.createdAt.toISOString(),
        }))}
      />

      <BillingSection
        subscriptionTier={profile?.subscriptionTier ?? null}
        stripeSubscriptionStatus={profile?.stripeSubscriptionStatus ?? null}
      />
    </div>
  );
}
