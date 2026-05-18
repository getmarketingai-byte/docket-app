import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { buttonVariants } from '@/components/ui/button';
import { ReceiptEditForm } from '@/components/receipts/receipt-edit-form';
import { getCurrentUserProfileId, getReceiptById, getReceiptAuditLog } from '@/lib/db/queries';
import { cn } from '@/lib/utils';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ReceiptDetailPage({ params }: PageProps) {
  const { id } = await params;
  const profileId = await getCurrentUserProfileId();
  if (!profileId) redirect('/sign-in');

  const receipt = await getReceiptById(profileId, id);
  if (!receipt) notFound();

  const auditLog = await getReceiptAuditLog(id);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/dashboard/receipts"
            className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), '-ml-2 mb-1')}
          >
            ← Back to receipts
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
            {receipt.totalAmount ? `$${parseFloat(receipt.totalAmount).toFixed(2)}` : '—'}
          </p>
          {receipt.gstAmount && parseFloat(receipt.gstAmount) > 0 && (
            <p className="text-xs text-muted-foreground">
              incl. GST ${parseFloat(receipt.gstAmount).toFixed(2)}
            </p>
          )}
        </div>
      </div>

      <ReceiptEditForm receipt={receipt} auditLog={auditLog} />
    </div>
  );
}
