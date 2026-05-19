import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { userProfiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { stripe } from '@/lib/stripe';

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL || 'https://docket-app-alpha.vercel.app';

export async function POST() {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const profiles = await db
    .select({ stripeCustomerId: userProfiles.stripeCustomerId })
    .from(userProfiles)
    .where(eq(userProfiles.clerkUserId, clerkUserId))
    .limit(1);

  const stripeCustomerId = profiles[0]?.stripeCustomerId;
  if (!stripeCustomerId) {
    return NextResponse.json(
      { error: 'No Stripe customer found for this account' },
      { status: 400 },
    );
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: `${BASE_URL}/dashboard/settings`,
  });

  return NextResponse.json({ url: session.url });
}
