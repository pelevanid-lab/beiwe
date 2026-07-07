import Link from 'next/link';
import { Home, Compass, Share2, Bookmark, BarChart2, Settings, User } from 'lucide-react';
import { LogoIcon } from '@/components/Logo';
import UserSidebarWidget from '@/components/UserSidebarWidget';

export default function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  return (
    <div className="min-h-screen bg-[var(--color-paper)] text-[var(--color-ink)] flex font-sans">
      {/* Left Sidebar */}
      <aside className="w-16 flex flex-col items-center py-6 border-r border-[var(--color-ink)]/5 shrink-0 bg-[var(--color-paper)] z-50">
        <div className="mb-12">
          <LogoIcon className="w-9 h-9 text-[var(--color-ink)] hover:text-[var(--color-burnt-orange)] transition-colors cursor-pointer" />
        </div>
        
        <nav className="flex-1 flex flex-col items-center gap-8 text-[var(--color-ink-light)]">
          <Link href="#" className="hover:text-[var(--color-ink)] transition-colors"><Home size={22} /></Link>
          <Link href="#" className="hover:text-[var(--color-ink)] transition-colors"><Compass size={22} /></Link>
          <Link href="#" className="hover:text-[var(--color-ink)] transition-colors"><Share2 size={22} /></Link>
          <Link href="#" className="hover:text-[var(--color-ink)] transition-colors"><Bookmark size={22} /></Link>
          <Link href="#" className="hover:text-[var(--color-ink)] transition-colors"><BarChart2 size={22} /></Link>
        </nav>

        <div className="flex flex-col items-center gap-8 text-[var(--color-ink-light)] mt-auto">
          <Link href="#" className="hover:text-[var(--color-ink)] transition-colors"><Settings size={22} /></Link>
          <UserSidebarWidget />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 relative flex overflow-hidden">
        {children}
      </main>
    </div>
  );
}
