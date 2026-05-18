import {
  pgTable,
  uuid,
  text,
  jsonb,
  timestamp,
  integer,
  decimal,
  boolean,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

// ─── user_profiles ────────────────────────────────────────────────────────────

export const userProfiles = pgTable(
  'user_profiles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clerkUserId: text('clerk_user_id').notNull().unique(),
    displayName: text('display_name'),
    taxProfile: jsonb('tax_profile').$type<Record<string, unknown>>(),
    subscriptionTier: text('subscription_tier').default('free'),
    stripeCustomerId: text('stripe_customer_id'),
    settings: jsonb('settings').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => ({
    clerkUserIdIdx: uniqueIndex('user_profiles_clerk_user_id_idx').on(t.clerkUserId),
  }),
);

// ─── receipts ─────────────────────────────────────────────────────────────────

export const receipts = pgTable(
  'receipts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => userProfiles.id, { onDelete: 'cascade' }),

    // Processing status
    status: text('status').notNull().default('uploading'),
    // uploading | processing | complete | error

    // Core receipt fields
    merchant: text('merchant'),
    merchantAbn: text('merchant_abn'),
    receiptDate: timestamp('receipt_date'),
    totalAmount: decimal('total_amount', { precision: 10, scale: 2 }),
    gstAmount: decimal('gst_amount', { precision: 10, scale: 2 }),
    subtotalAmount: decimal('subtotal_amount', { precision: 10, scale: 2 }),
    currency: text('currency').default('AUD'),
    paymentMethod: text('payment_method'),
    receiptType: text('receipt_type'),

    // Categorisation
    category: text('category'),
    subcategory: text('subcategory'),
    tags: text('tags').array(),

    // Tax fields
    taxClaimable: boolean('tax_claimable'),
    taxClaimableConfidence: decimal('tax_claimable_confidence', { precision: 5, scale: 2 }),
    taxClaimableReasoning: text('tax_claimable_reasoning'),
    taxCategory: text('tax_category'),
    businessPercentage: integer('business_percentage').default(0),

    // AI / OCR
    lineItems: jsonb('line_items').$type<unknown[]>(),
    ocrRawText: text('ocr_raw_text'),
    aiExtractionRaw: jsonb('ai_extraction_raw').$type<Record<string, unknown>>(),

    // Blob storage
    originalBlobUrl: text('original_blob_url'),
    compressedBlobUrl: text('compressed_blob_url'),

    // Vehicle / fuel
    odometerReading: integer('odometer_reading'),
    fuelLitres: decimal('fuel_litres', { precision: 8, scale: 3 }),
    fuelType: text('fuel_type'),

    // Meta
    notes: text('notes'),
    isDuplicate: boolean('is_duplicate').default(false),
    source: text('source').default('upload'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => ({
    userDateIdx: index('receipts_user_date_idx').on(t.userId, t.receiptDate),
    userMerchantIdx: index('receipts_user_merchant_idx').on(t.userId, t.merchant),
    userCategoryIdx: index('receipts_user_category_idx').on(t.userId, t.category),
    userStatusIdx: index('receipts_user_status_idx').on(t.userId, t.status),
  }),
);

// ─── audit_logs ───────────────────────────────────────────────────────────────

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => userProfiles.id, { onDelete: 'cascade' }),
  receiptId: uuid('receipt_id').references(() => receipts.id, { onDelete: 'set null' }),
  action: text('action').notNull(),
  fieldChanged: text('field_changed'),
  oldValue: text('old_value'),
  newValue: text('new_value'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
