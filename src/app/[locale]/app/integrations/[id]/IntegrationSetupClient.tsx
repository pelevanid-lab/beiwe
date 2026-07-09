'use client';

import React, { useState } from 'react';
import { ArrowLeft, MessageCircle, Mail, Calendar as CalendarIcon, Check, Copy, AlertCircle, Camera, Shield, Zap, FileText, Users, Inbox } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { auth } from '@/lib/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { fetchWithGoogleAuth } from '@/lib/google-api';

// Google OAuth scope definitions — each service has its own scope
const GOOGLE_SERVICES = [
  {
    key: 'calendar',
    label: 'Google Takvim',
    description: 'Randevularınızı okuma ve yeni etkinlik oluşturma izni.',
    icon: CalendarIcon,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    scope: 'https://www.googleapis.com/auth/calendar',
    storageKey: 'google_perm_calendar',
  },
  {
    key: 'gmail',
    label: 'Gmail',
    description: 'E-postalarınızı okuma ve gönderme izni. Müşteri iletişimini Beiwe üzerinden yönetin.',
    icon: Inbox,
    color: 'text-red-600',
    bg: 'bg-red-50',
    scope: 'https://www.googleapis.com/auth/gmail.modify',
    storageKey: 'google_perm_gmail',
  },
  {
    key: 'docs',
    label: 'Google Dokümanlar & Drive',
    description: 'Drive dosyalarınızı ve Dokümanlarınızı okuma izni.',
    icon: FileText,
    color: 'text-yellow-600',
    bg: 'bg-yellow-50',
    scope: 'https://www.googleapis.com/auth/drive.readonly',
    storageKey: 'google_perm_docs',
  },
  {
    key: 'contacts',
    label: 'Google Kişiler',
    description: 'Kişi listenizi okuma ve müşterilerle eşleştirme izni.',
    icon: Users,
    color: 'text-green-600',
    bg: 'bg-green-50',
    scope: 'https://www.googleapis.com/auth/contacts.readonly',
    storageKey: 'google_perm_contacts',
  },
] as const;



