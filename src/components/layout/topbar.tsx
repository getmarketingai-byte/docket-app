import { UserButton } from '@clerk/nextjs';
import { MobileNav } from './sidebar';

export function Topbar() {
  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background px-4">
      <MobileNav />
      <div className="flex-1" />
      <UserButton />
    </header>
  );
}
