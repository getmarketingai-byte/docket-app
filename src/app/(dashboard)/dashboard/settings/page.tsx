import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { SettingsForm } from '@/components/settings/settings-form';
import { BillingSection } from '@/components/settings/billing-section';
import { getProfile } from '@/lib/actions/settings';

export default async function SettingsPage() {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) redirect('/sign-in');

  const profile = await getProfile(clerkUserId);

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

      <BillingSection
        subscriptionTier={profile?.subscriptionTier ?? null}
        stripeSubscriptionStatus={profile?.stripeSubscriptionStatus ?? null}
      />
    </div>
  );
}
