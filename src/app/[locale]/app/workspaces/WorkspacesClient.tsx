'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter, usePathname } from 'next/navigation';
import { Brain, Plus, Sparkles, Trash2, ArrowRight, Edit3 } from 'lucide-react';
import { ingestMemory } from '@/lib/saule-core-client';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';

export default function WorkspacesClient({ dict }: { dict: any }) {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingWorkspaceId, setEditingWorkspaceId] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [goals, setGoals] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'tr';

  const navigateToRoom = (id: string) => {
    router.push(`/${locale}/app/workspaces/${id}`);
  };

  const handleOpenAddModal = () => {
    setBusinessName('');
    setBusinessType('');
    setGoals('');
    setEditingWorkspaceId(null);
    setShowAddModal(true);
  };

  const handleEdit = (e: React.MouseEvent, w: any) => {
    e.stopPropagation();
    setBusinessName(w.name);
    setBusinessType(w.type);
    setGoals(w.goals);
    setEditingWorkspaceId(w.id);
    setShowAddModal(true);
  };

  const fetchWorkspaces = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_SAULE_API_URL || 'https://us-central1-saule-core.cloudfunctions.net/api';
      const res = await fetch(`${apiUrl}/api/smi/nodes`);
      if (!res.ok) throw new Error('Failed to fetch nodes');
      
      const data = await res.json();
      const allNodes = data.nodes || [];
      
      const userWorkspaces = allNodes.filter((n: any) => 
        n.spaceId === user.uid && 
        n.type === 'workspace' &&
        n.content.includes('Kullanıcı İşletme Bilgisi')
      ).sort((a: any, b: any) => b.createdAt - a.createdAt);
      
      // Parse details
      const parsedWorkspaces = userWorkspaces.map((w: any) => {
        const content = w.content;
        const nameMatch = content.match(/Oda İsmi:\s*(.*?)\./) || content.match(/İşletme Adı:\s*(.*?)\./);
        const typeMatch = content.match(/Odadaki Rolünüz:\s*(.*?)\./) || content.match(/İşletme Türü:\s*(.*?)\./);
        const goalsMatch = content.match(/Amaçlar ve Hedefler:\s*(.*?)\./);
        
        return {
          id: w.id,
          name: nameMatch ? nameMatch[1].trim() : 'İsimsiz Zihin Odası',
          type: typeMatch ? typeMatch[1].trim() : '',
          goals: goalsMatch ? goalsMatch[1].trim() : '',
          createdAt: w.createdAt
        };
      });
      
      setWorkspaces(parsedWorkspaces);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTasks = async () => {
    if (!user) return;
    try {
      const q = query(
        collection(db, 'beiwe_tasks'),
        where('ownerId', '==', user.uid),
        where('isCompleted', '==', false)
      );
      const snapshot = await getDocs(q);
      const tasksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTasks(tasksData);
    } catch (err) {
      console.error("Error fetching tasks:", err);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
    fetchTasks();
  }, [user]);

  const deleteNode = async (workspaceId: string) => {
    const q = query(collection(db, 'smi_nodes'), where('id', '==', workspaceId));
    const snap = await getDocs(q);
    if (!snap.empty) {
      await deleteDoc(doc(db, 'smi_nodes', snap.docs[0].id));
    } else {
      const q2 = query(collection(db, 'nodes'), where('id', '==', workspaceId));
      const snap2 = await getDocs(q2);
      if (!snap2.empty) {
        await deleteDoc(doc(db, 'nodes', snap2.docs[0].id));
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !businessName) return;
    
    setIsSaving(true);
    const workspaceInfo = `Kullanıcı İşletme Bilgisi: Oda İsmi: ${businessName}. Odadaki Rolünüz: ${businessType}. Amaçlar ve Hedefler: ${goals}. Bu bilgiler bu kullanıcının zihin odası konseptini oluşturur.`;

    try {
      const token = await user.getIdToken();
      if (editingWorkspaceId) {
        await deleteNode(editingWorkspaceId);
      }
      await ingestMemory(
        workspaceInfo, 
        'system', 
        { source: 'workspace_page', author: user.uid, createdAt: Date.now() }, 
        'workspace', 
        'personal', 
        user.uid, 
        token
      );
      
      setShowAddModal(false);
      setBusinessName('');
      setBusinessType('');
      setGoals('');
      setEditingWorkspaceId(null);
      await fetchWorkspaces();
    } catch (error) {
      console.error("Workspace save error", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, workspaceId: string) => {
    e.stopPropagation();
    if (!window.confirm("Bu zihin odasını silmek istediğinize emin misiniz?")) return;
    if (!user) return;
    
    try {
      await deleteNode(workspaceId);
      setWorkspaces(workspaces.filter(w => w.id !== workspaceId));
    } catch (err) {
      console.error("Delete failed", err);
      await fetchWorkspaces();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--color-paper)] p-8 overflow-y-auto w-full relative">
      <div className="max-w-5xl mx-auto w-full space-y-8">
        
        <header className="flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-600">
              <Brain size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[var(--color-ink)] tracking-tight">{dict?.app?.workspace?.title || 'Zihin Odaları'}</h1>
              <p className="text-[var(--color-ink-light)] text-sm mt-1">Hayat farklı rollerle dolu, zihinde farklı odalarla. Hepsi önemli, hepsinin Beiwe'de yeri var.</p>
            </div>
          </div>
          <button 
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 bg-[var(--color-burnt-orange)] text-white px-5 py-2.5 rounded-xl font-medium hover:bg-orange-600 transition-colors shadow-sm"
          >
            <Plus size={18} />
            <span>{dict?.app?.workspace?.btn_new_room || 'Yeni Zihin Odası'}</span>
          </button>
        </header>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-[var(--color-burnt-orange)]/30 border-t-[var(--color-burnt-orange)] rounded-full animate-spin"></div>
          </div>
        ) : workspaces.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
              <Brain size={32} className="text-indigo-300" />
            </div>
            <h3 className="text-xl font-bold text-[var(--color-ink)] mb-2">Henüz Zihin Odası Yok</h3>
            <p className="text-[var(--color-ink-light)] max-w-md mb-8">
              Clarity Engine'in size daha iyi yardımcı olabilmesi için ilk zihin odanızı (veya projenizi) oluşturun.
            </p>
            <button 
              onClick={handleOpenAddModal}
              className="bg-[var(--color-burnt-orange)] text-white px-6 py-3 rounded-xl font-bold hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20 flex items-center gap-2"
            >
              <Plus size={20} /> {dict?.app?.workspace?.btn_new_room || 'Zihin Odası Oluştur'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {workspaces.map(w => (
              <div 
                key={w.id} 
                onClick={() => navigateToRoom(w.id)}
                className="bg-white border border-[var(--color-ink)]/10 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col h-full group relative overflow-hidden cursor-pointer"
              >
                <div className="absolute top-0 left-0 w-1.5 h-full bg-[var(--color-burnt-orange)] group-hover:w-2 transition-all"></div>
                
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-[var(--color-ink)] group-hover:text-[var(--color-burnt-orange)] transition-colors">{w.name}</h3>
                    {w.type && <p className="text-sm font-medium text-[var(--color-ink-light)] mt-1">{w.type}</p>}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => handleEdit(e, w)}
                      className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Düzenle"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button 
                      onClick={(e) => handleDelete(e, w.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Sil"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                
                {w.goals && (
                  <div className="flex-1 mt-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-[var(--color-ink-light)] uppercase tracking-wider mb-2">
                      <Sparkles size={12} className="text-[var(--color-burnt-orange)]" /> Hedefler & Kapsam
                    </div>
                    <p className="text-sm text-[var(--color-ink)] leading-relaxed bg-orange-50/50 p-4 rounded-2xl border border-orange-100/50">
                      {w.goals}
                    </p>
                  </div>
                )}
                
                {tasks.filter(t => t.roomId === w.id).length > 0 && (
                  <div className="mt-4 pt-4 border-t border-[var(--color-ink)]/5">
                    <div className="text-xs font-bold text-[var(--color-ink-light)] uppercase tracking-wider mb-2">
                      Açık Görevler
                    </div>
                    <ul className="space-y-2">
                      {tasks.filter(t => t.roomId === w.id).map(t => (
                        <li key={t.id} className="flex items-start gap-2 text-sm text-[var(--color-ink)]">
                          <div className="w-4 h-4 rounded border border-[var(--color-ink)]/30 mt-0.5 flex-shrink-0 bg-white" />
                          <span>{t.title}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 fade-in duration-200">
            <h2 className="text-2xl font-bold text-[var(--color-ink)] mb-6">
              {editingWorkspaceId ? "Zihin Odasını Düzenle" : (dict?.app?.workspace?.btn_new_room || "Yeni Zihin Odası")}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-[var(--color-ink)] mb-1">Oda İsmi <span className="text-[var(--color-burnt-orange)]">*</span></label>
                <input 
                  type="text" 
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Örn: Acme Corp veya Tasarım Projesi" 
                  className="w-full border-2 border-[var(--color-ink)]/10 rounded-xl px-4 py-3 text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-burnt-orange)]"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[var(--color-ink)] mb-1">Odadaki Rolünüz</label>
                <input 
                  type="text" 
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  placeholder="Örn: Mimarlık Ofisi, Freelance Yazılımcı" 
                  className="w-full border-2 border-[var(--color-ink)]/10 rounded-xl px-4 py-3 text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-burnt-orange)]"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[var(--color-ink)] mb-1 flex items-center gap-2">
                  <Sparkles size={16} className="text-[var(--color-burnt-orange)]" />
                  Hedefleriniz ve Beklentileriniz
                </label>
                <textarea 
                  value={goals}
                  onChange={(e) => setGoals(e.target.value)}
                  placeholder="Asistanın bu projede size nasıl yardımcı olmasını istersiniz?" 
                  className="w-full border-2 border-[var(--color-ink)]/10 rounded-xl px-4 py-3 text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-burnt-orange)] min-h-[100px] resize-none"
                />
              </div>
              
              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 rounded-xl font-bold text-[var(--color-ink-light)] hover:bg-gray-100 transition-colors"
                >
                  İptal
                </button>
                <button 
                  type="submit"
                  disabled={isSaving || !businessName}
                  className="flex items-center gap-2 bg-[var(--color-ink)] text-white px-6 py-2.5 rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isSaving ? 'Kaydediliyor...' : (editingWorkspaceId ? 'Güncelle' : 'Oluştur')}
                  <ArrowRight size={18} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
