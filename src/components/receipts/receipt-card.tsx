import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ClaimabilityDot } from './claimability-dot';
import { ProcessingElapsed } from './processing-elapsed';

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
  reimbursable?: boolean | null;
  createdAt?: string | Date | null;
};

export function ReceiptCard({
  merchant,
  totalAmount,
  receiptDate,
  category,
  gstAmount,
  taxClaimable,
  taxClaimableConfidence,
  status = 'complete',
  reimbursable,
  createdAt,
}: ReceiptCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
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
        {reimbursable && (
          <Badge variant="outline" className="text-xs text-blue-600 border-blue-200">Reimbursable</Badge>
        )}
        {status === 'processing' && createdAt ? (
          <ProcessingElapsed createdAt={createdAt} />
        ) : status !== 'complete' && (
          <Badge variant="outline" className="capitalize text-xs">{status}</Badge>
        )}
      </CardContent>
    </Card>
  );
}
