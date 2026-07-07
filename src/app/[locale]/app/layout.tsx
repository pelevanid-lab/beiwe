import Link from 'next/link';
import { Home, Compass, Share2, Bookmark, BarChart2, Settings, User } from 'lucide-react';
import { LogoIcon } from '@/components/Logo';
import UserSidebarWidget from '@/components/UserSidebarWidget';

import Sidebar from '@/components/Sidebar';
import { AuthProvider } from '@/components/AuthProvider';

export default function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-[var(--color-paper)] text-[var(--color-ink)] flex font-sans">
        {/* Left Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <main className="flex-1 relative flex overflow-hidden">
          {children}
        </main>
      </div>
    </AuthProvider>
  );
}
