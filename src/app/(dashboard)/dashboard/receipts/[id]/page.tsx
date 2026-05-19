import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { buttonVariants } from '@/components/ui/button';
import { ReceiptEditForm } from '@/components/receipts/receipt-edit-form';
import { VehicleAssignSelect } from '@/components/vehicles/vehicle-assign-select';
import { DismissDuplicateButton } from '@/components/receipts/dismiss-duplicate-button';
import { getCurrentUserProfileId, getReceiptById, getReceiptAuditLog, getVehiclesForUser } from '@/lib/db/queries';
import { cn } from '@/lib/utils';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ReceiptDetailPage({ params }: PageProps) {
  const { id } = await params;
  const profileId = await getCurrentUserProfileId();
  if (!profileId) redirect('/sign-in');

  const [receipt, auditLog, userVehicles] = await Promise.all([
    getReceiptById(profileId, id),
    getReceiptAuditLog(id),
    getVehiclesForUser(profileId),
  ]);
  if (!receipt) notFound();

  const isProcessing = receipt.status === 'processing';

  return (
    <div className={cn('mx-auto space-y-6', isProcessing ? 'max-w-4xl' : 'max-w-2xl')}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/dashboard/receipts"
            className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), '-ml-2 mb-1')}
          >
            &larr; Back to receipts
          </Link>
          <h1 className="text-xl font-bold mt-1">
            {receipt.merchant ?? (isProcessing ? 'Processing receipt…' : 'Receipt')}
          </h1>
          {receipt.receiptDate && (
            <p className="text-sm text-muted-foreground">
              {new Date(receipt.receiptDate).toLocaleDateString('en-AU', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
              })}
            </p>
          )}
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-2xl font-bold">
            {receipt.totalAmount ? `$${parseFloat(receipt.totalAmount).toFixed(2)}` : '\u2014'}
          </p>
          {receipt.gstAmount && parseFloat(receipt.gstAmount) > 0 && (
            <p className="text-xs text-muted-foreground">
              incl. GST ${parseFloat(receipt.gstAmount).toFixed(2)}
            </p>
          )}
        </div>
      </div>

      {/* Duplicate warning */}
      {receipt.isDuplicate && (
        <div className="rounded-lg bg-orange-50 border border-orange-200 p-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-orange-800">⚠ Possible duplicate</p>
            <p className="text-xs text-orange-700 mt-1">
              This receipt looks like a duplicate of another one you uploaded.
              {receipt.duplicateOfId && (
                <> <Link href={`/dashboard/receipts/${receipt.duplicateOfId}`} className="underline hover:no-underline">View original</Link>.</>
              )}
            </p>
          </div>
          <DismissDuplicateButton receiptId={id} />
        </div>
      )}

      {/* Vehicle assignment (show only if user has vehicles) */}
      {userVehicles.length > 0 && (
        <VehicleAssignSelect
          receiptId={id}
          vehicleId={receipt.vehicleId ?? null}
          vehicles={userVehicles}
        />
      )}

      <ReceiptEditForm receipt={receipt} auditLog={auditLog} status={receipt.status} />
    </div>
  );
}
