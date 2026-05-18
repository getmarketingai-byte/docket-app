import { UserButton } from '@clerk/nextjs';
import { Sidebar } from './sidebar';

export function Topbar() {
  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background px-4">
      <Sidebar />
      <div className="flex-1" />
      <UserButton />
    </header>
  );
}
