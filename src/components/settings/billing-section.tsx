'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TIERS, getTierFromStatus, SubscriptionTier } from '@/lib/subscription';

type Props = {
  subscriptionTier: string | null;
  stripeSubscriptionStatus: string | null;
};

const TIER_BADGE_VARIANT: Record<SubscriptionTier, 'secondary' | 'default' | 'destructive'> = {
  free: 'secondary',
  pro: 'default',
  business: 'default',
};

export function BillingSection({ subscriptionTier, stripeSubscriptionStatus }: Props) {
  const [loading, setLoading] = useState<'pro' | 'business' | 'portal' | null>(null);

  const effectiveTier = getTierFromStatus(subscriptionTier, stripeSubscriptionStatus);
  const tierInfo = TIERS[effectiveTier];
  const isPaid = effectiveTier !== 'free';

  async function handleUpgrade(tier: 'pro' | 'business') {
    setLoading(tier);
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      });
      const data = await res.json() as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error('Checkout error:', data.error);
        setLoading(null);
      }
    } catch (err) {
      console.error('Checkout request failed:', err);
      setLoading(null);
    }
  }

  async function handleManage() {
    setLoading('portal');
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' });
      const data = await res.json() as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error('Portal error:', data.error);
        setLoading(null);
      }
    } catch (err) {
      console.error('Portal request failed:', err);
      setLoading(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="border-b pb-2 flex items-center justify-between">
        <h2 className="text-base font-semibold">Billing &amp; Plan</h2>
        <Badge variant={TIER_BADGE_VARIANT[effectiveTier]}>
          {tierInfo.name}
        </Badge>
      </div>

      {/* Current plan summary */}
      <div className="rounded-lg border p-4 space-y-3">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold">
            {tierInfo.price === 0 ? 'Free' : `$${tierInfo.price}/mo`}
          </span>
          {tierInfo.price > 0 && (
            <span className="text-sm text-muted-foreground">per month</span>
          )}
        </div>
        <ul className="space-y-1">
          {tierInfo.features.map((feature) => (
            <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="text-green-500 font-bold">✓</span>
              {feature}
            </li>
          ))}
        </ul>
      </div>

      {/* Upgrade options (not shown if on Business) */}
      {effectiveTier !== 'business' && (
        <div className="space-y-3">
          <p className="text-sm font-medium">Upgrade your plan</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {effectiveTier === 'free' && (
              <div className="rounded-lg border p-4 space-y-3">
                <div>
                  <p className="font-semibold">{TIERS.pro.name}</p>
                  <p className="text-sm text-muted-foreground">${TIERS.pro.price}/mo</p>
                </div>
                <ul className="space-y-1">
                  {TIERS.pro.features.slice(0, 3).map((f) => (
                    <li key={f} className="text-xs text-muted-foreground flex gap-1.5">
                      <span className="text-green-500">✓</span>{f}
                    </li>
                  ))}
                </ul>
                <Button
                  size="sm"
                  className="w-full"
                  disabled={loading !== null}
                  onClick={() => handleUpgrade('pro')}
                >
                  {loading === 'pro' ? (
                    <span className="flex items-center gap-2">
                      <Spinner /> Redirecting…
                    </span>
                  ) : (
                    'Upgrade to Pro'
                  )}
                </Button>
              </div>
            )}

            <div className="rounded-lg border p-4 space-y-3">
              <div>
                <p className="font-semibold">{TIERS.business.name}</p>
                <p className="text-sm text-muted-foreground">${TIERS.business.price}/mo</p>
              </div>
              <ul className="space-y-1">
                {TIERS.business.features.slice(0, 3).map((f) => (
                  <li key={f} className="text-xs text-muted-foreground flex gap-1.5">
                    <span className="text-green-500">✓</span>{f}
                  </li>
                ))}
              </ul>
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                disabled={loading !== null}
                onClick={() => handleUpgrade('business')}
              >
                {loading === 'business' ? (
                  <span className="flex items-center gap-2">
                    <Spinner /> Redirecting…
                  </span>
                ) : (
                  'Upgrade to Business'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Manage subscription (paid plans only) */}
      {isPaid && (
        <div>
          <Button
            variant="outline"
            disabled={loading !== null}
            onClick={handleManage}
          >
            {loading === 'portal' ? (
              <span className="flex items-center gap-2">
                <Spinner /> Redirecting…
              </span>
            ) : (
              'Manage subscription'
            )}
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Update payment method, view invoices, or cancel your subscription.
          </p>
        </div>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <svg
      className="animate-spin h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
