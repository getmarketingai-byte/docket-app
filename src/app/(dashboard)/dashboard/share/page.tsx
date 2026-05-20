import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getCurrentUserProfileId } from '@/lib/db/queries';
import { db } from '@/lib/db';
import { shareTokens } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { ShareManager } from '@/components/share/share-manager';

export default async function SharePage() {
  const profileId = await getCurrentUserProfileId();
  if (!profileId) redirect('/sign-in');

  const shares = await db
    .select()
    .from(shareTokens)
    .where(eq(shareTokens.userId, profileId))
    .orderBy(desc(shareTokens.createdAt));

  const headersList = await headers();
  const host = headersList.get('host') ?? 'localhost:3000';
  const proto = host.startsWith('localhost') ? 'http' : 'https';
  const baseUrl = `${proto}://${host}`;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Accountant Access</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Create shareable links to give your accountant read-only access to your receipts — no login required.
        </p>
      </div>

      <ShareManager
        initialShares={shares.map(s => ({
          ...s,
          dateFrom: s.dateFrom?.toISOString() ?? null,
          dateTo: s.dateTo?.toISOString() ?? null,
          expiresAt: s.expiresAt?.toISOString() ?? null,
          revokedAt: s.revokedAt?.toISOString() ?? null,
          createdAt: s.createdAt.toISOString(),
        }))}
        baseUrl={baseUrl}
      />
    </div>
  );
}
