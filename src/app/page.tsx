import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-4 text-center">
      <div className="flex items-center gap-3">
        <FileText className="h-10 w-10 text-primary" />
        <h1 className="text-5xl font-bold tracking-tight">Docket</h1>
      </div>

      <p className="text-xl text-muted-foreground max-w-md">
        Your receipts, finally sorted.
      </p>

      <p className="text-sm text-muted-foreground max-w-sm">
        AI-powered receipt intelligence for the Australian market. Turn piles of receipts into
        structured, searchable, tax-aware financial data.
      </p>

      <div className="flex gap-4">
        <Link href="/sign-up" className={cn(buttonVariants({ size: 'lg' }))}>
          Get started — it&apos;s free
        </Link>
        <Link href="/sign-in" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}>
          Sign in
        </Link>
      </div>
    </main>
  );
}
