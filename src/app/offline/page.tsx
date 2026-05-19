'use client';

import { WifiOff } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="text-center max-w-sm">
        <div className="flex justify-center mb-6">
          <div className="rounded-full bg-muted p-4">
            <WifiOff className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight mb-2">
          You&apos;re offline
        </h1>
        <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
          Docket needs a connection to load. Check your internet and try again —
          any receipts you&apos;ve already viewed are still available.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
