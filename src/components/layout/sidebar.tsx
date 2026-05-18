'use client';

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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/receipts', label: 'Receipts', icon: Receipt },
  { href: '/dashboard/upload', label: 'Upload', icon: Upload },
  { href: '/dashboard/search', label: 'Search', icon: Search },
  { href: '/dashboard/exports', label: 'Exports', icon: Download },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

function NavLinks({ onClick }: { onClick?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {navItems.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          onClick={onClick}
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

export function Sidebar() {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-56 shrink-0 border-r bg-background lg:block">
        <div className="flex h-full flex-col gap-4 p-4">
          <div className="flex items-center gap-2 px-3 py-2">
            <FileText className="h-5 w-5 text-primary" />
            <span className="text-lg font-bold">Docket</span>
          </div>
          <NavLinks />
        </div>
      </aside>

      {/* Mobile sidebar (Sheet) */}
      <Sheet>
        <SheetTrigger className="lg:hidden inline-flex items-center justify-center rounded-md p-2 hover:bg-accent">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open menu</span>
        </SheetTrigger>
        <SheetContent side="left" className="w-56 p-4">
          <div className="flex items-center gap-2 px-3 py-2 mb-4">
            <FileText className="h-5 w-5 text-primary" />
            <span className="text-lg font-bold">Docket</span>
          </div>
          <NavLinks />
        </SheetContent>
      </Sheet>
    </>
  );
}
