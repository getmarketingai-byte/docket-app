export type ReceiptStatus = 'uploading' | 'processing' | 'complete' | 'error';

export type SubscriptionTier = 'free' | 'pro' | 'business';

export type Receipt = {
  id: string;
  userId: string;
  status: ReceiptStatus;
  merchant?: string | null;
  merchantAbn?: string | null;
  receiptDate?: Date | null;
  totalAmount?: string | null;
  gstAmount?: string | null;
  subtotalAmount?: string | null;
  currency: string;
  paymentMethod?: string | null;
  receiptType?: string | null;
  category?: string | null;
  subcategory?: string | null;
  tags?: string[] | null;
  taxClaimable?: boolean | null;
  taxClaimableConfidence?: string | null;
  taxClaimableReasoning?: string | null;
  taxCategory?: string | null;
  businessPercentage?: number | null;
  lineItems?: unknown[] | null;
  ocrRawText?: string | null;
  aiExtractionRaw?: Record<string, unknown> | null;
  originalBlobUrl?: string | null;
  compressedBlobUrl?: string | null;
  odometerReading?: number | null;
  fuelLitres?: string | null;
  fuelType?: string | null;
  notes?: string | null;
  isDuplicate?: boolean | null;
  source?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type UserProfile = {
  id: string;
  clerkUserId: string;
  displayName?: string | null;
  taxProfile?: Record<string, unknown> | null;
  subscriptionTier?: string | null;
  stripeCustomerId?: string | null;
  settings?: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
};
