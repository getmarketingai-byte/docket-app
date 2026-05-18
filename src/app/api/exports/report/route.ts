import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { userProfiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getUserReceipts } from '@/lib/db/queries';
import { currentFY, getFYBounds } from '@/lib/exports/csv';

const ATO_LABELS: Record<string, string> = {
  D1_work_related_expenses: 'D1 — Work-related expenses',
  D2_work_related_travel: 'D2 — Work-related travel',
  D3_clothing: 'D3 — Clothing & laundry',
  D4_self_education: 'D4 — Self-education',
  D5_other_deductions: 'D5 — Other deductions',
  business_expense: 'Business expense',
  non_deductible: 'Non-deductible',
};

function fmt(n: number) {
  return `$${n.toFixed(2)}`;
}

function fmtDate(d: Date | null | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const profiles = await db
    .select({ id: userProfiles.id, displayName: userProfiles.displayName, taxProfile: userProfiles.taxProfile })
    .from(userProfiles)
    .where(eq(userProfiles.clerkUserId, userId))
    .limit(1);

  if (!profiles[0]) return new NextResponse('No profile', { status: 404 });

  const url = new URL(req.url);
  const fy = url.searchParams.get('fy') ?? currentFY();
  const { start, end } = getFYBounds(fy);
  const dateFrom = url.searchParams.get('dateFrom') ?? start.toISOString().slice(0, 10);
  const dateTo = url.searchParams.get('dateTo') ?? end.toISOString().slice(0, 10);

  const receipts = await getUserReceipts(profiles[0].id, {
    dateFrom,
    dateTo,
    limit: 5000,
  });

  const profile = profiles[0];
  const taxProfile = (profile.taxProfile ?? {}) as Record<string, unknown>;

  // Aggregate by category
  const byCat: Record<string, { count: number; spend: number; gst: number; claimable: number }> = {};
  let totalSpend = 0;
  let totalGst = 0;
  let claimableSpend = 0;
  let claimableGst = 0;

  for (const r of receipts) {
    const cat = r.category ?? 'other';
    if (!byCat[cat]) byCat[cat] = { count: 0, spend: 0, gst: 0, claimable: 0 };
    const spend = parseFloat(r.totalAmount ?? '0');
    const gst = parseFloat(r.gstAmount ?? '0');
    byCat[cat].count += 1;
    byCat[cat].spend += spend;
    byCat[cat].gst += gst;
    totalSpend += spend;
    totalGst += gst;
    if (r.taxClaimable === true) {
      byCat[cat].claimable += spend;
      claimableSpend += spend;
      claimableGst += gst;
    }
  }

  // ATO breakdown
  const byAto: Record<string, { count: number; spend: number; gst: number }> = {};
  for (const r of receipts.filter((r) => r.taxClaimable === true)) {
    const key = r.taxCategory ?? 'unclassified';
    if (!byAto[key]) byAto[key] = { count: 0, spend: 0, gst: 0 };
    byAto[key].count += 1;
    byAto[key].spend += parseFloat(r.totalAmount ?? '0');
    byAto[key].gst += parseFloat(r.gstAmount ?? '0');
  }

  const catRows = Object.entries(byCat)
    .sort((a, b) => b[1].spend - a[1].spend)
    .map(([cat, d]) => `
      <tr>
        <td>${cat.replace(/_/g, ' ')}</td>
        <td class="num">${d.count}</td>
        <td class="num">${fmt(d.spend)}</td>
        <td class="num">${fmt(d.gst)}</td>
        <td class="num claimable">${fmt(d.claimable)}</td>
      </tr>`)
    .join('');

  const atoRows = Object.entries(byAto)
    .sort((a, b) => b[1].spend - a[1].spend)
    .map(([key, d]) => `
      <tr>
        <td>${ATO_LABELS[key] ?? key.replace(/_/g, ' ')}</td>
        <td class="num">${d.count}</td>
        <td class="num">${fmt(d.spend)}</td>
        <td class="num">${fmt(d.gst)}</td>
      </tr>`)
    .join('');

  const receiptRows = receipts
    .slice(0, 200)
    .map((r) => `
      <tr>
        <td>${fmtDate(r.receiptDate)}</td>
        <td>${r.merchant ?? '—'}</td>
        <td class="num">${r.totalAmount ? fmt(parseFloat(r.totalAmount)) : '—'}</td>
        <td class="num">${r.gstAmount && parseFloat(r.gstAmount) > 0 ? fmt(parseFloat(r.gstAmount)) : '—'}</td>
        <td>${r.category?.replace(/_/g, ' ') ?? '—'}</td>
        <td class="center">${r.taxClaimable === true ? '✓' : r.taxClaimable === false ? '✗' : '?'}</td>
        <td>${r.businessPercentage != null ? `${r.businessPercentage}%` : '—'}</td>
      </tr>`)
    .join('');

  const html = `<!DOCTYPE html>
<html lang="en-AU">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Docket Report — FY${fy}</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 11pt; color: #111; background: #fff; padding: 20px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #111; padding-bottom: 12px; margin-bottom: 20px; }
  .header h1 { font-size: 20pt; font-weight: 700; }
  .header .meta { text-align: right; font-size: 9pt; color: #555; }
  .disclaimer { background: #fff8e1; border: 1px solid #ffe082; border-radius: 4px; padding: 8px 12px; font-size: 9pt; margin-bottom: 20px; }
  .section { margin-bottom: 28px; }
  .section h2 { font-size: 12pt; font-weight: 700; border-bottom: 1px solid #ddd; padding-bottom: 4px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #333; }
  .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
  .stat { border: 1px solid #e5e5e5; border-radius: 6px; padding: 10px 14px; }
  .stat .label { font-size: 8pt; text-transform: uppercase; letter-spacing: 0.05em; color: #666; }
  .stat .value { font-size: 16pt; font-weight: 700; margin-top: 2px; }
  .stat.green .value { color: #16a34a; }
  table { width: 100%; border-collapse: collapse; font-size: 9.5pt; }
  th { text-align: left; font-size: 8pt; text-transform: uppercase; letter-spacing: 0.05em; color: #666; border-bottom: 1px solid #ddd; padding: 5px 8px; }
  td { padding: 5px 8px; border-bottom: 1px solid #f0f0f0; vertical-align: top; }
  .num { text-align: right; font-variant-numeric: tabular-nums; }
  .center { text-align: center; }
  .claimable { color: #16a34a; font-weight: 600; }
  tfoot tr td { font-weight: 700; border-top: 2px solid #ddd; background: #fafafa; }
  .print-btn { position: fixed; top: 16px; right: 16px; background: #111; color: #fff; border: none; border-radius: 6px; padding: 8px 16px; font-size: 11pt; cursor: pointer; }
  @media print {
    .print-btn { display: none; }
    body { padding: 0; }
    .stats-grid { grid-template-columns: repeat(4, 1fr); }
  }
  @page { margin: 18mm 15mm; }
</style>
</head>
<body>
<button class="print-btn" onclick="window.print()">Print / Save PDF</button>

<div class="header">
  <div>
    <h1>Receipt Report</h1>
    <div style="font-size:10pt; color:#555; margin-top:4px">FY${fy} &mdash; ${fmtDate(new Date(dateFrom))} to ${fmtDate(new Date(dateTo))}</div>
    ${profile.displayName ? `<div style="font-size:10pt; color:#555">${profile.displayName}</div>` : ''}
    ${taxProfile.abn ? `<div style="font-size:9pt; color:#777">ABN: ${taxProfile.abn}</div>` : ''}
  </div>
  <div class="meta">
    Generated by Docket<br>
    ${new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}
  </div>
</div>

<div class="disclaimer">
  ⚠ AI estimates only — all tax-related figures should be reviewed with your accountant before lodgement.
</div>

<!-- Summary Stats -->
<div class="stats-grid">
  <div class="stat">
    <div class="label">Total receipts</div>
    <div class="value">${receipts.length}</div>
  </div>
  <div class="stat">
    <div class="label">Total spend</div>
    <div class="value">${fmt(totalSpend)}</div>
  </div>
  <div class="stat">
    <div class="label">Total GST</div>
    <div class="value">${fmt(totalGst)}</div>
  </div>
  <div class="stat green">
    <div class="label">Claimable (AI est.)</div>
    <div class="value">${fmt(claimableSpend)}</div>
  </div>
</div>

<!-- By Category -->
<div class="section">
  <h2>Breakdown by Category</h2>
  <table>
    <thead><tr><th>Category</th><th class="num">Count</th><th class="num">Total</th><th class="num">GST</th><th class="num">Claimable</th></tr></thead>
    <tbody>${catRows}</tbody>
    <tfoot><tr><td>Total</td><td class="num">${receipts.length}</td><td class="num">${fmt(totalSpend)}</td><td class="num">${fmt(totalGst)}</td><td class="num claimable">${fmt(claimableSpend)}</td></tr></tfoot>
  </table>
</div>

<!-- ATO Breakdown -->
${Object.keys(byAto).length > 0 ? `
<div class="section">
  <h2>ATO Deduction Categories (Claimable)</h2>
  <table>
    <thead><tr><th>ATO Category</th><th class="num">Count</th><th class="num">Total</th><th class="num">GST</th></tr></thead>
    <tbody>${atoRows}</tbody>
    <tfoot><tr><td>Total claimable</td><td class="num">${receipts.filter(r => r.taxClaimable).length}</td><td class="num">${fmt(claimableSpend)}</td><td class="num">${fmt(claimableGst)}</td></tr></tfoot>
  </table>
</div>` : ''}

<!-- Receipt List -->
<div class="section">
  <h2>Receipt List${receipts.length > 200 ? ' (first 200)' : ''}</h2>
  <table>
    <thead><tr><th>Date</th><th>Merchant</th><th class="num">Total</th><th class="num">GST</th><th>Category</th><th class="center">Claim</th><th class="num">Biz%</th></tr></thead>
    <tbody>${receiptRows}</tbody>
  </table>
</div>

<div style="text-align:center; font-size:8pt; color:#aaa; margin-top:32px; padding-top:12px; border-top:1px solid #eee;">
  Generated by Docket &mdash; AI Receipt Intelligence &mdash; docket-app.vercel.app &mdash; AI estimates only
</div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
