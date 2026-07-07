'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Briefcase, Sparkles, Check, ArrowRight, Users, UserPlus, Settings, Shield } from 'lucide-react';
import { ingestMemory } from '@/lib/saule-core-client';
import { auth } from '@/lib/firebase';

export function WorkspaceModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [goals, setGoals] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [hasWorkspace, setHasWorkspace] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Settings Tabs
  const [activeTab, setActiveTab] = useState<'general' | 'team'>('general');

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setIsSuccess(false);
      setHasWorkspace(false);
      setActiveTab('general');
      checkWorkspace();
    }
  }, [isOpen]);

  const checkWorkspace = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    
    setIsLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_SAULE_API_URL || 'https://us-central1-saule-core.cloudfunctions.net/api';
      const res = await fetch(`${apiUrl}/api/smi/nodes`);
      if (!res.ok) throw new Error('Failed to fetch');
      
      const data = await res.json();
      const allNodes = data.nodes || [];
      
      const userWorkspace = allNodes.find((n: any) => 
        n.spaceId === currentUser.uid && 
        n.type === 'workspace' &&
        n.content.includes('Kullanıcı İşletme Bilgisi')
      );
      
      if (userWorkspace) {
        setHasWorkspace(true);
        // Parse the existing info
        const content = userWorkspace.content;
        const nameMatch = content.match(/İşletme Adı:\s*(.*?)\./);
        const typeMatch = content.match(/İşletme Türü:\s*(.*?)\./);
        const goalsMatch = content.match(/Amaçlar ve Hedefler:\s*(.*?)\./);
        
        if (nameMatch) setBusinessName(nameMatch[1].trim());
        if (typeMatch) setBusinessType(typeMatch[1].trim());
        if (goalsMatch) setGoals(goalsMatch[1].trim());
      } else {
        setBusinessName('');
        setBusinessType('');
        setGoals('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleSave = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser || !businessName) return;
    setIsSaving(true);
    
    const workspaceInfo = `Kullanıcı İşletme Bilgisi: İşletme Adı: ${businessName}. İşletme Türü: ${businessType}. Amaçlar ve Hedefler: ${goals}. Bu bilgiler bu kullanıcının workspace (çalışma alanı) konseptini oluşturur.`;

    try {
      const token = await currentUser.getIdToken();
      // Kayıt olarak 'system' veya 'workspace' türünde kaydediyoruz
      await ingestMemory(
        workspaceInfo, 
        'system', 
        { source: 'workspace_setup', author: currentUser.uid, createdAt: Date.now() }, 
        'workspace', 
        'personal', 
        currentUser.uid, 
        token
      );
      setIsSuccess(true);
      if (!hasWorkspace) {
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setTimeout(() => {
          setIsSuccess(false);
        }, 3000);
      }
    } catch (error) {
      console.error("Workspace save error", error);
    } finally {
      setIsSaving(false);
    }
  };

  const renderSetupForm = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-[var(--color-ink)] mb-1">İşletme / Proje Adı</label>
          <input 
            type="text" 
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="Örn: Acme Corp veya Kendi Adınız" 
            className="w-full bg-[var(--color-paper)] border border-[var(--color-ink)]/10 rounded-xl px-4 py-3 text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-burnt-orange)]"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-[var(--color-ink)] mb-1">İşletme Türü / Mesleğiniz</label>
          <input 
            type="text" 
            value={businessType}
            onChange={(e) => setBusinessType(e.target.value)}
            placeholder="Örn: Mimarlık Ofisi, Freelance Yazılımcı, Diş Kliniği" 
            className="w-full bg-[var(--color-paper)] border border-[var(--color-ink)]/10 rounded-xl px-4 py-3 text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-burnt-orange)]"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-[var(--color-ink)] mb-1 flex items-center gap-2">
            <Sparkles size={16} className="text-[var(--color-burnt-orange)]" />
            Hedefleriniz ve Beklentileriniz
          </label>
          <textarea 
            value={goals}
            onChange={(e) => setGoals(e.target.value)}
            placeholder="Asistanın size nasıl yardımcı olmasını istersiniz? Ana hedefleriniz nelerdir?" 
            className="w-full bg-[var(--color-paper)] border border-[var(--color-ink)]/10 rounded-xl px-4 py-3 text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-burnt-orange)] min-h-[120px] resize-none"
          />
        </div>
        
        <div className="pt-4 flex justify-end">
          <button 
            disabled={isSaving || !businessName}
            onClick={handleSave}
            className="bg-[var(--color-burnt-orange)] text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 hover:bg-orange-600 disabled:opacity-50 transition-colors"
          >
            {isSaving ? 'Kaydediliyor...' : hasWorkspace ? 'Değişiklikleri Kaydet' : 'Tamamla'} <Check size={18} />
          </button>
        </div>
      </div>
    </div>
  );

  const renderTeamSection = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-[var(--color-paper)] p-4 rounded-xl border border-[var(--color-ink)]/10">
        <div>
          <h4 className="font-semibold text-[var(--color-ink)]">Takım Üyeleri</h4>
          <p className="text-xs text-[var(--color-ink-light)]">Çalışma alanınıza yeni üyeler ekleyin</p>
        </div>
        <button className="flex items-center gap-2 bg-[var(--color-ink)] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
          <UserPlus size={16} /> Davet Et
        </button>
      </div>

      <div className="space-y-3">
        {/* Current User */}
        <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-[var(--color-ink)]/5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--color-burnt-orange)]/10 text-[var(--color-burnt-orange)] flex items-center justify-center font-bold text-lg">
              {auth.currentUser?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <div className="font-medium text-[var(--color-ink)] text-sm">{auth.currentUser?.email}</div>
              <div className="text-xs text-[var(--color-ink-light)] flex items-center gap-1 mt-0.5">
                <Shield size={12} className="text-green-500" /> Admin
              </div>
            </div>
          </div>
          <span className="text-xs font-semibold px-2 py-1 bg-green-100 text-green-700 rounded-md">Kurucu</span>
        </div>

        {/* Placeholder Member */}
        <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-[var(--color-ink)]/5 shadow-sm opacity-60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center font-bold text-lg">
              M
            </div>
            <div>
              <div className="font-medium text-[var(--color-ink)] text-sm">mehmet@ornek.com</div>
              <div className="text-xs text-[var(--color-ink-light)] mt-0.5">Davet Bekleniyor</div>
            </div>
          </div>
          <span className="text-xs font-semibold px-2 py-1 bg-gray-100 text-gray-600 rounded-md">Üye</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[var(--color-ink)]/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden relative border border-[var(--color-ink)]/10"
      >
        <div className="absolute top-4 right-4">
          <button onClick={onClose} className="p-2 bg-[var(--color-ink)]/5 hover:bg-[var(--color-ink)]/10 rounded-full transition-colors text-[var(--color-ink-light)] hover:text-[var(--color-ink)]">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 md:p-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 bg-[var(--color-burnt-orange)]/10 text-[var(--color-burnt-orange)] rounded-2xl flex items-center justify-center">
              <Briefcase size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[var(--color-ink)] tracking-tight">
                {hasWorkspace ? (businessName || 'Çalışma Alanı Ayarları') : 'Çalışma Alanınızı Kurun'}
              </h2>
              <p className="text-[var(--color-ink-light)] text-sm">
                {hasWorkspace ? 'Alanınızı ve ekibinizi yönetin' : 'Yapay zeka asistanınızın sizi daha iyi anlayabilmesi için işinizi tanımlayın.'}
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center p-10"><div className="w-8 h-8 rounded-full border-4 border-[var(--color-burnt-orange)] border-t-transparent animate-spin"></div></div>
          ) : hasWorkspace ? (
            // Tabs View for Existing Workspace
            <div className="space-y-6">
              <div className="flex gap-4 border-b border-[var(--color-ink)]/10">
                <button 
                  onClick={() => setActiveTab('general')}
                  className={`pb-3 font-medium text-sm transition-colors relative ${activeTab === 'general' ? 'text-[var(--color-burnt-orange)]' : 'text-[var(--color-ink-light)] hover:text-[var(--color-ink)]'}`}
                >
                  <span className="flex items-center gap-2"><Settings size={16}/> Genel Bilgiler</span>
                  {activeTab === 'general' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-burnt-orange)]" />}
                </button>
                <button 
                  onClick={() => setActiveTab('team')}
                  className={`pb-3 font-medium text-sm transition-colors relative ${activeTab === 'team' ? 'text-[var(--color-burnt-orange)]' : 'text-[var(--color-ink-light)] hover:text-[var(--color-ink)]'}`}
                >
                  <span className="flex items-center gap-2"><Users size={16}/> Ekip Yönetimi</span>
                  {activeTab === 'team' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-burnt-orange)]" />}
                </button>
              </div>

              {isSuccess && (
                <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm flex items-center gap-2">
                  <Check size={16} /> Değişiklikler başarıyla kaydedildi!
                </div>
              )}

              <AnimatePresence mode="wait">
                <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  {activeTab === 'general' ? renderSetupForm() : renderTeamSection()}
                </motion.div>
              </AnimatePresence>
            </div>
          ) : (
            // Initial Setup View
            <AnimatePresence mode="wait">
              {isSuccess ? (
                <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                    <Check size={32} />
                  </div>
                  <h3 className="text-2xl font-bold text-[var(--color-ink)]">Harika!</h3>
                  <p className="text-[var(--color-ink-light)]">Çalışma alanınız ayarlandı. Asistanınız artık işinizi biliyor.</p>
                </motion.div>
              ) : (
                <motion.div key="form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  {renderSetupForm()}
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </motion.div>
    </div>
  );
}
