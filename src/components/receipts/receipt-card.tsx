import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type ReceiptCardProps = {
  merchant?: string | null;
  totalAmount?: string | null;
  receiptDate?: Date | null;
  category?: string | null;
  gstAmount?: string | null;
  taxClaimable?: boolean | null;
  status?: string;
};

export function ReceiptCard({
  merchant,
  totalAmount,
  receiptDate,
  category,
  gstAmount,
  taxClaimable,
  status = 'complete',
}: ReceiptCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-semibold">{merchant ?? 'Unknown merchant'}</p>
            {receiptDate && (
              <p className="text-xs text-muted-foreground">
                {receiptDate.toLocaleDateString('en-AU')}
              </p>
            )}
          </div>
          <span className="text-lg font-bold">
            {totalAmount ? `$${totalAmount}` : '—'}
          </span>
        </div>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {category && <Badge variant="secondary">{category}</Badge>}
        {gstAmount && (
          <Badge variant="outline">GST ${gstAmount}</Badge>
        )}
        {taxClaimable != null && (
          <Badge variant={taxClaimable ? 'default' : 'destructive'}>
            {taxClaimable ? 'Claimable' : 'Not claimable'}
          </Badge>
        )}
        {status !== 'complete' && (
          <Badge variant="outline" className="capitalize">
            {status}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
