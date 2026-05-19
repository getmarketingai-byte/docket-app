import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/db';
import { userProfiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { STRIPE_PRICE_IDS, SubscriptionTier } from '@/lib/subscription';

/**
 * Derive the subscription tier from a Stripe price ID.
 * Falls back to 'free' if the price ID doesn't match a known tier.
 */
function tierFromPriceId(priceId: string): SubscriptionTier {
  if (priceId === STRIPE_PRICE_IDS.pro) return 'pro';
  if (priceId === STRIPE_PRICE_IDS.business) return 'business';
  return 'free';
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        '[stripe webhook] STRIPE_WEBHOOK_SECRET is not set — skipping signature verification in dev',
      );
    } else {
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 400 },
      );
    }
  }

  const text = await request.text();
  const body = Buffer.from(text);

  const headerPayload = await headers();
  const sig = headerPayload.get('stripe-signature');

  let event: Stripe.Event;

  if (webhookSecret && sig) {
    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return NextResponse.json(
        { error: `Webhook signature verification failed: ${message}` },
        { status: 400 },
      );
    }
  } else {
    // Dev mode without secret — parse the raw body directly
    try {
      event = JSON.parse(text) as Stripe.Event;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const clerkUserId = session.metadata?.clerkUserId;
        const customerId =
          typeof session.customer === 'string'
            ? session.customer
            : session.customer?.id ?? null;

        if (clerkUserId && customerId) {
          // Ensure the customer ID is linked to the user profile
          await db
            .update(userProfiles)
            .set({ stripeCustomerId: customerId, updatedAt: new Date() })
            .where(eq(userProfiles.clerkUserId, clerkUserId));
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === 'string'
            ? subscription.customer
            : subscription.customer.id;

        const status = subscription.status; // active | trialing | canceled | past_due | ...
        const priceId = subscription.items.data[0]?.price?.id ?? '';
        const tier = tierFromPriceId(priceId);

        await db
          .update(userProfiles)
          .set({
            subscriptionTier: tier,
            stripeSubscriptionId: subscription.id,
            stripeSubscriptionStatus: status,
            updatedAt: new Date(),
          })
          .where(eq(userProfiles.stripeCustomerId, customerId));
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === 'string'
            ? subscription.customer
            : subscription.customer.id;

        await db
          .update(userProfiles)
          .set({
            subscriptionTier: 'free',
            stripeSubscriptionId: subscription.id,
            stripeSubscriptionStatus: 'canceled',
            updatedAt: new Date(),
          })
          .where(eq(userProfiles.stripeCustomerId, customerId));
        break;
      }

      default:
        // Acknowledge but ignore unhandled event types
        break;
    }
  } catch (err) {
    console.error('[stripe webhook] Error processing event:', err);
    return NextResponse.json(
      { error: 'Internal error processing webhook' },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}
