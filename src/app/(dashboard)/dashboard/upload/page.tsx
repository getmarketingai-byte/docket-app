'use client';

import { useState } from 'react';
import { UploadZone } from '@/components/receipts/upload-zone';
import { ReceiptInbox } from '@/components/receipts/receipt-inbox';

export default function UploadPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Upload Receipts</h1>
        <p className="text-muted-foreground mt-1">
          AI extracts merchant, amount, GST, and tax category automatically.{' '}
          <span className="text-xs">AI estimate — review with your accountant.</span>
        </p>
      </div>

      <UploadZone onUploadComplete={() => setRefreshTrigger(t => t + 1)} />

      <div>
        <h2 className="text-lg font-semibold mb-3">Recent Uploads</h2>
        <ReceiptInbox refreshTrigger={refreshTrigger} />
      </div>
    </div>
  );
}
