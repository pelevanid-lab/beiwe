'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Bookmark, Users, Calendar, Link2, Settings, MonitorDown, Briefcase, Inbox, FileText, History } from 'lucide-react';
import { LogoIcon } from '@/components/Logo';
import UserSidebarWidget from '@/components/UserSidebarWidget';
import React, { useState } from 'react';
import { WorkspaceModal } from '@/components/WorkspaceModal';

const SidebarItem = ({ icon: Icon, label, href, active, onClick }: { icon: any, label: string, href?: string, active: boolean, onClick?: () => void }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div 
      className="relative flex items-center justify-center"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {href ? (
        <Link href={href} className={`transition-colors p-2 rounded-xl ${active ? 'text-[var(--color-burnt-orange)] bg-[var(--color-burnt-orange)]/10' : 'text-[var(--color-ink-light)] hover:text-[var(--color-ink)] hover:bg-[var(--color-ink)]/5'}`}>
          <Icon size={22} />
        </Link>
      ) : (
        <button onClick={onClick} className={`transition-colors p-2 rounded-xl ${active ? 'text-[var(--color-burnt-orange)] bg-[var(--color-burnt-orange)]/10' : 'text-[var(--color-ink-light)] hover:text-[var(--color-ink)] hover:bg-[var(--color-ink)]/5'}`}>
          <Icon size={22} />
        </button>
      )}
      
      {showTooltip && (
        <div className="absolute left-full ml-3 px-3 py-1.5 bg-[var(--color-ink)] text-[var(--color-paper)] text-xs font-medium rounded shadow-xl whitespace-nowrap z-50 animate-in fade-in zoom-in-95 duration-200">
          {label}
          <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-y-4 border-y-transparent border-r-4 border-r-[var(--color-ink)]" />
        </div>
      )}
    </div>
  );
};

export default function Sidebar({ dict }: { dict?: any }) {
  const pathname = usePathname();
  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false);
  const locale = pathname.split('/')[1] || 'tr';

  // Aktif kontrolü: pathname eşleşmesine bakıyoruz
  const isActive = (path: string) => {
    if (path === '/app') {
      return pathname === `/${locale}/app` || pathname === `/${locale}/app/`;
    }
    return pathname.includes(path);
  };

  return (
    <aside className="w-16 flex flex-col items-center py-6 border-r border-[var(--color-ink)]/5 shrink-0 bg-[var(--color-paper)] z-50">
      <div className="mb-12 relative group cursor-pointer">
        <Link href={`/${locale}/app`}>
          <LogoIcon className="w-9 h-9 text-[var(--color-ink)] group-hover:text-[var(--color-burnt-orange)] transition-colors" />
        </Link>
        <div className="absolute left-full ml-3 px-3 py-1.5 bg-[var(--color-ink)] text-[var(--color-paper)] text-xs font-medium rounded shadow-xl whitespace-nowrap z-50 hidden group-hover:block animate-in fade-in zoom-in-95 duration-200">
          Beiwe OS
          <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-y-4 border-y-transparent border-r-4 border-r-[var(--color-ink)]" />
        </div>
      </div>
      
      <nav className="flex-1 flex flex-col items-center gap-6 w-full">
        <SidebarItem icon={Home} label={dict?.nav_home || "Ana Sayfa"} href={`/${locale}/app`} active={isActive('/app')} />
        <SidebarItem icon={Inbox} label={dict?.nav_inbox || "Gelen Kutusu"} href={`/${locale}/app/inbox`} active={isActive('/inbox')} />
        <SidebarItem 
          icon={Briefcase} 
          label={dict?.nav_workspace || "İşletmeniz/Çalışma Alanınız"} 
          active={isWorkspaceModalOpen} 
          onClick={() => setIsWorkspaceModalOpen(true)} 
        />

        <SidebarItem icon={FileText} label={dict?.nav_docs || "Dokümanlar"} href={`/${locale}/app/docs`} active={isActive('/docs')} />
        <SidebarItem icon={Users} label={dict?.nav_customers || "Müşteriler"} href={`/${locale}/app/customers`} active={isActive('/customers')} />
        <SidebarItem icon={Calendar} label={dict?.nav_appointments || "Randevular"} href={`/${locale}/app/appointments`} active={isActive('/appointments')} />
        <div className="w-8 h-px bg-[var(--color-ink)]/10 my-2" />
        <SidebarItem icon={Link2} label={dict?.nav_integrations || "Entegrasyonlar"} href={`/${locale}/app/integrations`} active={isActive('/integrations')} />
        <SidebarItem icon={MonitorDown} label={dict?.nav_download || "Uygulamayı İndir"} href={`/${locale}/app/download`} active={isActive('/download')} />
      </nav>

      <div className="flex flex-col items-center gap-6 w-full mt-auto">
        <SidebarItem icon={Bookmark} label={dict?.nav_clarity_notes || "Netleştirici Notlar"} href={`/${locale}/app/notes`} active={isActive('/notes')} />

        <SidebarItem icon={Settings} label={dict?.nav_settings || "Ayarlar"} href="#" active={false} />
        <UserSidebarWidget />
      </div>

      <WorkspaceModal isOpen={isWorkspaceModalOpen} onClose={() => setIsWorkspaceModalOpen(false)} />
    </aside>
  );
}
