import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { receipts, userProfiles, auditLogs, vehicles, vehicleFuelLogs, budgets } from '@/lib/db/schema';
import { eq, desc, and, ilike, gte, lte, or, sql } from 'drizzle-orm';

export type ReceiptFilters = {
  q?: string;
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: string;
  maxAmount?: string;
  claimable?: string; // 'true' | 'false'
  hasGst?: string;    // 'true'
  sortBy?: string;    // 'date' | 'amount' | 'merchant'
  limit?: number;
  offset?: number;
};

/**
 * Resolve Clerk user ID → user_profiles.id
 * Returns null if not authenticated or profile not found.
 */
export async function getCurrentUserProfileId(): Promise<string | null> {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return null;

  const profiles = await db
    .select({ id: userProfiles.id })
    .from(userProfiles)
    .where(eq(userProfiles.clerkUserId, clerkUserId))
    .limit(1);

  if (profiles[0]?.id) return profiles[0].id;

  // Profile missing (webhook may have failed) — auto-create on first login
  const inserted = await db
    .insert(userProfiles)
    .values({ clerkUserId })
    .onConflictDoNothing()
    .returning({ id: userProfiles.id });

  if (inserted[0]?.id) return inserted[0].id;

  // Race condition: another request inserted first — re-fetch
  const refetch = await db
    .select({ id: userProfiles.id })
    .from(userProfiles)
    .where(eq(userProfiles.clerkUserId, clerkUserId))
    .limit(1);

  return refetch[0]?.id ?? null;
}

/**
 * Get receipts for the current user with optional filters.
 */
export async function getUserReceipts(profileId: string, filters: ReceiptFilters = {}) {
  const {
    q,
    category,
    dateFrom,
    dateTo,
    minAmount,
    maxAmount,
    claimable,
    hasGst,
    sortBy = 'date',
    limit = 50,
    offset = 0,
  } = filters;

  const conditions = [eq(receipts.userId, profileId)];

  if (q) {
    conditions.push(
      or(
        ilike(receipts.merchant, `%${q}%`),
        ilike(receipts.notes, `%${q}%`),
        ilike(receipts.ocrRawText, `%${q}%`),
        ilike(receipts.category, `%${q}%`),
      )!,
    );
  }

  if (category) {
    conditions.push(eq(receipts.category, category));
  }

  if (dateFrom) {
    conditions.push(gte(receipts.receiptDate, new Date(dateFrom)));
  }

  if (dateTo) {
    conditions.push(lte(receipts.receiptDate, new Date(dateTo)));
  }

  if (minAmount) {
    conditions.push(gte(receipts.totalAmount, minAmount));
  }

  if (maxAmount) {
    conditions.push(lte(receipts.totalAmount, maxAmount));
  }

  if (claimable === 'true') {
    conditions.push(eq(receipts.taxClaimable, true));
  } else if (claimable === 'false') {
    conditions.push(eq(receipts.taxClaimable, false));
  }

  if (hasGst === 'true') {
    conditions.push(sql`${receipts.gstAmount} IS NOT NULL AND ${receipts.gstAmount}::numeric > 0`);
  }

  const orderBy =
    sortBy === 'amount'
      ? desc(sql`${receipts.totalAmount}::numeric`)
      : sortBy === 'merchant'
        ? receipts.merchant
        : desc(receipts.receiptDate);

  const rows = await db
    .select()
    .from(receipts)
    .where(and(...conditions))
    .orderBy(orderBy, desc(receipts.createdAt))
    .limit(limit)
    .offset(offset);

  return rows;
}

