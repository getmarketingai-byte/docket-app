import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ClaimabilityDot } from './claimability-dot';

type ReceiptCardProps = {
  id: string;
  merchant?: string | null;
  totalAmount?: string | null;
  receiptDate?: Date | null;
  category?: string | null;
  gstAmount?: string | null;
  taxClaimable?: boolean | null;
  taxClaimableConfidence?: string | null;
  status?: string;
};

export function ReceiptCard({
  id,
  merchant,
  totalAmount,
  receiptDate,
  category,
  gstAmount,
  taxClaimable,
  taxClaimableConfidence,
  status = 'complete',
}: ReceiptCardProps) {
  const content = (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold truncate">{merchant ?? 'Unknown merchant'}</p>
            {receiptDate && (
              <p className="text-xs text-muted-foreground">
                {new Date(receiptDate).toLocaleDateString('en-AU')}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <ClaimabilityDot taxClaimable={taxClaimable} confidence={taxClaimableConfidence} />
            <span className="text-base font-bold">
              {totalAmount ? `$${parseFloat(totalAmount).toFixed(2)}` : '—'}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-1.5">
        {category && <Badge variant="secondary" className="text-xs">{category}</Badge>}
        {gstAmount && parseFloat(gstAmount) > 0 && (
          <Badge variant="outline" className="text-xs">GST ${parseFloat(gstAmount).toFixed(2)}</Badge>
        )}
        {status !== 'complete' && (
          <Badge variant="outline" className="capitalize text-xs">{status}</Badge>
        )}
      </CardContent>
    </Card>
  );

  if (status === 'complete' || status === 'error') {
    return <Link href={`/dashboard/receipts/${id}`}>{content}</Link>;
  }
  return content;
}
