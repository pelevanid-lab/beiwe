'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Bookmark, Search, Clock, Plus, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ingestMemory } from '@/lib/saule-core-client';
import dynamic from 'next/dynamic';

// Custom Quill wrapper to fix React 19 findDOMNode issue
const QuillEditor = dynamic(() => import('@/components/QuillEditor'), { ssr: false });

export default function NotesClient({ dict }: { dict: any }) {
  const router = useRouter();
  const { user } = useAuth();
  const [notes, setNotes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchNotes();
  }, [user]);

  const fetchNotes = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_SAULE_API_URL || 'https://us-central1-saule-core.cloudfunctions.net/api';
      const res = await fetch(`${apiUrl}/api/smi/nodes`);
      if (!res.ok) throw new Error('Failed to fetch');
      
      const data = await res.json();
      const allNodes = data.nodes || [];
      
      // Müşteri veya sistem olmayan serbest notları filtrele (category: knowledge veya /note içerenler)
      const userNotes = allNodes.filter((n: any) => 
        n.spaceId === user.uid && 
        (n.category === 'knowledge' || n.content.includes('/note ') || n.content.includes('/not '))
      ).sort((a: any, b: any) => b.createdAt - a.createdAt);
      
      setNotes(userNotes);
    } catch (err) {
      console.error("Failed to fetch notes:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNoteContent.trim() || newNoteContent === '<p><br></p>' || !user) return;
    
    setIsSaving(true);
    try {
      const finalContent = `/note ${newNoteContent}`;
      const token = await user.getIdToken();
      await ingestMemory(
        finalContent,
        'knowledge',
        { source: 'notes_page', author: user.uid, createdAt: Date.now() },
        'fact',
        'personal',
        user.uid,
        token
      );
      
      setShowAddModal(false);
      setNewNoteContent('');
      await fetchNotes();
    } catch (err) {
      console.error("Failed to add note:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredNotes = notes.filter(n => n.content.toLowerCase().includes(searchQuery.toLowerCase()));

  const extractOriginalQuery = (content: string) => {
    const match = content.match(/\[ORIGINAL_QUERY\]([\s\S]*?)(?:\[SYNTHESIS\]|\[ACTION_RESULT\]|$)/);
    if (match) return match[1].trim();
    // Geriye dönük uyumluluk: Eğer etiket yoksa, " - " ile birleştirilmiş metnin ilk kısmını al
    return content.split(' - ')[0].replace(/^\/(?:note|not)\s+/i, '').trim();
  };

  const extractSynthesis = (content: string) => {
    const match = content.match(/\[SYNTHESIS\]([\s\S]*?)(?:\[ACTION_RESULT\]|$)/);
    return match ? match[1].trim() : null;
  };

  const formatContent = (content: string) => {
    const originalQuery = extractOriginalQuery(content);
    const synthesis = extractSynthesis(content);
    
    // Geriye dönük eski veriler için (Eğer etiketler yoksa ama eski stil " - " ayracı varsa)
    let displayHtml = `<strong>${originalQuery}</strong>`;
    
    if (synthesis) {
      displayHtml += `<div class="mt-2 text-sm text-[var(--color-burnt-orange)] bg-[var(--color-burnt-orange)]/5 p-2 rounded-lg italic">"${synthesis}"</div>`;
    } else if (content.includes(' - ') && !content.includes('[ORIGINAL_QUERY]')) {
      const parts = content.split(' - ');
      parts.shift(); // Soru kısmını at
      const remainingSynthesis = parts.join(' - ').replace(/\[ACTION_RESULT:.*?\]/g, '').trim();
      if (remainingSynthesis) {
        displayHtml += `<div class="mt-2 text-sm text-[var(--color-burnt-orange)] bg-[var(--color-burnt-orange)]/5 p-2 rounded-lg italic">"${remainingSynthesis}"</div>`;
      }
    }
    
    return displayHtml;
  };

  const extractActionResult = (content: string) => {
    // Yeni format
    const match = content.match(/\[ACTION_RESULT\]([\s\S]*?)$/);
    if (match) return match[1].trim();
    // Eski format
    const oldMatch = content.match(/\[ACTION_RESULT:(.*?)\]/);
    return oldMatch ? oldMatch[1].trim() : null;
  };

  const extractTextContent = (html: string) => {
    // HTML taglarını temizleyip sadece metni al (Arama için)
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || "";
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--color-paper)] p-8 overflow-y-auto w-full relative">
      <div className="max-w-5xl mx-auto w-full space-y-8">
        
        <header className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[var(--color-burnt-orange)]/10 rounded-xl text-[var(--color-burnt-orange)]">
                <Bookmark size={24} />
              </div>
              <h1 className="text-3xl font-bold text-[var(--color-ink)] tracking-tight">{dict?.clarity_notes || "Netleştirici Notlar"} {dict?.clarity_notes_en && <span className="text-xl text-[var(--color-ink-light)] font-normal">{dict.clarity_notes_en}</span>}</h1>
            </div>
            <button 
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-[var(--color-burnt-orange)] text-white px-5 py-2.5 rounded-xl font-medium hover:bg-orange-600 transition-colors shadow-sm"
            >
              <Plus size={18} />
              <span>{dict?.new_note || "Yeni Not"}</span>
            </button>
          </div>
          <p className="text-[var(--color-ink-light)] text-lg">
            {dict?.clarity_notes_desc || "Clarity Engine kayıtlarınız ve manuel eklediğiniz notlar"}
          </p>
        </header>

        {/* Search Bar */}
        <div className="relative group w-full max-w-2xl">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-[var(--color-ink)]/40 group-focus-within:text-[var(--color-burnt-orange)] transition-colors" />
          </div>
          <input
            type="text"
            placeholder={dict?.search_notes || "Notlarda ara..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[var(--color-paper)] border-2 border-[var(--color-ink)]/10 rounded-2xl py-4 pl-12 pr-4 text-lg text-[var(--color-ink)] placeholder-[var(--color-ink)]/30 focus:outline-none focus:border-[var(--color-burnt-orange)] focus:ring-4 focus:ring-[var(--color-burnt-orange)]/10 transition-all shadow-sm"
          />
        </div>

        {/* Notes Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="h-48 rounded-2xl bg-[var(--color-ink)]/5 animate-pulse" />
            ))}
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-[var(--color-ink-light)] bg-white/50 rounded-3xl border-2 border-dashed border-[var(--color-ink)]/10">
            <Bookmark size={48} className="mb-4 opacity-50" />
            <h3 className="text-xl font-medium text-[var(--color-ink)]">{dict?.no_notes_found || "Henüz bir not bulunamadı"}</h3>
            <p className="mt-2 text-center max-w-md" dangerouslySetInnerHTML={{ __html: dict?.no_notes_desc || "Sağ üstteki \"Yeni Not\" butonunu kullanarak veya arama çubuğuna <strong>/note</strong> yazarak yeni bir not ekleyebilirsiniz." }} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNotes.map(note => {
              const cleanedContent = formatContent(note.content);
              const actionResult = extractActionResult(note.content);
              
              return (
                <div 
                  key={note.id} 
                  onClick={() => router.push(`/tr/app?query=${encodeURIComponent(extractOriginalQuery(note.content))}`)}
                  className="bg-white p-6 rounded-2xl shadow-sm border border-[var(--color-ink)]/5 hover:shadow-md hover:border-[var(--color-burnt-orange)]/30 transition-all group flex flex-col cursor-pointer h-[240px]"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-bold text-[var(--color-ink-light)]">
                      {new Date(note.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
                    </span>
                    {actionResult && (
                      <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-md text-[10px] font-bold overflow-hidden text-ellipsis whitespace-nowrap max-w-[200px]">
                        {actionResult}
                      </span>
                    )}
                  </div>
                  <div className="prose prose-sm prose-orange max-w-none text-[var(--color-ink)] line-clamp-6">
                    <div dangerouslySetInnerHTML={{ __html: cleanedContent }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Rich Text Note Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-[var(--color-ink)]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-3xl h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-200 border border-[var(--color-ink)]/10">
            <div className="p-6 border-b border-[var(--color-ink)]/5 flex justify-between items-center bg-[var(--color-paper)]">
              <h2 className="text-xl font-bold text-[var(--color-ink)] flex items-center gap-2">
                <Bookmark size={20} className="text-[var(--color-burnt-orange)]" /> Yeni Not
              </h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 bg-[var(--color-ink)]/5 hover:bg-[var(--color-ink)]/10 rounded-full transition-colors text-[var(--color-ink-light)]">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 p-6 overflow-y-auto bg-white editor-container">
              <QuillEditor 
                value={newNoteContent} 
                onChange={setNewNoteContent}
              />
            </div>
            
            <div className="p-6 border-t border-[var(--color-ink)]/5 bg-[var(--color-paper)] flex justify-end gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-6 py-2.5 rounded-xl font-medium text-[var(--color-ink)] hover:bg-[var(--color-ink)]/5 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleAddNote}
                disabled={isSaving || !newNoteContent.trim() || newNoteContent === '<p><br></p>'}
                className="px-8 py-2.5 rounded-xl font-medium bg-[var(--color-burnt-orange)] text-white hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
