'use client';

import React, { useState, useEffect } from 'react';
import { Search, FileText, Plus, MoreVertical, LayoutGrid, List as ListIcon, Loader2, ArrowUpRight, X } from 'lucide-react';
import { fetchWithGoogleAuth } from '@/lib/google-api';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { useAuth } from '@/components/AuthProvider';
import NativeDocEditor from './NativeDocEditor';

interface GoogleDoc {
  id: string;
  name: string;
  modifiedTime: string;
  webViewLink: string;
  iconLink: string;
  owner: string;
  isNative?: boolean;
  content?: string;
}

const mockDocs: GoogleDoc[] = [
  {
    id: '1a2b3c4d5e',
    name: '2026 Q3 Hedefleri ve Planlama',
    modifiedTime: 'Bugün 10:24',
    webViewLink: '#',
    iconLink: 'https://upload.wikimedia.org/wikipedia/commons/0/01/Google_Docs_logo_%282014-2020%29.svg',
    owner: 'Ben'
  },
  {
    id: 'f6g7h8i9j0',
    name: 'Müşteri Görüşme Notları - Ağustos',
    modifiedTime: 'Dün 15:30',
    webViewLink: '#',
    iconLink: 'https://upload.wikimedia.org/wikipedia/commons/0/01/Google_Docs_logo_%282014-2020%29.svg',
    owner: 'Ben'
  },
  {
    id: 'k1l2m3n4o5',
    name: 'Yeni Proje: Mimari Tasarım',
    modifiedTime: '3 Gün Önce',
    webViewLink: '#',
    iconLink: 'https://upload.wikimedia.org/wikipedia/commons/0/01/Google_Docs_logo_%282014-2020%29.svg',
    owner: 'Ahmet Y.'
  },
  {
    id: 'p6q7r8s9t0',
    name: 'İş Sözleşmesi Taslağı v2',
    modifiedTime: '1 Hafta Önce',
    webViewLink: '#',
    iconLink: 'https://upload.wikimedia.org/wikipedia/commons/0/01/Google_Docs_logo_%282014-2020%29.svg',
    owner: 'Ben'
  }
];

