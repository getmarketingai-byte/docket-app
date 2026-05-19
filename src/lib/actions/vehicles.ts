'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { vehicles, vehicleFuelLogs, receipts } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getCurrentUserProfileId } from '@/lib/db/queries';

export async function createVehicle(formData: FormData) {
  const profileId = await getCurrentUserProfileId();
  if (!profileId) redirect('/sign-in');

  const name = String(formData.get('name') ?? '').trim();
  if (!name) throw new Error('Vehicle name is required');

  const make = String(formData.get('make') ?? '').trim() || null;
  const model = String(formData.get('model') ?? '').trim() || null;
  const yearStr = String(formData.get('year') ?? '').trim();
  const year = yearStr ? parseInt(yearStr) : null;
  const rego = String(formData.get('rego') ?? '').trim() || null;
  const fuelType = String(formData.get('fuelType') ?? 'petrol').trim();
  const businessUsePercentStr = String(formData.get('businessUsePercent') ?? '0');
  const businessUsePercent = parseInt(businessUsePercentStr) || 0;

  await db.insert(vehicles).values({ userId: profileId, name, make, model, year, rego, fuelType, businessUsePercent });
  revalidatePath('/dashboard/vehicles');
  redirect('/dashboard/vehicles');
}

export async function updateVehicle(vehicleId: string, formData: FormData) {
  const profileId = await getCurrentUserProfileId();
  if (!profileId) redirect('/sign-in');

  const name = String(formData.get('name') ?? '').trim();
  if (!name) throw new Error('Vehicle name is required');
  const make = String(formData.get('make') ?? '').trim() || null;
  const model = String(formData.get('model') ?? '').trim() || null;
  const yearStr = String(formData.get('year') ?? '').trim();
  const year = yearStr ? parseInt(yearStr) : null;
  const rego = String(formData.get('rego') ?? '').trim() || null;
  const fuelType = String(formData.get('fuelType') ?? 'petrol').trim();
  const businessUsePercentStr = String(formData.get('businessUsePercent') ?? '0');
  const businessUsePercent = parseInt(businessUsePercentStr) || 0;

  await db.update(vehicles)
    .set({ name, make, model, year, rego, fuelType, businessUsePercent, updatedAt: new Date() })
    .where(and(eq(vehicles.id, vehicleId), eq(vehicles.userId, profileId)));

  revalidatePath(`/dashboard/vehicles/${vehicleId}`);
  revalidatePath('/dashboard/vehicles');
}

export async function deleteVehicle(vehicleId: string) {
  const profileId = await getCurrentUserProfileId();
  if (!profileId) redirect('/sign-in');

  await db.delete(vehicles)
    .where(and(eq(vehicles.id, vehicleId), eq(vehicles.userId, profileId)));

  revalidatePath('/dashboard/vehicles');
  redirect('/dashboard/vehicles');
}

export async function assignReceiptToVehicle(receiptId: string, vehicleId: string | null) {
  const profileId = await getCurrentUserProfileId();
  if (!profileId) redirect('/sign-in');

  await db.update(receipts)
    .set({ vehicleId, updatedAt: new Date() })
    .where(and(eq(receipts.id, receiptId), eq(receipts.userId, profileId)));

  // If assigning to a vehicle and receipt has fuel data, create/update fuel log
  if (vehicleId) {
    const receipt = await db.select().from(receipts)
      .where(and(eq(receipts.id, receiptId), eq(receipts.userId, profileId)))
      .limit(1);
    const r = receipt[0];
    if (r && (r.fuelLitres || r.odometerReading)) {
      // Check if fuel log already exists for this receipt
      const existing = await db.select().from(vehicleFuelLogs)
        .where(eq(vehicleFuelLogs.receiptId, receiptId)).limit(1);
      if (!existing[0]) {
        await db.insert(vehicleFuelLogs).values({
          vehicleId,
          receiptId,
          litres: r.fuelLitres ?? null,
          odometerReading: r.odometerReading ?? null,
          fuelType: r.fuelType ?? null,
          totalCost: r.totalAmount ?? null,
        });
      }
    }
  }

  revalidatePath(`/dashboard/receipts/${receiptId}`);
  revalidatePath(`/dashboard/vehicles`);
}
