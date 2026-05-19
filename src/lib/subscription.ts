export type SubscriptionTier = 'free' | 'pro' | 'business';

export const TIERS = {
  free: {
    name: 'Free',
    price: 0,
    uploadLimit: 20,
    features: [
      'Up to 20 receipt uploads',
      'AI-powered categorisation',
      'Basic tax reporting',
      'Email support',
    ],
  },
  pro: {
    name: 'Pro',
    price: 12,
    uploadLimit: Infinity,
    features: [
      'Unlimited receipt uploads',
      'AI-powered categorisation',
      'Advanced tax reporting',
      'Vehicle & fuel tracking',
      'Export to CSV / PDF',
      'Priority email support',
    ],
  },
  business: {
    name: 'Business',
    price: 29,
    uploadLimit: Infinity,
    features: [
      'Everything in Pro',
      'Multiple vehicles',
      'Team / multi-user access',
      'Bulk export & audit logs',
      'API access',
      'Dedicated support',
    ],
  },
} as const;

// Price IDs from environment variables — set these in Vercel dashboard
export const STRIPE_PRICE_IDS: Record<'pro' | 'business', string> = {
  pro: process.env.STRIPE_PRO_PRICE_ID!,
  business: process.env.STRIPE_BUSINESS_PRICE_ID!,
};

/**
 * Returns the effective subscription tier for a user.
 * Downgrades to 'free' if the subscription is not active or trialing.
 */
export function getTierFromStatus(
  tier: string | null,
  status: string | null,
): SubscriptionTier {
  if (!tier || tier === 'free') return 'free';
  if (status !== 'active' && status !== 'trialing') return 'free';
  if (tier === 'pro' || tier === 'business') return tier;
  return 'free';
}