export default function DocsClient({ dict }: { dict: any }) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [docs, setDocs] = useState<GoogleDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewDoc, setPreviewDoc] = useState<GoogleDoc | null>(null);
  const [editingNativeDoc, setEditingNativeDoc] = useState<GoogleDoc | null>(null);
  const [showNewDocEditor, setShowNewDocEditor] = useState(false);
  const { user } = useAuth();

  // Simulate API fetch from our real Google Sync endpoint
  useEffect(() => {
    const fetchDocs = async () => {
      setLoading(true);
      const token = localStorage.getItem('google_access_token');
      
      let allDocs: GoogleDoc[] = [];

      // 1. Fetch Google Docs
      if (token) {
        try {
          const res = await fetchWithGoogleAuth('/api/docs/list');
          const data = await res.json();
          if (data.success && data.files) {
            allDocs = data.files.map((file: any) => ({
              id: file.id,
              name: file.name,
              modifiedTime: new Date(file.modifiedTime).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' }),
              webViewLink: file.webViewLink,
              iconLink: file.iconLink,
              owner: file.owners && file.owners.length > 0 ? file.owners[0].displayName : 'Bilinmeyen',
              isNative: false
            }));
          }
        } catch (error) {
          console.error("Fetch Google Docs Error:", error);
        }
      }

      // 2. Fetch Native Beiwe Docs
      if (user) {
        try {
          const q = query(
            collection(db, 'beiwe_docs'),
            where('ownerId', '==', user.uid),
            where('type', '==', 'document')
          );
          const snapshot = await getDocs(q);
          const nativeDocs: GoogleDoc[] = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              name: data.title || 'İsimsiz Doküman',
              modifiedTime: data.updatedAt ? new Date(data.updatedAt.toDate()).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Bilinmeyen Tarih',
              webViewLink: '#',
              iconLink: 'https://cdn-icons-png.flaticon.com/512/3269/3269817.png', // a generic doc icon
              owner: 'Ben',
              isNative: true,
              content: data.content
            };
          });
          
          // Sort in memory to avoid needing a Firestore composite index
          nativeDocs.sort((a, b) => {
            const timeA = snapshot.docs.find(d => d.id === a.id)?.data().updatedAt?.toMillis() || 0;
            const timeB = snapshot.docs.find(d => d.id === b.id)?.data().updatedAt?.toMillis() || 0;
            return timeB - timeA;
          });

          allDocs = [...nativeDocs, ...allDocs];
        } catch (error) {
          console.error("Fetch Native Docs Error:", error);
        }
      }

      setDocs(allDocs);
      setLoading(false);
    };

    if (user) {
      fetchDocs();
    }
  }, [user, showNewDocEditor, editingNativeDoc]); // re-fetch when closing editors

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--color-paper)] p-8 overflow-y-auto w-full relative">
      <div className="max-w-6xl mx-auto w-full space-y-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-600">
              <FileText size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[var(--color-ink)] tracking-tight">Dokümanlar</h1>
              <p className="text-[var(--color-ink-light)] text-sm mt-1">Yerel Beiwe dokümanlarınız ve dış entegrasyonlar.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button className="bg-white border border-[var(--color-ink)]/10 text-[var(--color-ink)] px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 hover:bg-gray-50 transition-colors shadow-sm">
              <Search size={18} /> Ara
            </button>
            <button onClick={() => setShowNewDocEditor(true)} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/20">
              <Plus size={18} /> Yeni Doküman
            </button>
          </div>
        </header>

        {/* View Controls */}
        <div className="flex items-center justify-between border-b border-[var(--color-ink)]/10 pb-4">
          <h2 className="text-lg font-bold text-[var(--color-ink)]">Son Açılanlar</h2>
          <div className="flex items-center gap-2 bg-white border border-[var(--color-ink)]/10 p-1 rounded-lg">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-[var(--color-ink)]/5 text-[var(--color-ink)]' : 'text-[var(--color-ink-light)] hover:text-[var(--color-ink)]'}`}
            >
              <LayoutGrid size={18} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-[var(--color-ink)]/5 text-[var(--color-ink)]' : 'text-[var(--color-ink-light)] hover:text-[var(--color-ink)]'}`}
            >
              <ListIcon size={18} />
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 size={40} className="text-blue-500 animate-spin mb-4" />
            <p className="text-[var(--color-ink-light)] font-medium">Google Dokümanlarınız eşitleniyor...</p>
          </div>
        ) : (
          /* Content Grid/List */
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6' : 'flex flex-col gap-3'}>
            {docs.map(doc => (
              viewMode === 'grid' ? (
                // Grid Item
                <div key={doc.id} onClick={() => doc.isNative ? setEditingNativeDoc(doc) : setPreviewDoc(doc)} className="group bg-white border border-[var(--color-ink)]/10 rounded-2xl overflow-hidden hover:shadow-xl transition-all hover:border-blue-500/30 flex flex-col cursor-pointer">
                  <div className="h-32 bg-gray-50 border-b border-[var(--color-ink)]/5 flex items-center justify-center p-4 relative group-hover:bg-blue-50/50 transition-colors">
                    <FileText size={48} className="text-gray-300 group-hover:text-blue-200 transition-colors" />
                    <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-blue-600 text-white p-3 rounded-full shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform">
                        <ArrowUpRight size={20} />
                      </div>
                    </div>
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="flex items-start gap-3 mb-2">
                      {doc.isNative ? (
                        <FileText className="w-5 h-5 shrink-0 text-orange-500" />
                      ) : (
                        <img src={doc.iconLink} alt="Docs" className="w-5 h-5 shrink-0" />
                      )}
                      <h3 className="font-semibold text-[var(--color-ink)] text-sm line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
                        {doc.name}
                      </h3>
                    </div>
                    <div className="mt-auto flex items-center justify-between text-xs text-[var(--color-ink-light)]">
                      <span>{doc.modifiedTime}</span>
                      <button className="p-1 hover:bg-[var(--color-ink)]/5 rounded-md transition-colors" onClick={(e) => e.stopPropagation()}>
                        <MoreVertical size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                // List Item
                <div key={doc.id} onClick={() => doc.isNative ? setEditingNativeDoc(doc) : setPreviewDoc(doc)} className="group bg-white border border-[var(--color-ink)]/10 rounded-xl p-3 flex items-center gap-4 hover:shadow-md transition-all hover:border-blue-500/30 cursor-pointer">
                  {doc.isNative ? (
                    <FileText className="w-6 h-6 shrink-0 ml-2 text-orange-500" />
                  ) : (
                    <img src={doc.iconLink} alt="Docs" className="w-6 h-6 shrink-0 ml-2" />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[var(--color-ink)] text-sm truncate group-hover:text-blue-600 transition-colors">
                      {doc.name}
                    </h3>
                  </div>
                  <div className="hidden md:flex w-32 text-xs text-[var(--color-ink-light)]">
                    Sahibi: {doc.owner}
                  </div>
                  <div className="w-32 text-xs text-[var(--color-ink-light)] text-right">
                    {doc.modifiedTime}
                  </div>
                  <button className="p-2 text-[var(--color-ink-light)] hover:bg-[var(--color-ink)]/5 rounded-lg transition-colors" onClick={(e) => e.stopPropagation()}>
                    <MoreVertical size={16} />
                  </button>
                </div>
              )
            ))}
            
            {!loading && docs.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-10 text-[var(--color-ink-light)]">
                <FileText size={48} className="opacity-20 mb-4" />
                <p>Hiçbir doküman bulunamadı veya bağlantı izni yok.</p>
                <p className="text-sm mt-1">Lütfen Ayarlar &gt; Entegrasyonlar sekmesinden Google Dokümanlar iznini verdiğinizden emin olun.</p>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Fullscreen Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex flex-col pt-4 px-4 pb-0 md:p-8">
          <div className="flex-1 bg-white rounded-t-2xl md:rounded-2xl flex flex-col overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="h-16 border-b flex items-center justify-between px-6 shrink-0 bg-white">
              <div className="flex items-center gap-3 min-w-0">
                <img src={previewDoc.iconLink} alt="icon" className="w-6 h-6 shrink-0" />
                <h3 className="font-semibold text-[var(--color-ink)] text-base truncate">{previewDoc.name}</h3>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-4">
                <a 
                  href={previewDoc.webViewLink} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="px-4 py-2 hover:bg-gray-100 rounded-xl text-gray-700 text-sm font-medium flex items-center gap-2 transition-colors"
                >
                  Yeni Sekmede Aç <ArrowUpRight size={16} />
                </a>
                <button 
                  onClick={() => setPreviewDoc(null)} 
                  className="p-2 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors ml-2 text-gray-400"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
            {/* Iframe Body */}
            <div className="flex-1 bg-gray-50 relative">
              <iframe 
                 src={previewDoc.webViewLink.replace('/edit', '/preview')} 
                 className="absolute inset-0 w-full h-full border-none"
                 sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                 title={previewDoc.name}
              />
            </div>
          </div>
        </div>
      )}

      {/* Native Document Editor */}
      {showNewDocEditor && (
        <NativeDocEditor 
          onClose={() => setShowNewDocEditor(false)} 
          onSaved={() => setShowNewDocEditor(false)} 
        />
      )}

      {editingNativeDoc && (
        <NativeDocEditor 
          initialDocId={editingNativeDoc.id}
          initialTitle={editingNativeDoc.name}
          initialContent={editingNativeDoc.content}
          onClose={() => setEditingNativeDoc(null)} 
          onSaved={() => setEditingNativeDoc(null)} 
        />
      )}
    </div>
  );
}
