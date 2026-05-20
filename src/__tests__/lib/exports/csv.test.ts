import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock DB dependency before importing csv module
vi.mock('@/lib/db/queries', () => ({
  getUserReceipts: vi.fn(),
}));
vi.mock('@/lib/db', () => ({ db: {} }));
vi.mock('@clerk/nextjs/server', () => ({ auth: vi.fn() }));

import {
  buildCsv,
  buildHnryCsv,
  buildBasCsv,
  buildReimbursementCsv,
  getFYBounds,
  getQuarterBounds,
  currentFY,
  quarterLabel,
} from '@/lib/exports/csv';

// Minimal receipt shape matching the fields used by CSV builders
type TestReceipt = {
  receiptDate: Date | null;
  merchant: string | null;
  merchantAbn: string | null;
  totalAmount: string | null;
  gstAmount: string | null;
  subtotalAmount: string | null;
  category: string | null;
  paymentMethod: string | null;
  taxClaimable: boolean | null;
  taxClaimableConfidence: string | null;
  taxCategory: string | null;
  businessPercentage: number | null;
  notes: string | null;
  status: string;
  reimbursementStatus: string | null;
  reimbursementSource: string | null;
  reimbursementSubmittedAt: Date | null;
  reimbursementReceivedAt: Date | null;
  reimbursementAmount: string | null;
};

function makeReceipt(overrides: Partial<TestReceipt> = {}): TestReceipt {
  return {
    receiptDate: new Date('2024-03-15'),
    merchant: 'Officeworks',
    merchantAbn: '12345678901',
    totalAmount: '110.00',
    gstAmount: '10.00',
    subtotalAmount: '100.00',
    category: 'business_expense',
    paymentMethod: 'Visa',
    taxClaimable: true,
    taxClaimableConfidence: '0.92',
    taxCategory: 'D5_other_deductions',
    businessPercentage: 100,
    notes: 'Office supplies',
    status: 'complete',
    reimbursementStatus: null,
    reimbursementSource: null,
    reimbursementSubmittedAt: null,
    reimbursementReceivedAt: null,
    reimbursementAmount: null,
    ...overrides,
  };
}

// Cast to the type expected by CSV builders
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const r = (o: Partial<TestReceipt> = {}) => makeReceipt(o) as any;

describe('buildCsv', () => {
  it('includes header row', () => {
    const csv = buildCsv([]);
    expect(csv.split('\r\n')[0]).toBe(
      'Date,Merchant,ABN,Total (AUD),GST,Subtotal,Category,Payment Method,Tax Claimable,Claimable Confidence %,ATO Category,Business %,Notes,Status',
    );
  });

  it('formats a typical receipt row correctly', () => {
    const csv = buildCsv([r()]);
    const lines = csv.split('\r\n');
    expect(lines).toHaveLength(2);
    const row = lines[1];
    expect(row).toContain('Officeworks');
    expect(row).toContain('110.00');
    expect(row).toContain('10.00');
    expect(row).toContain('Yes'); // taxClaimable
    expect(row).toContain('92'); // confidence as %
    expect(row).toContain('D5 Other deductions'); // ATO label
    expect(row).toContain('100'); // businessPercentage
  });

  it('outputs empty string for null fields', () => {
    const csv = buildCsv([r({ merchant: null, totalAmount: null, taxClaimable: null })]);
    const row = csv.split('\r\n')[1];
    // merchant and totalAmount columns should be empty
    const cols = row.split(',');
    expect(cols[1]).toBe(''); // merchant
    expect(cols[3]).toBe(''); // totalAmount
    expect(cols[8]).toBe(''); // taxClaimable
  });

  it('outputs "No" for non-claimable receipts', () => {
    const csv = buildCsv([r({ taxClaimable: false })]);
    expect(csv).toContain('No');
  });

  it('escapes commas in merchant names', () => {
    const csv = buildCsv([r({ merchant: 'Smith, Jones & Co' })]);
    expect(csv).toContain('"Smith, Jones & Co"');
  });

  it('escapes double quotes in values', () => {
    const csv = buildCsv([r({ notes: 'He said "hello"' })]);
    expect(csv).toContain('"He said ""hello"""');
  });

  it('handles multiple rows', () => {
    const csv = buildCsv([r(), r({ merchant: 'Bunnings' }), r({ merchant: 'Woolworths' })]);
    const lines = csv.split('\r\n');
    expect(lines).toHaveLength(4); // header + 3 rows
    expect(lines[2]).toContain('Bunnings');
    expect(lines[3]).toContain('Woolworths');
  });

  it('uses unknown taxCategory as-is when not in ATO_LABELS', () => {
    const csv = buildCsv([r({ taxCategory: 'custom_category' })]);
    expect(csv).toContain('custom_category');
  });
});

describe('buildHnryCsv', () => {
  it('includes correct Hnry header', () => {
    const csv = buildHnryCsv([]);
    expect(csv.split('\r\n')[0]).toBe(
      'Date,Description,Amount (inc GST),GST Amount,Category,Notes',
    );
  });

  it('only includes tax-claimable receipts', () => {
    const receipts = [
      r({ taxClaimable: true, merchant: 'Claimable Co' }),
      r({ taxClaimable: false, merchant: 'Non-claimable Co' }),
      r({ taxClaimable: null, merchant: 'Unknown Co' }),
    ];
    const csv = buildHnryCsv(receipts);
    expect(csv).toContain('Claimable Co');
    expect(csv).not.toContain('Non-claimable Co');
    expect(csv).not.toContain('Unknown Co');
  });

  it('has 6 columns per row', () => {
    const csv = buildHnryCsv([r()]);
    const row = csv.split('\r\n')[1];
    // Count commas (not inside quotes)
    const cols = row.split(',');
    expect(cols).toHaveLength(6);
  });
});