export async function getReceiptById(profileId: string, receiptId: string) {
  const rows = await db
    .select()
    .from(receipts)
    .where(and(eq(receipts.id, receiptId), eq(receipts.userId, profileId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function getReceiptAuditLog(receiptId: string) {
  return db
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.receiptId, receiptId))
    .orderBy(desc(auditLogs.createdAt))
    .limit(50);
}

export async function getDashboardStats(profileId: string) {
  const allReceipts = await db
    .select({
      status: receipts.status,
      totalAmount: receipts.totalAmount,
      gstAmount: receipts.gstAmount,
      taxClaimable: receipts.taxClaimable,
      taxClaimableConfidence: receipts.taxClaimableConfidence,
    })
    .from(receipts)
    .where(eq(receipts.userId, profileId));

  const total = allReceipts.length;
  const totalSpend = allReceipts.reduce((sum, r) => sum + parseFloat(r.totalAmount ?? '0'), 0);
  const totalGst = allReceipts.reduce((sum, r) => sum + parseFloat(r.gstAmount ?? '0'), 0);
  const pendingReview = allReceipts.filter((r) => r.status === 'processing' || r.status === 'uploading').length;
  const claimableAmount = allReceipts
    .filter((r) => r.taxClaimable === true)
    .reduce((sum, r) => sum + parseFloat(r.totalAmount ?? '0'), 0);

  return { total, totalSpend, totalGst, pendingReview, claimableAmount };
}

// ─── Vehicle queries ───────────────────────────────────────────────────────────

export async function getVehiclesForUser(userId: string) {
  return db.select().from(vehicles).where(eq(vehicles.userId, userId)).orderBy(vehicles.name);
}

export async function getVehicleById(userId: string, vehicleId: string) {
  const rows = await db.select().from(vehicles)
    .where(and(eq(vehicles.id, vehicleId), eq(vehicles.userId, userId))).limit(1);
  return rows[0] ?? null;
}

export async function getVehicleWithStats(userId: string, vehicleId: string) {
  const vehicle = await getVehicleById(userId, vehicleId);
  if (!vehicle) return null;

  // All receipts assigned to this vehicle
  const vehicleReceipts = await db.select().from(receipts)
    .where(and(eq(receipts.userId, userId), eq(receipts.vehicleId, vehicleId)))
    .orderBy(desc(receipts.receiptDate));

  // Fuel logs for this vehicle
  const fuelLogs = await db.select().from(vehicleFuelLogs)
    .where(eq(vehicleFuelLogs.vehicleId, vehicleId))
    .orderBy(desc(vehicleFuelLogs.loggedAt));

  // Calculate analytics
  const totalCost = vehicleReceipts.reduce((sum, r) => sum + parseFloat(r.totalAmount ?? '0'), 0);

  // Cost by category
  const costByCategory: Record<string, number> = {};
  for (const r of vehicleReceipts) {
    const cat = r.category ?? 'other';
    costByCategory[cat] = (costByCategory[cat] ?? 0) + parseFloat(r.totalAmount ?? '0');
  }

  // Fuel economy: find consecutive odometer readings
  const fuelLogsWithOdometer = fuelLogs.filter(l => l.odometerReading && l.litres);
  let fuelEconomy: number | null = null;
  let costPerKm: number | null = null;

  if (fuelLogsWithOdometer.length >= 2) {
    // Sort ascending by odometer
    const sorted = [...fuelLogsWithOdometer].sort((a, b) => (a.odometerReading ?? 0) - (b.odometerReading ?? 0));
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const distanceKm = (last.odometerReading ?? 0) - (first.odometerReading ?? 0);
    if (distanceKm > 0) {
      // Total litres from second fill onwards (exclude first which establishes baseline)
      const totalLitres = sorted.slice(1).reduce((sum, l) => sum + parseFloat(l.litres ?? '0'), 0);
      if (totalLitres > 0) {
        fuelEconomy = (totalLitres / distanceKm) * 100; // L/100km
      }
      const fuelTotalCost = sorted.slice(1).reduce((sum, l) => sum + parseFloat(l.totalCost ?? '0'), 0);
      if (fuelTotalCost > 0) {
        costPerKm = fuelTotalCost / distanceKm;
      }
    }
  }

  return { vehicle, vehicleReceipts, fuelLogs, totalCost, costByCategory, fuelEconomy, costPerKm };
}

// ─── Reimbursement queries ────────────────────────────────────────────────────

/**
 * Get all reimbursable receipts for a user (with optional status filter).
 */
export async function getReimbursableReceipts(
  profileId: string,
  statusFilter?: string,
) {
  const conditions = [
    eq(receipts.userId, profileId),
    eq(receipts.reimbursable, true),
  ];

  if (statusFilter) {
    conditions.push(eq(receipts.reimbursementStatus, statusFilter));
  }

  return db
    .select()
    .from(receipts)
    .where(and(...conditions))
    .orderBy(desc(receipts.receiptDate));
}

/**
 * Reimbursement stats: outstanding total, by-source breakdown, aging buckets.
 */
export async function getReimbursementStats(profileId: string) {
  const all = await db
    .select({
      id: receipts.id,
      totalAmount: receipts.totalAmount,
      reimbursementAmount: receipts.reimbursementAmount,
      reimbursementStatus: receipts.reimbursementStatus,
      reimbursementSource: receipts.reimbursementSource,
      reimbursementSubmittedAt: receipts.reimbursementSubmittedAt,
      receiptDate: receipts.receiptDate,
    })
    .from(receipts)
    .where(and(eq(receipts.userId, profileId), eq(receipts.reimbursable, true)));

  const now = new Date();

  const outstanding = all.filter(
    (r) => r.reimbursementStatus === 'pending' || r.reimbursementStatus === 'submitted',
  );

  const outstandingTotal = outstanding.reduce(
    (sum, r) => sum + parseFloat(r.reimbursementAmount ?? r.totalAmount ?? '0'),
    0,
  );

  const bySource: Record<string, number> = {};
  for (const r of outstanding) {
    const src = r.reimbursementSource ?? 'Unknown';
    bySource[src] = (bySource[src] ?? 0) + parseFloat(r.reimbursementAmount ?? r.totalAmount ?? '0');
  }

  const aging = { d0_30: 0, d30_60: 0, d60_90: 0, d90plus: 0 };
  for (const r of outstanding) {
    const refDate = r.reimbursementSubmittedAt ?? r.receiptDate ?? now;
    const days = Math.floor((now.getTime() - new Date(refDate).getTime()) / (1000 * 60 * 60 * 24));
    if (days <= 30) aging.d0_30 += parseFloat(r.reimbursementAmount ?? r.totalAmount ?? '0');
    else if (days <= 60) aging.d30_60 += parseFloat(r.reimbursementAmount ?? r.totalAmount ?? '0');
    else if (days <= 90) aging.d60_90 += parseFloat(r.reimbursementAmount ?? r.totalAmount ?? '0');
    else aging.d90plus += parseFloat(r.reimbursementAmount ?? r.totalAmount ?? '0');
  }

  const recent = [...all]
    .sort((a, b) => new Date(b.receiptDate ?? 0).getTime() - new Date(a.receiptDate ?? 0).getTime())
    .slice(0, 10);

  const counts = {
    pending: all.filter((r) => r.reimbursementStatus === 'pending' || !r.reimbursementStatus).length,
    submitted: all.filter((r) => r.reimbursementStatus === 'submitted').length,
    reimbursed: all.filter((r) => r.reimbursementStatus === 'reimbursed').length,
    declined: all.filter((r) => r.reimbursementStatus === 'declined').length,
    total: all.length,
  };

  return { outstandingTotal, bySource, aging, recent, counts };
}

// ─── Budget queries ────────────────────────────────────────────────────────────

export async function getBudgets(profileId: string) {
  return db.select().from(budgets).where(eq(budgets.userId, profileId));
}

export async function getBudgetMap(profileId: string): Promise<Record<string, number>> {
  const rows = await getBudgets(profileId);
  const map: Record<string, number> = {};
  for (const b of rows) {
    map[b.category] = parseFloat(b.monthlyLimit);
  }
  return map;
}

// ─── Spending insight queries ──────────────────────────────────────────────────

export async function getSpendingInsights(profileId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);

  const allReceipts = await db
    .select({
      id: receipts.id,
      totalAmount: receipts.totalAmount,
      category: receipts.category,
      merchant: receipts.merchant,
      receiptDate: receipts.receiptDate,
      status: receipts.status,
    })
    .from(receipts)
    .where(
      and(
        eq(receipts.userId, profileId),
        gte(receipts.receiptDate, threeMonthsAgo),
        sql`${receipts.status} = 'complete'`,
      ),
    );

  const thisMonth = allReceipts.filter(
    (r) => r.receiptDate && new Date(r.receiptDate) >= startOfMonth,
  );
  const lastMonth = allReceipts.filter(
    (r) =>
      r.receiptDate &&
      new Date(r.receiptDate) >= startOfLastMonth &&
      new Date(r.receiptDate) <= endOfLastMonth,
  );
  const threeMonthAll = allReceipts;

  // Top categories this month
  const catSpend: Record<string, number> = {};
  for (const r of thisMonth) {
    const cat = r.category ?? 'Uncategorised';
    catSpend[cat] = (catSpend[cat] ?? 0) + parseFloat(r.totalAmount ?? '0');
  }
  const topCategories = Object.entries(catSpend)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([category, amount]) => ({ category, amount }));

  // Top merchants this month
  const merchantSpend: Record<string, number> = {};
  for (const r of thisMonth) {
    if (!r.merchant) continue;
    merchantSpend[r.merchant] = (merchantSpend[r.merchant] ?? 0) + parseFloat(r.totalAmount ?? '0');
  }
  const topMerchants = Object.entries(merchantSpend)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([merchant, amount]) => ({ merchant, amount }));

  const thisMonthTotal = thisMonth.reduce((s, r) => s + parseFloat(r.totalAmount ?? '0'), 0);
  const lastMonthTotal = lastMonth.reduce((s, r) => s + parseFloat(r.totalAmount ?? '0'), 0);

  // 3-month avg monthly spend
  const avg3Month = threeMonthAll.reduce((s, r) => s + parseFloat(r.totalAmount ?? '0'), 0) / 3;

  // Average receipt value this month
  const avgReceiptValue = thisMonth.length > 0 ? thisMonthTotal / thisMonth.length : 0;

  // Monthly trend: last 6 months
  const monthlyTrend: { month: string; amount: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const dEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
    const label = d.toLocaleDateString('en-AU', { month: 'short', year: '2-digit' });
    const amount = allReceipts
      .filter(
        (r) =>
          r.receiptDate &&
          new Date(r.receiptDate) >= d &&
          new Date(r.receiptDate) <= dEnd,
      )
      .reduce((s, r) => s + parseFloat(r.totalAmount ?? '0'), 0);
    monthlyTrend.push({ month: label, amount });
  }

  // Category spend this month (for budget widget)
  const categorySpendThisMonth = catSpend;

  return {
    topCategories,
    topMerchants,
    thisMonthTotal,
    lastMonthTotal,
    avg3Month,
    avgReceiptValue,
    monthlyTrend,
    categorySpendThisMonth,
    thisMonthCount: thisMonth.length,
  };
}
