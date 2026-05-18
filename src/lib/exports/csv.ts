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

export type { ReceiptFilters };
