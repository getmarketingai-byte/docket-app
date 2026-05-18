import { redirect } from 'next/navigation';
import { ReceiptCard } from '@/components/receipts/receipt-card';
import { SearchFilters } from '@/components/receipts/search-filters';
import { getCurrentUserProfileId, getUserReceipts } from '@/lib/db/queries';

const CATEGORIES = [
  'meals', 'travel', 'accommodation', 'office_supplies', 'equipment',
  'software', 'utilities', 'professional_services', 'vehicle', 'other',
];

type PageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function SearchPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const profileId = await getCurrentUserProfileId();
  if (!profileId) redirect('/sign-in');

  const { q, category, dateFrom, dateTo, minAmount, maxAmount, claimable, hasGst, sortBy } = params;

  const receipts = await getUserReceipts(profileId, {
    q,
    category,
    dateFrom,
    dateTo,
    minAmount,
    maxAmount,
    claimable,
    hasGst,
    sortBy: sortBy ?? 'date',
    limit: 50,
  });

  const hasFilters = !!(q || category || dateFrom || dateTo || minAmount || maxAmount || claimable || hasGst);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Search</h1>

      <SearchFilters
        categories={CATEGORIES}
        defaultValues={{
          q: q ?? '',
          category: category ?? '',
          dateFrom: dateFrom ?? '',
          dateTo: dateTo ?? '',
          minAmount: minAmount ?? '',
          maxAmount: maxAmount ?? '',
          claimable: claimable ?? '',
          hasGst: hasGst ?? '',
          sortBy: sortBy ?? 'date',
        }}
      />

      {hasFilters || q ? (
        <div>
          <p className="text-sm text-muted-foreground mb-4">
            {receipts.length === 0
              ? 'No receipts match your filters.'
              : `${receipts.length} receipt${receipts.length !== 1 ? 's' : ''} found`}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {receipts.map((r) => (
              <ReceiptCard
                key={r.id}
                id={r.id}
                merchant={r.merchant}
                totalAmount={r.totalAmount}
                receiptDate={r.receiptDate}
                category={r.category}
                gstAmount={r.gstAmount}
                taxClaimable={r.taxClaimable}
                taxClaimableConfidence={r.taxClaimableConfidence}
                status={r.status}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg">Search your receipts</p>
          <p className="text-sm mt-1">Use the filters above to find receipts by merchant, date, category, and more.</p>
        </div>
      )}
    </div>
  );
}
