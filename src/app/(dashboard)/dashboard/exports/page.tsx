import { redirect } from 'next/navigation';
import { ExportCenterClient } from '@/components/exports/export-center-client';
import { TaxSummary } from '@/components/exports/tax-summary';
import { getCurrentUserProfileId, getUserReceipts } from '@/lib/db/queries';
import { currentFY, getFYBounds } from '@/lib/exports/csv';

function buildFyOptions(): string[] {
  const now = new Date();
  const latest = now.getMonth() >= 6 ? now.getFullYear() + 1 : now.getFullYear();
  return Array.from({ length: 5 }, (_, i) => String(latest - i));
}

export default async function ExportsPage() {
  const profileId = await getCurrentUserProfileId();
  if (!profileId) redirect('/sign-in');

  const fy = currentFY();
  const { start, end } = getFYBounds(fy);

  const fyReceipts = await getUserReceipts(profileId, {
    dateFrom: start.toISOString().slice(0, 10),
    dateTo: end.toISOString().slice(0, 10),
    limit: 5000,
  });

  const fyOptions = buildFyOptions();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Exports</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Download receipts, generate BAS summaries, and create accountant-ready reports.
        </p>
      </div>

      <TaxSummary receipts={fyReceipts} fy={fy} />

      <ExportCenterClient currentFy={fy} fyOptions={fyOptions} />

      <p className="text-xs text-muted-foreground text-center pb-4">
        AI estimates only — review all tax figures with your accountant before lodging with the ATO.
      </p>
    </div>
  );
}
