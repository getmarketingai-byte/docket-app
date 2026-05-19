'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { ReceiptCard } from './receipt-card';
import { Button } from '@/components/ui/button';
import { bulkMarkReimbursable } from '@/lib/actions/receipts';

type Receipt = {
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
  isDuplicate?: boolean | null;
  createdAt?: Date | string | null;
};

type Group = { label: string; items: Receipt[] };

type Props = {
  groups: Group[];
};

export function ReceiptsTimeline({ groups }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const retryReceipt = (id: string) => {
    fetch(`/api/receipts/${id}/retry`, { method: 'POST' }).catch(() => null);
  };

  const allIds = groups.flatMap((g) => g.items.map((r) => r.id));

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === allIds.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(allIds));
    }
  };

  const handleBulkMark = (reimbursable: boolean) => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    startTransition(async () => {
      await bulkMarkReimbursable(ids, reimbursable);
      setSelected(new Set());
      setSelectMode(false);
      setActionMessage(
        reimbursable
          ? `${ids.length} receipt${ids.length !== 1 ? 's' : ''} marked as reimbursable.`
          : `Reimbursable flag removed from ${ids.length} receipt${ids.length !== 1 ? 's' : ''}.`,
      );
      setTimeout(() => setActionMessage(null), 3000);
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Button
          variant={selectMode ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            setSelectMode((v) => !v);
            setSelected(new Set());
          }}
        >
          {selectMode ? 'Cancel selection' : 'Select for reimbursement'}
        </Button>

        {selectMode && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={toggleAll}
              className="text-xs text-muted-foreground underline underline-offset-2"
            >
              {selected.size === allIds.length ? 'Deselect all' : 'Select all'}
            </button>
            <span className="text-xs text-muted-foreground">{selected.size} selected</span>
            <Button
              size="sm"
              disabled={selected.size === 0 || isPending}
              onClick={() => handleBulkMark(true)}
            >
              Mark reimbursable
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={selected.size === 0 || isPending}
              onClick={() => handleBulkMark(false)}
            >
              Remove flag
            </Button>
          </div>
        )}
      </div>

      {actionMessage && (
        <div className="rounded-md bg-green-50 border border-green-200 px-4 py-2 text-sm text-green-800">
          {actionMessage}
        </div>
      )}

      {groups.map((group) => (
        <section key={group.label}>
          <h2 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
            {group.label}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {group.items.map((r) =>
              selectMode ? (
                <div
                  key={r.id}
                  className="relative cursor-pointer"
                  onClick={() => toggleSelect(r.id)}
                >
                  <div
                    className={`absolute inset-0 rounded-lg z-10 border-2 transition-colors ${
                      selected.has(r.id) ? 'border-primary bg-primary/5' : 'border-transparent'
                    }`}
                  />
                  <div className="absolute top-2 right-2 z-20">
                    <input
                      type="checkbox"
                      checked={selected.has(r.id)}
                      onChange={() => toggleSelect(r.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                  </div>
                  <ReceiptCard
                    id={r.id}
                    merchant={r.merchant}
                    totalAmount={r.totalAmount}
                    receiptDate={r.receiptDate}
                    category={r.category}
                    gstAmount={r.gstAmount}
                    taxClaimable={r.taxClaimable}
                    taxClaimableConfidence={r.taxClaimableConfidence}
                    status={r.status}
                    reimbursable={r.reimbursable}
                    isDuplicate={r.isDuplicate}
                    createdAt={r.createdAt}
                    onRetry={r.status === 'processing' ? () => retryReceipt(r.id) : undefined}
                  />
                </div>
              ) : (
                <Link key={r.id} href={`/dashboard/receipts/${r.id}`}>
                  <ReceiptCard
                    id={r.id}
                    merchant={r.merchant}
                    totalAmount={r.totalAmount}
                    receiptDate={r.receiptDate}
                    category={r.category}
                    gstAmount={r.gstAmount}
                    taxClaimable={r.taxClaimable}
                    taxClaimableConfidence={r.taxClaimableConfidence}
                    status={r.status}
                    reimbursable={r.reimbursable}
                    isDuplicate={r.isDuplicate}
                    createdAt={r.createdAt}
                    onRetry={r.status === 'processing' ? () => retryReceipt(r.id) : undefined}
                  />
                </Link>
              ),
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
