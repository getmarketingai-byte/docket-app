import type { ReceiptFilters } from '@/lib/db/queries';
import { getUserReceipts } from '@/lib/db/queries';

type Receipt = Awaited<ReturnType<typeof getUserReceipts>>[number];

function escCsv(val: string | null | undefined): string {
  if (val == null) return '';
  const s = String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function fmtDate(d: Date | null | undefined): string {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-AU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function fmtAmt(v: string | null | undefined): string {
  if (v == null) return '';
  const n = parseFloat(v);
  return isNaN(n) ? '' : n.toFixed(2);
}

const ATO_LABELS: Record<string, string> = {
  D1_work_related_expenses: 'D1 Work-related expenses',
  D2_work_related_travel: 'D2 Work-related travel',
  D3_clothing: 'D3 Clothing & laundry',
  D4_self_education: 'D4 Self-education',
  D5_other_deductions: 'D5 Other deductions',
  business_expense: 'Business expense',
  non_deductible: 'Non-deductible',
};

/** Standard CSV export */
export function buildCsv(receipts: Receipt[]): string {
  const header = [
    'Date', 'Merchant', 'ABN', 'Total (AUD)', 'GST', 'Subtotal',
    'Category', 'Payment Method', 'Tax Claimable', 'Claimable Confidence %',
    'ATO Category', 'Business %', 'Notes', 'Status',
  ].join(',');

  const rows = receipts.map((r) =>
    [
      escCsv(fmtDate(r.receiptDate)),
      escCsv(r.merchant),
      escCsv(r.merchantAbn),
      escCsv(fmtAmt(r.totalAmount)),
      escCsv(fmtAmt(r.gstAmount)),
      escCsv(fmtAmt(r.subtotalAmount)),
      escCsv(r.category),
      escCsv(r.paymentMethod),
      r.taxClaimable == null ? '' : r.taxClaimable ? 'Yes' : 'No',
      r.taxClaimableConfidence ? String(Math.round(parseFloat(r.taxClaimableConfidence) * 100)) : '',
      escCsv(r.taxCategory ? (ATO_LABELS[r.taxCategory] ?? r.taxCategory) : ''),
      r.businessPercentage != null ? String(r.businessPercentage) : '',
      escCsv(r.notes),
      escCsv(r.status),
    ].join(','),
  );

  return [header, ...rows].join('\r\n');
}

/** Hnry-compatible CSV format */
export function buildHnryCsv(receipts: Receipt[]): string {
  const header = [
    'Date', 'Description', 'Amount (inc GST)', 'GST Amount', 'Category', 'Notes',
  ].join(',');

  const rows = receipts
    .filter((r) => r.taxClaimable === true)
    .map((r) =>
      [
        escCsv(fmtDate(r.receiptDate)),
        escCsv(r.merchant),
        escCsv(fmtAmt(r.totalAmount)),
        escCsv(fmtAmt(r.gstAmount)),
        escCsv(r.category),
        escCsv(r.notes),
      ].join(','),
    );

  return [header, ...rows].join('\r\n');
}

/** GST/BAS summary CSV */
export function buildBasCsv(receipts: Receipt[], quarter: string, fy: string): string {
  const totalGst = receipts.reduce((s, r) => s + parseFloat(r.gstAmount ?? '0'), 0);
  const totalSpend = receipts.reduce((s, r) => s + parseFloat(r.totalAmount ?? '0'), 0);
  const claimableGst = receipts
    .filter((r) => r.taxClaimable === true)
    .reduce((s, r) => s + parseFloat(r.gstAmount ?? '0'), 0);

  // Group by category
  const byCat: Record<string, { count: number; spend: number; gst: number }> = {};
  for (const r of receipts) {
    const cat = r.category ?? 'uncategorised';
    if (!byCat[cat]) byCat[cat] = { count: 0, spend: 0, gst: 0 };
    byCat[cat].count += 1;
    byCat[cat].spend += parseFloat(r.totalAmount ?? '0');
    byCat[cat].gst += parseFloat(r.gstAmount ?? '0');
  }

  const lines = [
    `GST/BAS Summary — ${quarter} FY${fy}`,
    `Generated,${new Date().toLocaleDateString('en-AU')}`,
    `AI estimate — review with your accountant`,
    '',
    'Summary',
    `Total receipts,${receipts.length}`,
    `Total spend,$${totalSpend.toFixed(2)}`,
    `Total GST,$${totalGst.toFixed(2)}`,
    `Claimable GST (AI estimate),$${claimableGst.toFixed(2)}`,
    '',
    'Breakdown by Category',
    'Category,Count,Total Spend,GST',
    ...Object.entries(byCat).map(([cat, d]) =>
      `${escCsv(cat)},${d.count},$${d.spend.toFixed(2)},$${d.gst.toFixed(2)}`
    ),
  ];

  return lines.join('\r\n');
}

/** Get AUS financial year bounds from a label like "2024" (means Jul 2023 - Jun 2024) */
export function getFYBounds(fy: string): { start: Date; end: Date } {
  const year = parseInt(fy);
  return {
    start: new Date(`${year - 1}-07-01T00:00:00`),
    end: new Date(`${year}-06-30T23:59:59`),
  };
}

/** Get quarter bounds in an Australian FY */
export function getQuarterBounds(quarter: string, fy: string): { start: Date; end: Date } {
  const year = parseInt(fy);
  const quarters: Record<string, { start: Date; end: Date }> = {
    Q1: { start: new Date(`${year - 1}-07-01`), end: new Date(`${year - 1}-09-30`) },
    Q2: { start: new Date(`${year - 1}-10-01`), end: new Date(`${year - 1}-12-31`) },
    Q3: { start: new Date(`${year}-01-01`), end: new Date(`${year}-03-31`) },
    Q4: { start: new Date(`${year}-04-01`), end: new Date(`${year}-06-30`) },
  };
  return quarters[quarter] ?? quarters.Q1;
}

export function currentFY(): string {
  const now = new Date();
  return now.getMonth() >= 6
    ? String(now.getFullYear() + 1)
    : String(now.getFullYear());
}

export function quarterLabel(q: string): string {
  const labels: Record<string, string> = {
    Q1: 'Jul–Sep', Q2: 'Oct–Dec', Q3: 'Jan–Mar', Q4: 'Apr–Jun',
  };
  return labels[q] ?? q;
}

/** Reimbursement claim CSV */
export function buildReimbursementCsv(receipts: Receipt[]): string {
  const header = [
    'Date', 'Merchant', 'Category', 'Total (AUD)', 'Amount to Reimburse',
    'GST', 'Source', 'Status', 'Submitted Date', 'Reimbursed Date', 'Notes',
  ].join(',');

  const rows = receipts.map((r) =>
    [
      escCsv(fmtDate(r.receiptDate)),
      escCsv(r.merchant),
      escCsv(r.category),
      escCsv(fmtAmt(r.totalAmount)),
      escCsv(fmtAmt(r.reimbursementAmount ?? r.totalAmount)),
      escCsv(fmtAmt(r.gstAmount)),
      escCsv(r.reimbursementSource),
      escCsv(r.reimbursementStatus ?? 'pending'),
      escCsv(fmtDate(r.reimbursementSubmittedAt)),
      escCsv(fmtDate(r.reimbursementReceivedAt)),
      escCsv(r.notes),
    ].join(','),
  );

  return [header, ...rows].join('\r\n');
}

/** Reimbursement claim HTML (for print-to-PDF) */
export function buildReimbursementHtml(receipts: Receipt[], generatedDate: string): string {
  const outstanding = receipts.filter(
    (r) => r.reimbursementStatus === 'pending' || r.reimbursementStatus === 'submitted',
  );
  const outstandingTotal = outstanding.reduce(
    (s, r) => s + parseFloat(r.reimbursementAmount ?? r.totalAmount ?? '0'),
    0,
  );
  const grandTotal = receipts.reduce(
    (s, r) => s + parseFloat(r.reimbursementAmount ?? r.totalAmount ?? '0'),
    0,
  );

  const rows = receipts
    .map((r) => {
      const amt = parseFloat(r.reimbursementAmount ?? r.totalAmount ?? '0');
      const statusLabel =
        r.reimbursementStatus === 'reimbursed' ? 'Paid'
        : r.reimbursementStatus === 'declined' ? 'Declined'
        : r.reimbursementStatus === 'submitted' ? 'Submitted'
        : 'Pending';
      return `
      <tr>
        <td>${fmtDate(r.receiptDate)}</td>
        <td>${r.merchant ?? '—'}</td>
        <td>${r.category ?? '—'}</td>
        <td>${r.reimbursementSource ?? '—'}</td>
        <td style="text-align:right">$${amt.toFixed(2)}</td>
        <td><span class="status status-${r.reimbursementStatus ?? 'pending'}">${statusLabel}</span></td>
      </tr>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Reimbursement Claim — Docket</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 13px; color: #111; margin: 32px; }
  h1 { font-size: 20px; margin-bottom: 4px; }
  .meta { color: #555; font-size: 12px; margin-bottom: 24px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  th { text-align: left; border-bottom: 2px solid #ddd; padding: 6px 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #555; }
  td { padding: 6px 8px; border-bottom: 1px solid #eee; vertical-align: top; }
  .total-row { font-weight: 700; background: #f9f9f9; }
  .status { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 500; }
  .status-pending { background: #fef3c7; color: #92400e; }
  .status-submitted { background: #dbeafe; color: #1e40af; }
  .status-reimbursed { background: #d1fae5; color: #065f46; }
  .status-declined { background: #fee2e2; color: #991b1b; }
  .summary { margin-bottom: 24px; padding: 16px; background: #f5f5f5; border-radius: 8px; }
  .summary-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
  .disclaimer { font-size: 11px; color: #888; margin-top: 32px; border-top: 1px solid #ddd; padding-top: 8px; }
  @media print { body { margin: 16px; } }
</style>
</head>
<body>
<h1>Reimbursement Claim</h1>
<div class="meta">Generated by Docket · ${generatedDate}</div>
<div class="summary">
  <div class="summary-row"><span>Total receipts</span><strong>${receipts.length}</strong></div>
  <div class="summary-row"><span>Outstanding</span><strong>$${outstandingTotal.toFixed(2)} AUD</strong></div>
  <div class="summary-row"><span>Grand total</span><strong>$${grandTotal.toFixed(2)} AUD</strong></div>
</div>
<table>
  <thead>
    <tr>
      <th>Date</th>
      <th>Merchant</th>
      <th>Category</th>
      <th>Source</th>
      <th style="text-align:right">Amount</th>
      <th>Status</th>
    </tr>
  </thead>
  <tbody>
    ${rows}
    <tr class="total-row">
      <td colspan="4">Total</td>
      <td style="text-align:right">$${grandTotal.toFixed(2)}</td>
      <td></td>
    </tr>
  </tbody>
</table>
<div class="disclaimer">AI-generated summary — verify all amounts with your accountant before submission.</div>
</body>
</html>`;
}

export type { ReceiptFilters };
