'use client';

import { useRef, useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { updateReceipt, deleteReceipt } from '@/lib/actions/receipts';
import { ClaimabilityBadge } from './claimability-dot';

const CATEGORIES = [
  'meals', 'travel', 'accommodation', 'office_supplies', 'equipment',
  'software', 'utilities', 'professional_services', 'vehicle', 'other',
];

const TAX_CATEGORIES = [
  { value: 'D1_work_related_expenses', label: 'D1 — Work-related expenses' },
  { value: 'D2_work_related_travel', label: 'D2 — Work-related travel' },
  { value: 'D3_clothing', label: 'D3 — Clothing & laundry' },
  { value: 'D4_self_education', label: 'D4 — Self-education' },
  { value: 'D5_other_deductions', label: 'D5 — Other deductions' },
  { value: 'business_expense', label: 'Business expense' },
  { value: 'non_deductible', label: 'Non-deductible' },
];

const REIMBURSEMENT_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'reimbursed', label: 'Reimbursed' },
  { value: 'declined', label: 'Declined' },
];

type Receipt = {
  id: string;
  merchant?: string | null;
  merchantAbn?: string | null;
  receiptDate?: Date | null;
  totalAmount?: string | null;
  gstAmount?: string | null;
  subtotalAmount?: string | null;
  category?: string | null;
  subcategory?: string | null;
  paymentMethod?: string | null;
  receiptType?: string | null;
  notes?: string | null;
  taxClaimable?: boolean | null;
  taxClaimableConfidence?: string | null;
  taxClaimableReasoning?: string | null;
  taxCategory?: string | null;
  businessPercentage?: number | null;
  ocrRawText?: string | null;
  originalBlobUrl?: string | null;
  compressedBlobUrl?: string | null;
  fuelType?: string | null;
  fuelLitres?: string | null;
  odometerReading?: number | null;
  // Reimbursement
  reimbursable?: boolean | null;
  reimbursementStatus?: string | null;
  reimbursementSource?: string | null;
  reimbursementSubmittedAt?: Date | null;
  reimbursementReceivedAt?: Date | null;
  reimbursementAmount?: string | null;
};

type AuditEntry = {
  id: string;
  action: string;
  fieldChanged?: string | null;
  newValue?: string | null;
  createdAt: Date;
};

type Props = { receipt: Receipt; auditLog: AuditEntry[] };

