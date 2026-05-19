import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { db } from '@/lib/db';
import { userProfiles } from '@/lib/db/schema';

type ClerkUserCreatedEvent = {
  type: 'user.created';
  data: {
    id: string;
    first_name?: string | null;
    last_name?: string | null;
    email_addresses: Array<{ email_address: string }>;
  };
};

type ClerkEvent = ClerkUserCreatedEvent;

export async function POST(req: Request) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  const headerPayload = await headers();
  const svixId = headerPayload.get('svix-id');
  const svixTimestamp = headerPayload.get('svix-timestamp');
  const svixSignature = headerPayload.get('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(webhookSecret);
  let event: ClerkEvent;

  try {
    event = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as ClerkEvent;
  } catch {
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
  }

  if (event.type === 'user.created') {
    const { id, first_name, last_name } = event.data;
    const displayName = [first_name, last_name].filter(Boolean).join(' ') || null;

    try {
      await db.insert(userProfiles).values({
        clerkUserId: id,
        displayName,
      }).onConflictDoNothing();
    } catch {
      return NextResponse.json({ error: 'Failed to create user profile' }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
