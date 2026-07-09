'use client';

import React, { useState, useEffect } from 'react';
import { Search, FileText, Plus, MoreVertical, LayoutGrid, List as ListIcon, Loader2, ArrowUpRight, X, CloudDownload } from 'lucide-react';
import { fetchWithGoogleAuth } from '@/lib/google-api';
import { db } from '@/lib/firebase';
import { doc, setDoc, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
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
  const [showImportModal, setShowImportModal] = useState(false);
  const [googleDocsList, setGoogleDocsList] = useState<GoogleDoc[]>([]);
  const [selectedGoogleDocs, setSelectedGoogleDocs] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const { user } = useAuth();

  // Load Google Docs for the Modal
  const handleOpenImportModal = async () => {
    setShowImportModal(true);
    setImportError(null);
    setSelectedGoogleDocs([]);
    
    // Only fetch if empty to save API calls
    if (googleDocsList.length === 0) {
      try {
        const res = await fetchWithGoogleAuth('/api/docs/list');
        const data = await res.json();
        if (data.success && data.files) {
          const formatted = data.files.map((file: any) => ({
            id: file.id,
            name: file.name,
            modifiedTime: new Date(file.modifiedTime).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' }),
            iconLink: file.iconLink,
          }));
          setGoogleDocsList(formatted);
        } else {
          setImportError('Google Dokümanlar alınamadı.');
        }
      } catch (error: any) {
        setImportError(error.message || 'Bağlantı hatası.');
      }
    }
  };

  const handleImportSelected = async () => {
    if (selectedGoogleDocs.length === 0 || !user) return;
    
    setIsImporting(true);
    setImportError(null);
    
    try {
      let importedCount = 0;
      for (const docId of selectedGoogleDocs) {
        const docInfo = googleDocsList.find(d => d.id === docId);
        if (!docInfo) continue;

        // 1. Fetch HTML content
        const exportRes = await fetchWithGoogleAuth(`/api/docs/export?fileId=${docId}`);
        const exportData = await exportRes.json();
        
        if (!exportData.success) {
          console.error('Export failed for', docInfo.name, exportData.error);
          continue; // skip failed ones
        }

        // 2. Save to Firebase as Native Doc
        const newNativeDocRef = doc(collection(db, 'beiwe_docs'));
        await setDoc(newNativeDocRef, {
          title: docInfo.name,
          content: exportData.html || '',
          ownerId: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          type: 'document'
        });
        
        importedCount++;
      }
      
      if (importedCount > 0) {
        setShowImportModal(false);
        // Force refresh the list (useEffect depends on showImportModal)
      } else {
        setImportError('Hiçbir doküman başarıyla aktarılamadı.');
      }
    } catch (error: any) {
      setImportError(error.message || 'İçe aktarma sırasında bir hata oluştu.');
    } finally {
      setIsImporting(false);
    }
  };

  // Simulate API fetch from our real Google Sync endpoint
  useEffect(() => {
    const fetchDocs = async () => {
      setLoading(true);
      
      let allDocs: GoogleDoc[] = [];

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
  }, [user, showNewDocEditor, editingNativeDoc, showImportModal]); // re-fetch when closing editors or modals

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
            <button 
              onClick={handleOpenImportModal}
              className="bg-white border border-[var(--color-ink)]/10 text-[var(--color-ink)] px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 hover:bg-gray-50 transition-colors shadow-sm"
            >
              <CloudDownload size={18} /> Google'dan Aktar
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
                <p>Henüz hiçbir yerel dokümanınız yok.</p>
                <p className="text-sm mt-1">"Google'dan Aktar" butonuyla mevcut dosyalarınızı getirebilir veya Yeni Doküman oluşturabilirsiniz.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Import Docs Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200 max-h-[85vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <CloudDownload size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-[var(--color-ink)] text-lg">Google'dan İçe Aktar</h3>
                  <p className="text-xs text-[var(--color-ink-light)]">Google Drive'daki metin belgelerinizi Beiwe'ye kopyalayın.</p>
                </div>
              </div>
              <button 
                onClick={() => setShowImportModal(false)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex-1">
              {importError && (
                <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-xl text-sm flex flex-col gap-2">
                  <span className="font-semibold">Hata</span>
                  <span>{importError}</span>
                  <button 
                    onClick={() => setGoogleDocsList([])} 
                    className="text-red-700 underline text-xs w-fit"
                  >
                    Tekrar Dene
                  </button>
                </div>
              )}

              {googleDocsList.length === 0 && !importError ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
                  <p className="text-[var(--color-ink-light)] font-medium">Google Drive'ınız taranıyor...</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {googleDocsList.map(doc => {
                    const isSelected = selectedGoogleDocs.includes(doc.id);
                    return (
                      <div 
                        key={doc.id}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedGoogleDocs(prev => prev.filter(id => id !== doc.id));
                          } else {
                            setSelectedGoogleDocs(prev => [...prev, doc.id]);
                          }
                        }}
                        className={`flex items-center gap-4 p-3 rounded-xl border cursor-pointer transition-all ${isSelected ? 'border-blue-500 bg-blue-50/50' : 'border-gray-100 hover:border-blue-200'}`}
                      >
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300'}`}>
                          {isSelected && <svg viewBox="0 0 14 14" fill="none" className="w-3 h-3"><path d="M3 7.5L5.5 10L11 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        </div>
                        <img src={doc.iconLink} alt="icon" className="w-5 h-5" />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>{doc.name}</p>
                          <p className="text-xs text-gray-500">Son değişiklik: {doc.modifiedTime}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 shrink-0">
              <button 
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                İptal
              </button>
              <button 
                onClick={handleImportSelected}
                disabled={selectedGoogleDocs.length === 0 || isImporting}
                className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl transition-colors shadow-sm flex items-center gap-2"
              >
                {isImporting ? (
                  <><Loader2 size={16} className="animate-spin" /> Aktarılıyor...</>
                ) : (
                  <>Seçilenleri İçe Aktar ({selectedGoogleDocs.length})</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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
