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
    stripeSubscriptionId: text('stripe_subscription_id'),
    stripeSubscriptionStatus: text('stripe_subscription_status'),
    settings: jsonb('settings').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => ({
    clerkUserIdIdx: uniqueIndex('user_profiles_clerk_user_id_idx').on(t.clerkUserId),
  }),
);

// ─── vehicles ─────────────────────────────────────────────────────────────────
export const vehicles = pgTable(
  'vehicles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => userProfiles.id, { onDelete: 'cascade' }),
    name: text('name').notNull(), // nickname e.g. "Work Ute"
    make: text('make'),
    model: text('model'),
    year: integer('year'),
    rego: text('rego'), // registration plate
    fuelType: text('fuel_type').default('petrol'), // petrol | diesel | electric | hybrid
    businessUsePercent: integer('business_use_percent').default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => ({
    userVehicleIdx: index('vehicles_user_idx').on(t.userId),
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

    // Reimbursement
    reimbursable: boolean('reimbursable').default(false),
    reimbursementStatus: text('reimbursement_status'),
    // pending | submitted | reimbursed | declined
    reimbursementSource: text('reimbursement_source'),
    reimbursementSubmittedAt: timestamp('reimbursement_submitted_at'),
    reimbursementReceivedAt: timestamp('reimbursement_received_at'),
    reimbursementAmount: decimal('reimbursement_amount', { precision: 10, scale: 2 }),

    // Meta
    notes: text('notes'),
    isDuplicate: boolean('is_duplicate').default(false),
    duplicateOfId: uuid('duplicate_of_id'), // FK set after table definition to avoid self-reference issues
    source: text('source').default('upload'),
    vehicleId: uuid('vehicle_id').references(() => vehicles.id, { onDelete: 'set null' }),

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

// ─── budgets ──────────────────────────────────────────────────────────────────

export const budgets = pgTable(
  'budgets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => userProfiles.id, { onDelete: 'cascade' }),
    category: text('category').notNull(), // 'overall' or a category name
    monthlyLimit: decimal('monthly_limit', { precision: 10, scale: 2 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => ({
    userCategoryIdx: uniqueIndex('budgets_user_category_idx').on(t.userId, t.category),
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

// ─── share_tokens ─────────────────────────────────────────────────────────────
export const shareTokens = pgTable(
  'share_tokens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => userProfiles.id, { onDelete: 'cascade' }),
    token: text('token').notNull().unique(), // 64-char hex random
    label: text('label').notNull().default('Accountant access'), // user-facing name
    dateFrom: timestamp('date_from'),   // optional filter: receipts from this date
    dateTo: timestamp('date_to'),       // optional filter: receipts up to this date
    expiresAt: timestamp('expires_at'), // null = no expiry
    revokedAt: timestamp('revoked_at'), // null = active
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => ({
    tokenIdx: uniqueIndex('share_tokens_token_idx').on(t.token),
    userIdx: index('share_tokens_user_idx').on(t.userId),
  }),
);

// ─── vehicle_fuel_logs ────────────────────────────────────────────────────────
export const vehicleFuelLogs = pgTable(
  'vehicle_fuel_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    vehicleId: uuid('vehicle_id').notNull().references(() => vehicles.id, { onDelete: 'cascade' }),
    receiptId: uuid('receipt_id').references(() => receipts.id, { onDelete: 'set null' }),
    litres: decimal('litres', { precision: 8, scale: 3 }),
    odometerReading: integer('odometer_reading'),
    fuelType: text('fuel_type'),
    costPerLitre: decimal('cost_per_litre', { precision: 8, scale: 3 }),
    totalCost: decimal('total_cost', { precision: 10, scale: 2 }),
    loggedAt: timestamp('logged_at').defaultNow().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => ({
    vehicleFuelLogIdx: index('vehicle_fuel_logs_vehicle_idx').on(t.vehicleId),
  }),
);
