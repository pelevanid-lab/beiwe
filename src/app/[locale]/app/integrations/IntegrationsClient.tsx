'use client';

import React from 'react';
import { Link2, MessageCircle, Mail, Calendar as CalendarIcon, Check, Plus, AlertCircle, RefreshCw, Camera, FileText, ChevronRight, Inbox } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

const availableIntegrations = [
  {
    id: 'inbox',
    name: 'İletişim Merkezi',
    description: 'Tüm iletişim kanallarınızı ve müşteri mesajlarınızı tek bir merkezden yönetin.',
    icon: Inbox,
    color: 'text-[var(--color-burnt-orange)]',
    bgColor: 'bg-[var(--color-burnt-orange)]/10',
    status: 'coming_soon',
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp Business',
    description: 'Müşterilerinize WhatsApp üzerinden otomatik mesajlar gönderin.',
    icon: MessageCircle,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    status: 'coming_soon',
  },
  {
    id: 'instagram',
    name: 'Instagram (Meta)',
    description: 'Instagram DM\'lerinizi yanıtlayın ve akışı yönetin.',
    icon: Camera,
    color: 'text-pink-500',
    bgColor: 'bg-pink-500/10',
    status: 'coming_soon',
  },
  {
    id: 'google',
    name: 'Google Entegrasyonları',
    description: 'Takvim, Gmail, Dokümanlar ve Kişiler servislerini tek bir yerden yönetin. Her izni ayrı ayrı açabilirsiniz.',
    icon: CalendarIcon,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    status: 'coming_soon',
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Takım içi iletişimlerinizi ve bildirimlerinizi entegre edin.',
    icon: AlertCircle,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    status: 'coming_soon',
  },
  {
    id: 'notion',
    name: 'Notion',
    description: 'Notlarınızı ve dokümanlarınızı Notion çalışma alanınızla eşitleyin.',
    icon: RefreshCw,
    color: 'text-gray-800',
    bgColor: 'bg-gray-800/10',
    status: 'coming_soon',
  }
];

export default function IntegrationsClient({ dict }: { dict: any }) {
  const router = useRouter();
  const { user } = useAuth();
  
  const tComingSoon = dict?.common?.coming_soon || 'Yakında';

  const getIntegrations = () => {
    return availableIntegrations;
  };

  const integrations = getIntegrations();

  const handleSetup = (id: string, status: string) => {
    if (status === 'coming_soon') return;
    router.push(`/tr/app/integrations/${id}`);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--color-paper)] p-8 overflow-y-auto w-full relative">
      <div className="max-w-5xl mx-auto w-full space-y-8">
        
        <header className="flex flex-col gap-2 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[var(--color-burnt-orange)]/10 rounded-xl text-[var(--color-burnt-orange)]">
              <Link2 size={24} />
            </div>
            <h1 className="text-3xl font-bold text-[var(--color-ink)] tracking-tight">API Entegrasyonları</h1>
          </div>
          <p className="text-[var(--color-ink-light)] text-lg">
            Diğer platformlardaki verilerinizi bağlayarak Beiwe asistanınızın yeteneklerini artırın.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
          {integrations.map(integration => {
            const isConnected = integration.status === 'connected';
            const isSoon = integration.status === 'coming_soon';

            return (
              <div 
                key={integration.id} 
                className={`bg-white rounded-3xl p-6 border shadow-sm flex flex-col h-64 transition-all duration-300 relative overflow-hidden ${
                  isConnected 
                    ? 'border-green-500/30 shadow-green-500/5' 
                    : isSoon 
                      ? 'border-[var(--color-ink)]/5 opacity-70 grayscale' 
                      : 'border-[var(--color-ink)]/5 hover:shadow-xl hover:border-[var(--color-burnt-orange)]/30'
                }`}
              >
                {/* Status Badge */}
                <div className="absolute top-6 right-6">
                  {isConnected ? (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-green-700 bg-green-100 px-3 py-1.5 rounded-lg">
                      <Check size={14} /> Bağlandı
                    </span>
                  ) : isSoon ? (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg">
                      {tComingSoon}
                    </span>
                  ) : null}
                </div>

                <div className="flex items-start mb-4">
                  <div className={`w-14 h-14 rounded-2xl ${integration.bgColor} flex items-center justify-center ${integration.color}`}>
                    <integration.icon size={28} />
                  </div>
                </div>
                
                <div className="mb-6">
                  <h3 className="text-[var(--color-ink)] font-bold text-xl">{integration.name}</h3>
                  <p className="text-[var(--color-ink-light)] text-sm mt-1.5 leading-relaxed line-clamp-2">
                    {integration.description}
                  </p>
                </div>

                <div className="mt-auto">
                  <button 
                    disabled={isSoon}
                    onClick={() => handleSetup(integration.id, integration.status)}
                    className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                      isConnected 
                        ? 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-100'
                        : isSoon
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-[var(--color-ink)] text-white hover:bg-gray-800 shadow-md'
                    }`}
                  >
                    {isConnected ? (
                      <><Check size={18} /> {dict.integrations?.manage || 'Yönet'}</>
                    ) : isSoon ? (
                      <>{tComingSoon}</>
                    ) : (
                      <><Plus size={18} /> {dict.integrations?.connect || 'Bağlan'}</>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
