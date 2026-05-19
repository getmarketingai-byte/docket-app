'use client';

import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { dismissDuplicateAction } from '@/lib/actions/receipts';

export function DismissDuplicateButton({ receiptId }: { receiptId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      size="sm"
      className="shrink-0 text-xs border-orange-300 text-orange-700 hover:bg-orange-100"
      disabled={isPending}
      onClick={() => startTransition(() => dismissDuplicateAction(receiptId))}
    >
      {isPending ? 'Dismissing…' : 'Not a duplicate'}
    </Button>
  );
}
