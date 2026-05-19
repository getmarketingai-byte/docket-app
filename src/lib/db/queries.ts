import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { receipts, userProfiles, auditLogs, vehicles, vehicleFuelLogs } from '@/lib/db/schema';
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
