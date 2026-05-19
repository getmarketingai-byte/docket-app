'use client';

import { useEffect, useState, useCallback } from 'react';
import { Loader2, RefreshCw, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ProcessingElapsed } from './processing-elapsed';

type Receipt = {
  id: string;
  merchant: string | null;
  totalAmount: string | null;
  receiptDate: string | null;
  status: string;
  category: string | null;
  createdAt: string;
};

type Props = {
  refreshTrigger?: number;
};

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
  uploading: { label: 'Uploading', variant: 'secondary', icon: <Loader2 className="h-3 w-3 animate-spin" /> },
  processing: { label: 'Processing', variant: 'outline', icon: <Loader2 className="h-3 w-3 animate-spin" /> },
  complete: { label: 'Complete', variant: 'default', icon: <CheckCircle className="h-3 w-3" /> },
  error: { label: 'Error', variant: 'destructive', icon: <AlertCircle className="h-3 w-3" /> },
};

export function ReceiptInbox({ refreshTrigger }: Props) {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReceipts = useCallback(async () => {
    try {
      const res = await fetch('/api/receipts');
      if (!res.ok) return;
      const data = await res.json() as { receipts: Receipt[] };
      setReceipts(data.receipts);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  const retryReceipt = useCallback(async (id: string) => {
    await fetch(`/api/receipts/${id}/retry`, { method: 'POST' });
    fetchReceipts();
  }, [fetchReceipts]);

  useEffect(() => {
    fetchReceipts();
  }, [fetchReceipts, refreshTrigger]);

  useEffect(() => {
    const hasPending = receipts.some(r => r.status === 'uploading' || r.status === 'processing');
    if (!hasPending) return;
    const interval = setInterval(fetchReceipts, 3000);
    return () => clearInterval(interval);
  }, [receipts, fetchReceipts]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (receipts.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        <Clock className="h-8 w-8 mx-auto mb-2 opacity-30" />
        <p>No receipts yet. Upload your first receipt above.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {receipts.map(r => {
        const cfg = STATUS_CONFIG[r.status] ?? STATUS_CONFIG.processing;
        return (
          <div key={r.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/20 transition-colors">
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">
                {r.merchant ?? (r.status === 'complete' ? 'Unknown merchant' : 'Processing...')}
              </p>
              <p className="text-xs text-muted-foreground">
                {r.receiptDate
                  ? new Date(r.receiptDate).toLocaleDateString('en-AU')
                  : new Date(r.createdAt).toLocaleDateString('en-AU')}
                {r.category && ` · ${r.category}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {r.totalAmount && (
                <span className="text-sm font-semibold">${parseFloat(r.totalAmount).toFixed(2)}</span>
              )}
              {r.status === 'processing' ? (
                <ProcessingElapsed createdAt={r.createdAt} onRetry={() => retryReceipt(r.id)} />
              ) : (
                <Badge variant={cfg.variant} className="gap-1 text-xs">
                  {cfg.icon}
                  {cfg.label}
                </Badge>
              )}
              {r.status === 'error' && (
                <Button variant="ghost" size="sm" onClick={() => retryReceipt(r.id)} className="h-7 text-xs">
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Retry
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
