'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { receipts, userProfiles, auditLogs } from '@/lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

async function getProfileId(): Promise<string> {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) throw new Error('Unauthorized');

  const profiles = await db
    .select({ id: userProfiles.id })
    .from(userProfiles)
    .where(eq(userProfiles.clerkUserId, clerkUserId))
    .limit(1);

  const profileId = profiles[0]?.id;
  if (!profileId) throw new Error('Profile not found');
  return profileId;
}

export async function updateReceipt(receiptId: string, formData: FormData) {
  const profileId = await getProfileId();

  // Verify ownership
  const existing = await db
    .select({ id: receipts.id })
    .from(receipts)
    .where(and(eq(receipts.id, receiptId), eq(receipts.userId, profileId)))
    .limit(1);

  if (!existing[0]) throw new Error('Receipt not found');

  const fields: Record<string, string | null | boolean | number> = {};
  const auditEntries: { field: string; oldValue?: string | null; newValue?: string | null }[] = [];

  const stringFields = [
    'merchant', 'merchantAbn', 'category', 'subcategory',
    'paymentMethod', 'receiptType', 'notes', 'taxCategory',
    'fuelType', 'reimbursementStatus', 'reimbursementSource',
  ] as const;

  for (const f of stringFields) {
    const val = formData.get(f);
    if (val !== null) {
      fields[f] = val === '' ? null : (val as string);
      auditEntries.push({ field: f, newValue: val === '' ? null : (val as string) });
    }
  }

  const numFields = ['totalAmount', 'gstAmount', 'subtotalAmount', 'fuelLitres', 'reimbursementAmount'] as const;
  for (const f of numFields) {
    const val = formData.get(f);
    if (val !== null) {
      fields[f] = val === '' ? null : (val as string);
      auditEntries.push({ field: f, newValue: val === '' ? null : (val as string) });
    }
  }

  const bpVal = formData.get('businessPercentage');
  if (bpVal !== null) {
    fields['businessPercentage'] = bpVal === '' ? 0 : parseInt(bpVal as string, 10);
    auditEntries.push({ field: 'businessPercentage', newValue: bpVal as string });
  }

  const dateVal = formData.get('receiptDate');
  if (dateVal !== null) {
    (fields as Record<string, unknown>)['receiptDate'] = dateVal === '' ? null : new Date(dateVal as string);
    auditEntries.push({ field: 'receiptDate', newValue: dateVal as string });
  }

  const claimableVal = formData.get('taxClaimable');
  if (claimableVal !== null) {
    fields['taxClaimable'] = claimableVal === 'true' ? true : claimableVal === 'false' ? false : null;
    auditEntries.push({ field: 'taxClaimable', newValue: claimableVal as string });
  }

  const reimbursableVal = formData.get('reimbursable');
  if (reimbursableVal !== null) {
    fields['reimbursable'] = reimbursableVal === 'true';
    auditEntries.push({ field: 'reimbursable', newValue: reimbursableVal as string });
  }

  const reimbSubmittedVal = formData.get('reimbursementSubmittedAt');
  if (reimbSubmittedVal !== null) {
    (fields as Record<string, unknown>)['reimbursementSubmittedAt'] =
      reimbSubmittedVal === '' ? null : new Date(reimbSubmittedVal as string);
    auditEntries.push({ field: 'reimbursementSubmittedAt', newValue: reimbSubmittedVal as string });
  }

  const reimbReceivedVal = formData.get('reimbursementReceivedAt');
  if (reimbReceivedVal !== null) {
    (fields as Record<string, unknown>)['reimbursementReceivedAt'] =
      reimbReceivedVal === '' ? null : new Date(reimbReceivedVal as string);
    auditEntries.push({ field: 'reimbursementReceivedAt', newValue: reimbReceivedVal as string });
  }

  const isManualEntry = formData.get('manualEntry') === 'true';
  if (isManualEntry) {
    (fields as Record<string, unknown>)['status'] = 'complete';
    (fields as Record<string, unknown>)['source'] = 'manual';
  }

  if (Object.keys(fields).length === 0) return;

  await db
    .update(receipts)
    .set({ ...fields, updatedAt: new Date() })
    .where(eq(receipts.id, receiptId));

  // Audit log entries
  if (isManualEntry) {
    await db.insert(auditLogs).values({
      userId: profileId,
      receiptId,
      action: 'manual_entry',
      newValue: 'User entered receipt details manually',
    });
  }
  for (const entry of auditEntries) {
    await db.insert(auditLogs).values({
      userId: profileId,
      receiptId,
      action: 'manual_edit',
      fieldChanged: entry.field,
      newValue: entry.newValue,
    });
  }

  revalidatePath(`/dashboard/receipts/${receiptId}`);
  revalidatePath('/dashboard/receipts');
}

export async function deleteReceipt(receiptId: string) {
  const profileId = await getProfileId();

  await db
    .delete(receipts)
    .where(and(eq(receipts.id, receiptId), eq(receipts.userId, profileId)));

  revalidatePath('/dashboard/receipts');
  redirect('/dashboard/receipts');
}

export async function bulkMarkReimbursable(receiptIds: string[], reimbursable: boolean) {
  if (receiptIds.length === 0) return;
  const profileId = await getProfileId();

  await db
    .update(receipts)
    .set({
      reimbursable,
      reimbursementStatus: reimbursable ? 'pending' : null,
      updatedAt: new Date(),
    })
    .where(and(eq(receipts.userId, profileId), inArray(receipts.id, receiptIds)));

  revalidatePath('/dashboard/receipts');
  revalidatePath('/dashboard/reimbursements');
}

export async function dismissDuplicateAction(receiptId: string) {
  const profileId = await getProfileId();

  await db
    .update(receipts)
    .set({ isDuplicate: false, duplicateOfId: null, updatedAt: new Date() })
    .where(and(eq(receipts.id, receiptId), eq(receipts.userId, profileId)));

  revalidatePath(`/dashboard/receipts/${receiptId}`);
  revalidatePath('/dashboard/analytics');
  revalidatePath('/dashboard/receipts');
}
