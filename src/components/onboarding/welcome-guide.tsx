'use client';

import Link from 'next/link';
import { Upload, Sparkles, FileText, CheckCircle2 } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const STEPS = [
  {
    icon: Upload,
    title: 'Upload your first receipt',
    description: 'Snap a photo or drag-and-drop any receipt, invoice, or PDF. We support JPEG, PNG, WebP, HEIC and PDF.',
    done: false,
  },
  {
    icon: Sparkles,
    title: 'AI extracts the data',
    description: 'Claude automatically reads the merchant, amount, GST, date and category — usually within 30 seconds.',
    done: false,
  },
  {
    icon: FileText,
    title: 'Export for your accountant',
    description: 'Generate a CSV, BAS/GST summary, or PDF report — formatted for Australian tax requirements.',
    done: false,
  },
];

export function WelcomeGuide() {
  return (
    <div className="max-w-2xl mx-auto py-12 space-y-10">
      {/* Hero */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-2">
          <Sparkles className="h-7 w-7 text-primary" />
        </div>
        <h1 className="text-2xl font-bold">Welcome to Docket</h1>
        <p className="text-muted-foreground max-w-sm mx-auto">
          Your AI-powered receipt organiser for Australian tax time. Get started in three steps.
        </p>
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {STEPS.map((step, i) => (
          <div key={i} className="flex gap-4 rounded-xl border bg-card p-4">
            <div className="flex-shrink-0 flex items-start pt-0.5">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-xs font-bold text-muted-foreground">
                {i + 1}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <step.icon className="h-4 w-4 text-primary flex-shrink-0" />
                <p className="font-medium text-sm">{step.title}</p>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{step.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="flex flex-col items-center gap-3">
        <Link href="/dashboard/upload" className={cn(buttonVariants({ size: 'lg' }), 'gap-2')}>
          <Upload className="h-4 w-4" />
          Upload your first receipt
        </Link>
        <Link href="/dashboard/settings" className="text-xs text-muted-foreground hover:underline">
          Set up your tax profile first →
        </Link>
      </div>

      {/* Disclaimer */}
      <p className="text-center text-xs text-muted-foreground">
        AI estimates only — always review tax decisions with your accountant.
      </p>
    </div>
  );
}

export function ReceiptsEmptyState({ hasFilters }: { hasFilters?: boolean }) {
  if (hasFilters) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted">
          <FileText className="h-5 w-5 text-muted-foreground" />
        </div>
        <h2 className="font-semibold">No receipts match your filters</h2>
        <p className="text-sm text-muted-foreground max-w-xs">
          Try adjusting or clearing your search filters to see more results.
        </p>
        <Link href="/dashboard/receipts" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
          Clear filters
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted">
        <Upload className="h-5 w-5 text-muted-foreground" />
      </div>
      <h2 className="font-semibold">No receipts yet</h2>
      <p className="text-sm text-muted-foreground max-w-xs">
        Upload your first receipt and AI will extract and categorise it automatically.
      </p>
      <Link href="/dashboard/upload" className={cn(buttonVariants({ size: 'sm' }))}>
        Upload receipts
      </Link>
    </div>
  );
}

export function SearchEmptyState({ query }: { query?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted">
        <FileText className="h-5 w-5 text-muted-foreground" />
      </div>
      <h2 className="font-semibold">
        {query ? `No results for "${query}"` : 'Search your receipts'}
      </h2>
      <p className="text-sm text-muted-foreground max-w-xs">
        {query
          ? 'Try a different merchant name, category or date range.'
          : 'Search by merchant, category, amount, date, or any text from your receipts.'}
      </p>
    </div>
  );
}

export function ExportsEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted">
        <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
      </div>
      <h2 className="font-semibold">Nothing to export yet</h2>
      <p className="text-sm text-muted-foreground max-w-xs">
        Upload and process some receipts first, then come back here to export your tax data.
      </p>
      <Link href="/dashboard/upload" className={cn(buttonVariants({ size: 'sm' }))}>
        Upload receipts
      </Link>
    </div>
  );
}
