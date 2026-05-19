import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { userProfiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { stripe } from '@/lib/stripe';
import { STRIPE_PRICE_IDS } from '@/lib/subscription';

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL || 'https://docket-app-alpha.vercel.app';

export async function POST(request: Request) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { tier?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const tier = body.tier as 'pro' | 'business' | undefined;
  if (!tier || (tier !== 'pro' && tier !== 'business')) {
    return NextResponse.json(
      { error: 'tier must be "pro" or "business"' },
      { status: 400 },
    );
  }

  const priceId = STRIPE_PRICE_IDS[tier];
  if (!priceId) {
    return NextResponse.json(
      { error: `Stripe price ID for "${tier}" is not configured` },
      { status: 500 },
    );
  }

  // Fetch or create user profile
  const profiles = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.clerkUserId, clerkUserId))
    .limit(1);

  let profile = profiles[0];

  if (!profile) {
    const inserted = await db
      .insert(userProfiles)
      .values({ clerkUserId })
      .returning();
    profile = inserted[0];
  }

  // Get or create Stripe customer
  let stripeCustomerId = profile.stripeCustomerId;
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      metadata: { clerkUserId },
    });
    stripeCustomerId = customer.id;

    await db
      .update(userProfiles)
      .set({ stripeCustomerId, updatedAt: new Date() })
      .where(eq(userProfiles.id, profile.id));
  }

  // Create Checkout session
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: stripeCustomerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${BASE_URL}/dashboard/settings?billing=success`,
    cancel_url: `${BASE_URL}/dashboard/settings`,
    metadata: { clerkUserId },
  });

  return NextResponse.json({ url: session.url });
}