describe('buildBasCsv', () => {
  it('includes BAS summary header', () => {
    const csv = buildBasCsv([], 'Q3', '2024');
    expect(csv).toContain('GST/BAS Summary — Q3 FY2024');
  });

  it('includes tax disclaimer', () => {
    const csv = buildBasCsv([], 'Q1', '2024');
    expect(csv).toContain('AI estimate — review with your accountant');
  });

  it('calculates totals correctly', () => {
    const receipts = [
      r({ totalAmount: '110.00', gstAmount: '10.00', taxClaimable: true }),
      r({ totalAmount: '55.00', gstAmount: '5.00', taxClaimable: false }),
    ];
    const csv = buildBasCsv(receipts, 'Q1', '2024');
    expect(csv).toContain('Total receipts,2');
    expect(csv).toContain('$165.00'); // total spend
    expect(csv).toContain('$15.00'); // total GST
    expect(csv).toContain('$10.00'); // claimable GST
  });

  it('groups by category', () => {
    const receipts = [
      r({ category: 'business_expense', totalAmount: '100.00', gstAmount: '9.09' }),
      r({ category: 'business_expense', totalAmount: '200.00', gstAmount: '18.18' }),
      r({ category: 'D1_work_related_expenses', totalAmount: '50.00', gstAmount: '4.55' }),
    ];
    const csv = buildBasCsv(receipts, 'Q2', '2024');
    expect(csv).toContain('business_expense');
    expect(csv).toContain('D1_work_related_expenses');
  });
});

describe('buildReimbursementCsv', () => {
  it('includes reimbursement header', () => {
    const csv = buildReimbursementCsv([]);
    expect(csv.split('\r\n')[0]).toBe(
      'Date,Merchant,Category,Total (AUD),Amount to Reimburse,GST,Source,Status,Submitted Date,Reimbursed Date,Notes',
    );
  });

  it('defaults reimbursement status to pending', () => {
    const csv = buildReimbursementCsv([r({ reimbursementStatus: null })]);
    expect(csv).toContain('pending');
  });

  it('uses reimbursementAmount when set', () => {
    const csv = buildReimbursementCsv([r({ reimbursementAmount: '55.00', totalAmount: '110.00' })]);
    expect(csv).toContain('55.00');
  });

  it('falls back to totalAmount when reimbursementAmount is null', () => {
    const csv = buildReimbursementCsv([r({ reimbursementAmount: null, totalAmount: '110.00' })]);
    expect(csv).toContain('110.00');
  });
});

describe('getFYBounds', () => {
  it('returns Jul-Jun bounds for Australian FY', () => {
    const { start, end } = getFYBounds('2024');
    expect(start.getFullYear()).toBe(2023);
    expect(start.getMonth()).toBe(6); // July = 6 (0-indexed)
    expect(end.getFullYear()).toBe(2024);
    expect(end.getMonth()).toBe(5); // June = 5 (0-indexed)
  });

  it('FY2025 starts Jul 2024', () => {
    const { start } = getFYBounds('2025');
    expect(start.getFullYear()).toBe(2024);
    expect(start.getMonth()).toBe(6);
  });
});

describe('getQuarterBounds', () => {
  it('Q1 is Jul-Sep', () => {
    const { start, end } = getQuarterBounds('Q1', '2024');
    expect(start.toISOString().startsWith('2023-07-01')).toBe(true);
    expect(end.toISOString().startsWith('2023-09-30')).toBe(true);
  });

  it('Q2 is Oct-Dec', () => {
    const { start, end } = getQuarterBounds('Q2', '2024');
    expect(start.toISOString().startsWith('2023-10-01')).toBe(true);
    expect(end.toISOString().startsWith('2023-12-31')).toBe(true);
  });

  it('Q3 is Jan-Mar', () => {
    const { start, end } = getQuarterBounds('Q3', '2024');
    expect(start.toISOString().startsWith('2024-01-01')).toBe(true);
    expect(end.toISOString().startsWith('2024-03-31')).toBe(true);
  });

  it('Q4 is Apr-Jun', () => {
    const { start, end } = getQuarterBounds('Q4', '2024');
    expect(start.toISOString().startsWith('2024-04-01')).toBe(true);
    expect(end.toISOString().startsWith('2024-06-30')).toBe(true);
  });

  it('defaults to Q1 for unknown quarter', () => {
    const q1 = getQuarterBounds('Q1', '2024');
    const unknown = getQuarterBounds('Q9', '2024');
    expect(unknown.start.getTime()).toBe(q1.start.getTime());
  });
});

describe('quarterLabel', () => {
  it('returns readable labels', () => {
    expect(quarterLabel('Q1')).toBe('Jul–Sep');
    expect(quarterLabel('Q2')).toBe('Oct–Dec');
    expect(quarterLabel('Q3')).toBe('Jan–Mar');
    expect(quarterLabel('Q4')).toBe('Apr–Jun');
  });

  it('returns the key for unknown quarters', () => {
    expect(quarterLabel('Q9')).toBe('Q9');
  });
});

describe('currentFY', () => {
  it('returns a 4-digit year string', () => {
    const fy = currentFY();
    expect(fy).toMatch(/^\d{4}$/);
  });
});
