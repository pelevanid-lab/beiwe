import Link from 'next/link';
import { Home, Compass, Share2, Bookmark, BarChart2, Settings, User } from 'lucide-react';
import { LogoIcon } from '@/components/Logo';
import UserSidebarWidget from '@/components/UserSidebarWidget';

import Sidebar from '@/components/Sidebar';
import { AuthProvider } from '@/components/AuthProvider';
import { getDictionary } from '@/lib/dictionaries';

export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  return (
    <AuthProvider>
      <div className="h-screen bg-[var(--color-paper)] text-[var(--color-ink)] flex font-sans">
        {/* Left Sidebar */}
        <Sidebar dict={dict.app} />

        {/* Main Content Area */}
        <main className="flex-1 relative flex overflow-hidden">
          {children}
        </main>
      </div>
    </AuthProvider>
  );
}