export function ReceiptEditForm({ receipt, auditLog }: Props) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const [isReimbursable, setIsReimbursable] = useState(receipt.reimbursable ?? false);

  const handleSave = async (formData: FormData) => {
    setSaving(true);
    setSaved(false);
    try {
      await updateReceipt(receipt.id, formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!confirm('Delete this receipt? This cannot be undone.')) return;
    startTransition(async () => {
      await deleteReceipt(receipt.id);
    });
  };

  const receiptDateStr = receipt.receiptDate
    ? new Date(receipt.receiptDate).toISOString().slice(0, 10)
    : '';

  const reimbSubmittedStr = receipt.reimbursementSubmittedAt
    ? new Date(receipt.reimbursementSubmittedAt).toISOString().slice(0, 10)
    : '';
  const reimbReceivedStr = receipt.reimbursementReceivedAt
    ? new Date(receipt.reimbursementReceivedAt).toISOString().slice(0, 10)
    : '';

  return (
    <div className="space-y-8">
      {/* Receipt image */}
      {(receipt.compressedBlobUrl || receipt.originalBlobUrl) && (
        <div className="rounded-lg overflow-hidden border bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={receipt.compressedBlobUrl ?? receipt.originalBlobUrl ?? ''}
            alt="Receipt"
            className="w-full max-h-[480px] object-contain"
          />
        </div>
      )}

      {/* Tax claimability */}
      <div className="rounded-lg border p-4 bg-muted/30 space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Tax claimability</span>
          <ClaimabilityBadge
            taxClaimable={receipt.taxClaimable}
            confidence={receipt.taxClaimableConfidence}
          />
        </div>
        {receipt.taxClaimableReasoning && (
          <p className="text-xs text-muted-foreground">{receipt.taxClaimableReasoning}</p>
        )}
        <p className="text-xs text-muted-foreground italic">
          AI estimate — review with your accountant.
        </p>
      </div>

      <form ref={formRef} action={handleSave} className="space-y-6">
        {/* Core fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="merchant">Merchant</Label>
            <Input id="merchant" name="merchant" defaultValue={receipt.merchant ?? ''} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="merchantAbn">ABN</Label>
            <Input id="merchantAbn" name="merchantAbn" defaultValue={receipt.merchantAbn ?? ''} placeholder="XX XXX XXX XXX" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="receiptDate">Date</Label>
            <Input id="receiptDate" name="receiptDate" type="date" defaultValue={receiptDateStr} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="totalAmount">Total (AUD)</Label>
            <Input id="totalAmount" name="totalAmount" type="number" step="0.01" defaultValue={receipt.totalAmount ?? ''} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="gstAmount">GST</Label>
            <Input id="gstAmount" name="gstAmount" type="number" step="0.01" defaultValue={receipt.gstAmount ?? ''} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="paymentMethod">Payment method</Label>
            <Select name="paymentMethod" defaultValue={receipt.paymentMethod ?? ''}>
              <SelectTrigger id="paymentMethod">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="eftpos">EFTPOS</SelectItem>
                <SelectItem value="bank_transfer">Bank transfer</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Category & tax */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="category">Category</Label>
            <Select name="category" defaultValue={receipt.category ?? ''}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c.replace(/_/g, ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="taxCategory">ATO tax category</Label>
            <Select name="taxCategory" defaultValue={receipt.taxCategory ?? ''}>
              <SelectTrigger id="taxCategory">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {TAX_CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="taxClaimable">Tax claimable override</Label>
            <Select name="taxClaimable" defaultValue={receipt.taxClaimable == null ? '' : String(receipt.taxClaimable)}>
              <SelectTrigger id="taxClaimable">
                <SelectValue placeholder="AI decision" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">AI decision</SelectItem>
                <SelectItem value="true">Yes — claimable</SelectItem>
                <SelectItem value="false">No — not claimable</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="businessPercentage">
              Business use % <span className="text-muted-foreground font-normal">(0–100)</span>
            </Label>
            <Input
              id="businessPercentage"
              name="businessPercentage"
              type="number"
              min="0"
              max="100"
              defaultValue={receipt.businessPercentage ?? 0}
            />
          </div>
        </div>

        {/* Reimbursement */}
        <div className="rounded-lg border p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Reimbursement</span>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="reimbursable"
                value="true"
                defaultChecked={receipt.reimbursable ?? false}
                onChange={(e) => setIsReimbursable(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <span className="text-sm">Reimbursable</span>
            </label>
          </div>

          {isReimbursable && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="reimbursementStatus">Status</Label>
                <Select name="reimbursementStatus" defaultValue={receipt.reimbursementStatus ?? 'pending'}>
                  <SelectTrigger id="reimbursementStatus">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {REIMBURSEMENT_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reimbursementSource">Source (who owes)</Label>
                <Input
                  id="reimbursementSource"
                  name="reimbursementSource"
                  defaultValue={receipt.reimbursementSource ?? ''}
                  placeholder="e.g. Employer, Client name"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reimbursementAmount">Amount to Reimburse (AUD)</Label>
                <Input
                  id="reimbursementAmount"
                  name="reimbursementAmount"
                  type="number"
                  step="0.01"
                  defaultValue={receipt.reimbursementAmount ?? receipt.totalAmount ?? ''}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reimbursementSubmittedAt">Date Submitted</Label>
                <Input
                  id="reimbursementSubmittedAt"
                  name="reimbursementSubmittedAt"
                  type="date"
                  defaultValue={reimbSubmittedStr}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reimbursementReceivedAt">Date Reimbursed</Label>
                <Input
                  id="reimbursementReceivedAt"
                  name="reimbursementReceivedAt"
                  type="date"
                  defaultValue={reimbReceivedStr}
                />
              </div>
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            name="notes"
            defaultValue={receipt.notes ?? ''}
            placeholder="Add any notes about this receipt..."
            rows={3}
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending ? 'Deleting…' : 'Delete receipt'}
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save changes'}
          </Button>
        </div>
      </form>

      {/* OCR text */}
      {receipt.ocrRawText && (
        <details className="rounded border p-3">
          <summary className="text-sm font-medium cursor-pointer text-muted-foreground">
            Raw OCR text
          </summary>
          <pre className="mt-2 text-xs whitespace-pre-wrap text-muted-foreground font-mono">
            {receipt.ocrRawText}
          </pre>
        </details>
      )}

      {/* Audit log */}
      {auditLog.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">History</h3>
          <div className="space-y-1">
            {auditLog.map((entry) => (
              <div key={entry.id} className="flex items-start gap-3 text-xs text-muted-foreground">
                <span className="text-muted-foreground/60 shrink-0">
                  {new Date(entry.createdAt).toLocaleDateString('en-AU', {
                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                  })}
                </span>
                <span>
                  {entry.action === 'ai_classified' ? (
                    <span className="text-blue-600 font-medium">AI classified</span>
                  ) : (
                    <>
                      <span className="font-medium">{entry.fieldChanged}</span>
                      {' → '}
                      <span>{entry.newValue ?? 'cleared'}</span>
                    </>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
