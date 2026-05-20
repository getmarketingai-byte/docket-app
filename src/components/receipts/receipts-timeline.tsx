'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { ReceiptCard } from './receipt-card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { bulkMarkReimbursable, bulkCategorize, bulkDelete } from '@/lib/actions/receipts';

const CATEGORIES = [
  'meals', 'travel', 'accommodation', 'office_supplies', 'equipment',
  'software', 'utilities', 'professional_services', 'vehicle', 'other',
];

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
type Props = { groups: Group[] };

export function ReceiptsTimeline({ groups }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [bulkCategory, setBulkCategory] = useState('');

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
    setSelected(selected.size === allIds.length ? new Set() : new Set(allIds));
  };

  const finishBulk = (msg: string) => {
    setSelected(new Set());
    setSelectMode(false);
    setBulkCategory('');
    setActionMessage(msg);
    setTimeout(() => setActionMessage(null), 3000);
  };

  const handleBulkReimbursable = (reimbursable: boolean) => {
    const ids = Array.from(selected);
    if (!ids.length) return;
    startTransition(async () => {
      await bulkMarkReimbursable(ids, reimbursable);
      finishBulk(reimbursable
        ? `${ids.length} receipt${ids.length !== 1 ? 's' : ''} marked reimbursable.`
        : `Reimbursable flag removed from ${ids.length} receipt${ids.length !== 1 ? 's' : ''}.`);
    });
  };

  const handleBulkCategorize = () => {
    const ids = Array.from(selected);
    if (!ids.length || !bulkCategory) return;
    startTransition(async () => {
      await bulkCategorize(ids, bulkCategory);
      finishBulk(`${ids.length} receipt${ids.length !== 1 ? 's' : ''} categorised as ${bulkCategory.replace(/_/g, ' ')}.`);
    });
  };

  const handleBulkExport = () => {
    const ids = Array.from(selected);
    if (!ids.length) return;
    // Export selected via query param (CSV route supports ?ids=)
    const params = new URLSearchParams({ format: 'standard', ids: ids.join(',') });
    window.location.href = `/api/exports/csv?${params}`;
  };

  const handleBulkDelete = () => {
    const ids = Array.from(selected);
    if (!ids.length) return;
    if (!confirm(`Delete ${ids.length} receipt${ids.length !== 1 ? 's' : ''}? This cannot be undone.`)) return;
    startTransition(async () => {
      await bulkDelete(ids);
      finishBulk(`${ids.length} receipt${ids.length !== 1 ? 's' : ''} deleted.`);
    });
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button
          variant={selectMode ? 'default' : 'outline'}
          size="sm"
          onClick={() => { setSelectMode(v => !v); setSelected(new Set()); }}
        >
          {selectMode ? 'Cancel selection' : 'Select receipts'}
        </Button>

        {selectMode && (
          <>
            <button
              type="button"
              onClick={toggleAll}
              className="text-xs text-muted-foreground underline underline-offset-2"
            >
              {selected.size === allIds.length ? 'Deselect all' : 'Select all'}
            </button>
            <span className="text-xs text-muted-foreground">{selected.size} selected</span>
          </>
        )}
      </div>

      {/* Bulk action bar — shown when items are selected */}
      {selectMode && selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/40 px-4 py-3">
          <span className="text-xs font-medium mr-1">{selected.size} selected:</span>

          {/* Category */}
          <div className="flex items-center gap-1.5">
            <Select onValueChange={v => setBulkCategory(v ?? '')} value={bulkCategory}>
              <SelectTrigger className="h-8 text-xs w-40">
                <SelectValue placeholder="Set category…" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => (
                  <SelectItem key={c} value={c}>{c.replace(/_/g, ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" className="h-8 text-xs" disabled={!bulkCategory || isPending} onClick={handleBulkCategorize}>
              Apply
            </Button>
          </div>

          <div className="w-px h-5 bg-border mx-0.5" />

          {/* Reimbursement */}
          <Button size="sm" variant="outline" className="h-8 text-xs" disabled={isPending} onClick={() => handleBulkReimbursable(true)}>
            Mark reimbursable
          </Button>
          <Button size="sm" variant="ghost" className="h-8 text-xs" disabled={isPending} onClick={() => handleBulkReimbursable(false)}>
            Remove flag
          </Button>

          <div className="w-px h-5 bg-border mx-0.5" />

          {/* Export */}
          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={handleBulkExport}>
            Export CSV
          </Button>

          {/* Delete */}
          <Button size="sm" variant="destructive" className="h-8 text-xs" disabled={isPending} onClick={handleBulkDelete}>
            Delete
          </Button>
        </div>
      )}

      {actionMessage && (
        <div className="rounded-md bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 px-4 py-2 text-sm text-green-800 dark:text-green-200">
          {actionMessage}
        </div>
      )}

      {/* Receipt grid */}
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
