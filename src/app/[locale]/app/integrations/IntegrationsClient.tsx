'use client';

import React, { useState, useEffect } from 'react';
import { Link2, MessageCircle, Mail, Camera, Briefcase, Globe, X, Maximize2, Minimize2, ShieldCheck, MonitorDown } from 'lucide-react';

const integrations = [
  {
    id: 'whatsapp',
    name: 'WhatsApp Web',
    description: 'Müşterilerinizle anında mesajlaşın',
    icon: MessageCircle,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    url: 'https://web.whatsapp.com'
  },
  {
    id: 'outlook',
    name: 'Microsoft Outlook',
    description: 'E-postalarınızı ve takviminizi yönetin',
    icon: Mail,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    url: 'https://outlook.office.com'
  },
  {
    id: 'instagram',
    name: 'Instagram',
    description: 'Sosyal medya hesaplarınızı takip edin',
    icon: Camera,
    color: 'text-pink-500',
    bgColor: 'bg-pink-500/10',
    url: 'https://instagram.com'
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    description: 'İş ağınızı genişletin ve yönetin',
    icon: Briefcase,
    color: 'text-blue-700',
    bgColor: 'bg-blue-700/10',
    url: 'https://linkedin.com'
  }
];

export default function IntegrationsClient({ dict }: { dict: any }) {
  const [activeIframeUrl, setActiveIframeUrl] = useState<string | null>(null);
  const [isIframeFullscreen, setIsIframeFullscreen] = useState(false);
  const [isIframeBlocked, setIsIframeBlocked] = useState(false);

  // Check if Iframe URL is blocked by X-Frame-Options
  useEffect(() => {
    if (!activeIframeUrl) {
      setIsIframeBlocked(false);
      return;
    }
    const checkIframe = async () => {
      // In Desktop app (Electron), framing is always allowed
      const isElectron = typeof window !== 'undefined' && (window.navigator.userAgent.indexOf('Electron') > -1 || window.navigator.userAgent.indexOf('BeiweOS') > -1);
      if (isElectron) {
        setIsIframeBlocked(false);
        return;
      }
      try {
        const res = await fetch(`/api/check-iframe?url=${encodeURIComponent(activeIframeUrl)}`);
        const data = await res.json();
        setIsIframeBlocked(data.blocked);
      } catch {
        setIsIframeBlocked(true);
      }
    };
    checkIframe();
  }, [activeIframeUrl]);

  const handleOpen = (url: string) => {
    setActiveIframeUrl(url);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--color-paper)] p-8 overflow-y-auto w-full relative">
      <div className="max-w-5xl mx-auto w-full space-y-8">
        
        <header className="flex flex-col gap-2 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[var(--color-burnt-orange)]/10 rounded-xl text-[var(--color-burnt-orange)]">
              <Link2 size={24} />
            </div>
            <h1 className="text-3xl font-bold text-[var(--color-ink)] tracking-tight">Entegrasyonlar</h1>
          </div>
          <p className="text-[var(--color-ink-light)] text-lg">
            Sık kullandığınız uygulamalara ve araçlara hızlı erişim sağlayın
          </p>
        </header>

        {activeIframeUrl ? (
          <div className={
            isIframeFullscreen
              ? "fixed inset-0 z-[100] bg-white flex flex-col"
              : "w-full mt-6 rounded-3xl overflow-hidden border border-[var(--color-ink)]/10 shadow-lg relative flex-1 flex flex-col min-h-[500px]"
          }>
            <div className="bg-[var(--color-ink)]/5 h-12 flex items-center px-4 justify-between border-b border-[var(--color-ink)]/10 shrink-0">
              <div className="flex items-center gap-2">
                <Globe size={16} className="text-[var(--color-ink-light)]" />
                <span className="text-sm font-medium text-[var(--color-ink-light)] truncate max-w-sm">{activeIframeUrl}</span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setIsIframeFullscreen(!isIframeFullscreen)} className="p-2 hover:bg-[var(--color-ink)]/10 rounded-full transition-colors text-[var(--color-ink-light)] hover:text-[var(--color-ink)]">
                  {isIframeFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>
                <button onClick={() => { setActiveIframeUrl(null); setIsIframeFullscreen(false); }} className="p-2 hover:bg-[var(--color-ink)]/10 rounded-full transition-colors text-[var(--color-ink-light)] hover:text-red-500">
                  <X size={18} />
                </button>
              </div>
            </div>
            
            {isIframeBlocked ? (
              <div className="w-full flex-1 bg-[var(--color-paper)] border-none flex flex-col items-center justify-center p-8 text-center">
                <div className="p-6 bg-[var(--color-burnt-orange)]/10 rounded-3xl text-[var(--color-burnt-orange)] mb-6">
                  <ShieldCheck size={56} />
                </div>
                <h2 className="text-3xl font-bold text-[var(--color-ink)] tracking-tight mb-4">Tarayıcı Güvenliği</h2>
                <p className="text-[var(--color-ink-light)] text-lg max-w-xl leading-relaxed mb-8">
                  Girdiğiniz web sitesi, güvenlik kısıtlamaları (X-Frame-Options) nedeniyle başka bir sayfa içerisinde açılmayı reddediyor.
                  <br /><br />
                  Beiwe browser'ı sorunsuz kullanmak ve <strong>Sağ Tık Menüsü</strong> gibi tüm OS avantajlarından yararlanmak için Masaüstü uygulamasını indirin.
                </p>
                <a 
                  href="/tr/app/download" 
                  className="px-8 py-4 bg-[var(--color-burnt-orange)] text-white rounded-2xl font-bold text-lg hover:bg-orange-600 transition-all shadow-xl hover:shadow-orange-500/20 hover:-translate-y-1 flex items-center gap-3"
                >
                  <MonitorDown size={24} />
                  Masaüstü Sürümünü İndir
                </a>
              </div>
            ) : (
              <iframe 
                src={activeIframeUrl} 
                className="w-full flex-1 bg-white border-none"
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
              />
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {integrations.map(integration => (
              <div 
                key={integration.id} 
                onClick={() => handleOpen(integration.url)}
                className="group bg-white rounded-3xl p-6 border border-[var(--color-ink)]/5 shadow-sm hover:shadow-xl hover:border-[var(--color-burnt-orange)]/30 transition-all duration-300 flex flex-col cursor-pointer h-48"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-14 h-14 rounded-2xl ${integration.bgColor} flex items-center justify-center ${integration.color} group-hover:scale-110 transition-transform duration-300`}>
                    <integration.icon size={28} />
                  </div>
                  <div className="p-2 bg-[var(--color-ink)]/5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <Globe size={16} className="text-[var(--color-ink-light)]" />
                  </div>
                </div>
                <div className="mt-auto">
                  <h3 className="text-[var(--color-ink)] font-semibold text-xl">{integration.name}</h3>
                  <p className="text-[var(--color-ink-light)] text-sm mt-1">{integration.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        
      </div>
    </div>
  );
}
