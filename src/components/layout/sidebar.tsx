'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Receipt,
  Upload,
  Search,
  Download,
  Settings,
  FileText,
  Menu,
  X,
  Car,
  PieChart,
  CreditCard,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/receipts', label: 'Receipts', icon: Receipt },
  { href: '/dashboard/vehicles', label: 'Vehicles', icon: Car },
  { href: '/dashboard/reimbursements', label: 'Reimbursements', icon: CreditCard },
  { href: '/dashboard/budgets', label: 'Budgets', icon: PieChart },
  { href: '/dashboard/upload', label: 'Upload', icon: Upload },
  { href: '/dashboard/search', label: 'Search', icon: Search },
  { href: '/dashboard/exports', label: 'Exports', icon: Download },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {navItems.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          onClick={onNavigate}
          className={cn(
            'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
            pathname === href
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
          )}
        >
          <Icon className="h-4 w-4" />
          {label}
        </Link>
      ))}
    </nav>
  );
}

/** Desktop sidebar — rendered in the layout flex row */
export function Sidebar() {
  return (
    <aside className="hidden w-56 shrink-0 border-r bg-background lg:flex lg:flex-col">
      <div className="flex h-full flex-col gap-4 p-4">
        <div className="flex items-center gap-2 px-3 py-2">
          <FileText className="h-5 w-5 text-primary" />
          <span className="text-lg font-bold">Docket</span>
        </div>
        <NavLinks />
      </div>
    </aside>
  );
}

/** Mobile nav — hamburger button + slide-out sheet, rendered in Topbar */
export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className="lg:hidden inline-flex items-center justify-center rounded-md p-2 hover:bg-accent"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </SheetTrigger>
      <SheetContent side="left" className="w-56 p-4">
        <div className="flex items-center justify-between px-3 py-2 mb-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <span className="text-lg font-bold">Docket</span>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="rounded-md p-1 hover:bg-accent"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <NavLinks onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
