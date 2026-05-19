import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { buttonVariants } from '@/components/ui/button';
import { ReceiptEditForm } from '@/components/receipts/receipt-edit-form';
import { VehicleAssignSelect } from '@/components/vehicles/vehicle-assign-select';
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

  return (
    <div className="max-w-2xl mx-auto space-y-6">
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
            {receipt.merchant ?? 'Receipt'}
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

      {/* Vehicle assignment (show only if user has vehicles) */}
      {userVehicles.length > 0 && (
        <VehicleAssignSelect
          receiptId={id}
          vehicleId={receipt.vehicleId ?? null}
          vehicles={userVehicles}
        />
      )}

      <ReceiptEditForm receipt={receipt} auditLog={auditLog} />
    </div>
  );
}