export default function IntegrationSetupClient({ dict, integrationId }: { dict: any, integrationId: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [googlePermissions, setGooglePermissions] = useState<Record<string, boolean>>({});
  const [waPhoneId, setWaPhoneId] = useState('');
  const [waToken, setWaToken] = useState('');

  // Check URL for tokens on load
  React.useEffect(() => {
    // Önce mevcut izinleri localStorage'dan oku
    const perms: Record<string, boolean> = {};
    GOOGLE_SERVICES.forEach(s => {
      perms[s.key] = localStorage.getItem(s.storageKey) === 'true';
    });
    setGooglePermissions(perms);

    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const service = params.get('service');
    
    if (accessToken) {
      localStorage.setItem('google_access_token', accessToken);
      if (refreshToken) {
        localStorage.setItem('google_refresh_token', refreshToken);
      }
      
      if (service) {
        const srv = GOOGLE_SERVICES.find(s => s.key === service);
        if (srv) {
          localStorage.setItem(srv.storageKey, 'true');
          setGooglePermissions(prev => ({ ...prev, [service]: true }));
        }
      }

      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 3000);
      
      // Clean URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, []);

  const handleSpecificGooglePermission = async (service: typeof GOOGLE_SERVICES[number]) => {
    setIsSaving(true);
    try {
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      if (!clientId) {
        alert("Google Client ID is missing. Please check your .env configuration.");
        setIsSaving(false);
        return;
      }

      const redirectUri = `${window.location.origin}/api/auth/google/callback`;
      // state parametresi ile hangi servisin yetkilendirildiğini callback'e taşıyoruz
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(service.scope)}&access_type=offline&prompt=consent&state=${service.key}&include_granted_scopes=true`;
      
      window.location.href = authUrl;
    } catch (error) {
      console.error("Google permission error:", error);
      alert("İzin verirken bir hata oluştu veya pencere kapatıldı.");
      setIsSaving(false);
    }
  };

  const handleDisconnectGoogle = () => {
    localStorage.removeItem('google_access_token');
    localStorage.removeItem('google_refresh_token');
    GOOGLE_SERVICES.forEach(s => localStorage.removeItem(s.storageKey));
    setGooglePermissions({});
  };

  const handleActivateWatch = async () => {
    const token = localStorage.getItem('google_access_token');
    if (!token) {
      alert("Access token bulunamadı. Lütfen önce Google hesabınızı bağlayın.");
      return;
    }
    
    setIsSaving(true);
    try {
      const res = await fetchWithGoogleAuth('/api/gmail/watch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      
      if (res.ok) {
        alert("Başarılı! Gerçek zamanlı bildirimler aktif edildi. (History ID: " + data.historyId + ")");
      } else {
        alert("Hata: " + (data.error || "Bilinmeyen bir hata oluştu"));
      }
    } catch (e: any) {
      alert("Bağlantı hatası: " + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      // Simulate save
      await new Promise(r => setTimeout(r, 1000));
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        router.push('/tr/app/integrations');
      }, 1500);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const renderContent = () => {
    switch (integrationId) {
      case 'whatsapp':
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 text-blue-800 p-4 rounded-xl flex gap-3 text-sm">
              <Shield className="shrink-0 mt-0.5" size={18} />
              <div>
                <strong>Meta Developer Portal</strong> üzerinden uygulamanızı oluşturup <strong>WhatsApp Cloud API</strong> ürününü ekledikten sonra aşağıdaki bilgileri doldurun.
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[var(--color-ink)] mb-1">Phone Number ID</label>
                <input 
                  type="text" 
                  value={waPhoneId}
                  onChange={(e) => setWaPhoneId(e.target.value)}
                  placeholder="Örn: 104829103849" 
                  className="w-full bg-[var(--color-paper)] border border-[var(--color-ink)]/10 rounded-xl px-4 py-3 text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-burnt-orange)]"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[var(--color-ink)] mb-1">Permanent Access Token</label>
                <input 
                  type="password" 
                  value={waToken}
                  onChange={(e) => setWaToken(e.target.value)}
                  placeholder="EAAGm0P..." 
                  className="w-full bg-[var(--color-paper)] border border-[var(--color-ink)]/10 rounded-xl px-4 py-3 text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-burnt-orange)]"
                />
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-[var(--color-ink)]/10">
              <h3 className="text-lg font-bold text-[var(--color-ink)] mb-2">Webhook Ayarları</h3>
              <p className="text-sm text-[var(--color-ink-light)] mb-4">Aşağıdaki bilgileri Meta portalindeki Webhook yapılandırmasına yapıştırın.</p>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-ink-light)] uppercase">Callback URL</label>
                  <div className="flex mt-1">
                    <input readOnly value="https://api.beiwe.app/webhook/whatsapp" className="flex-1 bg-gray-100 border border-r-0 border-[var(--color-ink)]/10 rounded-l-xl px-4 py-2.5 text-sm font-mono text-[var(--color-ink)]" />
                    <button className="bg-gray-100 border border-l-0 border-[var(--color-ink)]/10 rounded-r-xl px-4 hover:bg-gray-200 transition-colors text-[var(--color-ink)]"><Copy size={16} /></button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-ink-light)] uppercase">Verify Token</label>
                  <div className="flex mt-1">
                    <input readOnly value="beiwe_secure_token_9x2" className="flex-1 bg-gray-100 border border-r-0 border-[var(--color-ink)]/10 rounded-l-xl px-4 py-2.5 text-sm font-mono text-[var(--color-ink)]" />
                    <button className="bg-gray-100 border border-l-0 border-[var(--color-ink)]/10 rounded-r-xl px-4 hover:bg-gray-200 transition-colors text-[var(--color-ink)]"><Copy size={16} /></button>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="bg-green-600 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 hover:bg-green-700 transition-colors"
              >
                {isSaving ? 'Bağlanıyor...' : 'Kaydet ve Bağlan'}
              </button>
            </div>
          </div>
        );

      case 'instagram':
        return (
          <div className="space-y-6">
            <div className="bg-pink-50 text-pink-800 p-4 rounded-xl flex gap-3 text-sm">
              <AlertCircle className="shrink-0 mt-0.5" size={18} />
              <div>
                Instagram hesabınızın bir <strong>İşletme (Business)</strong> veya <strong>İçerik Üreticisi (Creator)</strong> hesabı olması ve bir Facebook Sayfasına bağlı olması gerekmektedir.
              </div>
            </div>

            <div className="flex flex-col items-center justify-center py-10 bg-[var(--color-paper)] rounded-2xl border border-[var(--color-ink)]/10">
              <Camera size={48} className="text-pink-500 mb-4" />
              <h3 className="text-xl font-bold text-[var(--color-ink)] mb-2">Facebook ile Giriş Yapın</h3>
              <p className="text-center text-[var(--color-ink-light)] max-w-md mb-8">
                Instagram DM'lerinizi Beiwe üzerinden yönetebilmek için hesaplarınıza erişim izni vermeniz gerekiyor.
              </p>
              
              <button className="bg-[#1877F2] text-white px-8 py-3 rounded-xl font-semibold flex items-center gap-2 hover:bg-[#166FE5] transition-colors shadow-lg">
                <Shield size={18} /> Facebook ile Devam Et
              </button>
            </div>
          </div>
        );

      case 'google':
        const googleProvider = user?.providerData?.find(p => p.providerId === 'google.com');
        const isGoogleConnected = !!googleProvider;

        if (isGoogleConnected) {
          return (
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-6 border border-[var(--color-ink)]/10 rounded-2xl bg-white">
                <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-xl shrink-0">
                  {googleProvider.email?.charAt(0).toUpperCase() || 'G'}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-[var(--color-ink)]">{googleProvider.email}</h3>
                  <p className="text-sm text-[var(--color-ink-light)]">Google Ana Hesabı Bağlı</p>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <button 
                    onClick={handleDisconnectGoogle}
                    className="px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-sm font-semibold transition-colors"
                  >
                    Tüm Google Bağlantısını Kes
                  </button>
                  {googlePermissions['gmail'] && (
                    <button 
                      onClick={handleActivateWatch}
                      disabled={isSaving}
                      className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 shadow-sm"
                    >
                      {isSaving ? 'İşleniyor...' : 'Canlı Bildirimleri Başlat'}
                    </button>
                  )}
                </div>
              </div>
              
              <div className="pt-4 border-t border-[var(--color-ink)]/5">
                <h4 className="font-semibold text-[var(--color-ink)] mb-4">Servis İzinleri</h4>
                <div className="space-y-3">
                  {GOOGLE_SERVICES.map(service => {
                    const hasPerm = googlePermissions[service.key];
                    
                    return (
                      <div key={service.key} className="flex items-center justify-between p-4 bg-[var(--color-paper)] rounded-xl border border-[var(--color-ink)]/5">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${service.bg} ${service.color}`}>
                            <service.icon size={20} />
                          </div>
                          <div>
                            <div className="font-medium text-[var(--color-ink)] text-sm">{service.label}</div>
                            <div className="text-xs text-[var(--color-ink-light)] mt-0.5 max-w-md">{service.description}</div>
                          </div>
                        </div>
                        <button 
                          disabled={isSaving || hasPerm}
                          onClick={() => handleSpecificGooglePermission(service)}
                          className={`px-5 py-2 text-xs font-bold rounded-lg transition-colors ml-4 shrink-0 shadow-sm ${
                            hasPerm 
                              ? 'bg-green-100 text-green-700 shadow-none' 
                              : 'bg-[var(--color-ink)] text-white hover:bg-gray-800'
                          }`}
                        >
                          {isSaving ? 'Bekleniyor...' : hasPerm ? 'İzin Verildi' : 'İzin Ver'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        }

        return (
          <div className="space-y-6">
            <div className="flex flex-col items-center justify-center py-10 bg-[var(--color-paper)] rounded-2xl border border-[var(--color-ink)]/10">
              <CalendarIcon size={48} className="text-red-500 mb-4" />
              <h3 className="text-xl font-bold text-[var(--color-ink)] mb-2">Google Hesabınızı Bağlayın</h3>
              <p className="text-center text-[var(--color-ink-light)] max-w-md mb-8">
                Takvim, Gmail, Dokümanlar ve Kişilerinizi Beiwe üzerinden yönetmek için Google ile güvenli giriş yapın.
              </p>
              
              <button 
                onClick={() => handleSpecificGooglePermission(GOOGLE_SERVICES[0])}
                className="bg-white border border-gray-300 text-gray-700 px-8 py-3 rounded-xl font-semibold flex items-center gap-3 hover:bg-gray-50 transition-colors shadow-sm"
              >
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
                Google ile Giriş Yap
              </button>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-10 text-[var(--color-ink-light)]">
            Bu entegrasyon için yapılandırma ayarı bulunamadı veya henüz desteklenmiyor.
          </div>
        );
    }
  };

  const getHeaderInfo = () => {
    switch (integrationId) {
      case 'whatsapp': return { icon: MessageCircle, title: 'WhatsApp Business API', color: 'text-green-500', bg: 'bg-green-500/10' };
      case 'instagram': return { icon: Camera, title: 'Instagram (Meta)', color: 'text-pink-500', bg: 'bg-pink-500/10' };
      case 'google': return { icon: CalendarIcon, title: 'Google Çalışma Alanı', color: 'text-red-500', bg: 'bg-red-500/10' };
      default: return { icon: Zap, title: 'Entegrasyon Ayarları', color: 'text-[var(--color-burnt-orange)]', bg: 'bg-[var(--color-burnt-orange)]/10' };
    }
  };

  const header = getHeaderInfo();

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--color-paper)] p-8 overflow-y-auto w-full relative">
      <div className="max-w-3xl mx-auto w-full space-y-8">
        
        <button onClick={() => router.back()} className="flex items-center gap-2 text-[var(--color-ink-light)] hover:text-[var(--color-ink)] transition-colors text-sm font-medium w-fit">
          <ArrowLeft size={16} /> Geri Dön
        </button>

        <div className="bg-white rounded-3xl p-8 md:p-10 border border-[var(--color-ink)]/5 shadow-xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8 pb-8 border-b border-[var(--color-ink)]/10">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${header.bg} ${header.color}`}>
                <header.icon size={32} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-[var(--color-ink)] tracking-tight">{header.title}</h1>
                <p className="text-[var(--color-ink-light)] text-sm">Bağlantı ve Kimlik Doğrulama Ayarları</p>
              </div>
            </div>
            {isSuccess && (
              <span className="flex items-center gap-1.5 px-4 py-2 bg-green-100 text-green-700 font-bold text-sm rounded-xl animate-in fade-in zoom-in-95">
                <Check size={16} /> Kaydedildi
              </span>
            )}
          </div>

          {renderContent()}
        </div>

      </div>
    </div>
  );
}
