'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Bookmark, Users, Calendar, Link2, Settings, MonitorDown } from 'lucide-react';
import { LogoIcon } from '@/components/Logo';
import UserSidebarWidget from '@/components/UserSidebarWidget';
import React, { useState } from 'react';

const SidebarItem = ({ icon: Icon, label, href, active }: { icon: any, label: string, href: string, active: boolean }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div 
      className="relative flex items-center justify-center"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <Link href={href} className={`transition-colors p-2 rounded-xl ${active ? 'text-[var(--color-burnt-orange)] bg-[var(--color-burnt-orange)]/10' : 'text-[var(--color-ink-light)] hover:text-[var(--color-ink)] hover:bg-[var(--color-ink)]/5'}`}>
        <Icon size={22} />
      </Link>
      
      {showTooltip && (
        <div className="absolute left-full ml-3 px-3 py-1.5 bg-[var(--color-ink)] text-[var(--color-paper)] text-xs font-medium rounded shadow-xl whitespace-nowrap z-50 animate-in fade-in zoom-in-95 duration-200">
          {label}
          <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-y-4 border-y-transparent border-r-4 border-r-[var(--color-ink)]" />
        </div>
      )}
    </div>
  );
};

export default function Sidebar() {
  const pathname = usePathname();

  // Aktif kontrolü: pathname eşleşmesine bakıyoruz
  const isActive = (path: string) => {
    if (path === '/tr/app' || path === '/en/app') {
      return pathname === '/tr/app' || pathname === '/en/app' || pathname === '/tr/app/' || pathname === '/en/app/';
    }
    return pathname.includes(path);
  };

  return (
    <aside className="w-16 flex flex-col items-center py-6 border-r border-[var(--color-ink)]/5 shrink-0 bg-[var(--color-paper)] z-50">
      <div className="mb-12 relative group cursor-pointer">
        <Link href="/tr/app">
          <LogoIcon className="w-9 h-9 text-[var(--color-ink)] group-hover:text-[var(--color-burnt-orange)] transition-colors" />
        </Link>
        <div className="absolute left-full ml-3 px-3 py-1.5 bg-[var(--color-ink)] text-[var(--color-paper)] text-xs font-medium rounded shadow-xl whitespace-nowrap z-50 hidden group-hover:block animate-in fade-in zoom-in-95 duration-200">
          Beiwe OS
          <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-y-4 border-y-transparent border-r-4 border-r-[var(--color-ink)]" />
        </div>
      </div>
      
      <nav className="flex-1 flex flex-col items-center gap-6 w-full">
        <SidebarItem icon={Home} label="Ana Sayfa" href="/tr/app" active={isActive('/tr/app')} />
        <SidebarItem icon={Bookmark} label="Notlar" href="/tr/app/notes" active={isActive('/notes')} />
        <SidebarItem icon={Users} label="Müşteriler" href="/tr/app/customers" active={isActive('/customers')} />
        <SidebarItem icon={Calendar} label="Randevular" href="/tr/app/appointments" active={isActive('/appointments')} />
        <div className="w-8 h-px bg-[var(--color-ink)]/10 my-2" />
        <SidebarItem icon={Link2} label="Entegrasyonlar" href="/tr/app/integrations" active={isActive('/integrations')} />
        <SidebarItem icon={MonitorDown} label="Uygulamayı İndir" href="/tr/app/download" active={isActive('/download')} />
      </nav>

      <div className="flex flex-col items-center gap-6 w-full mt-auto">
        <SidebarItem icon={Settings} label="Ayarlar" href="#" active={false} />
        <UserSidebarWidget />
      </div>
    </aside>
  );
}
