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

  const contentHasTags = (content: string) => {
    return content.includes('[ORIGINAL_QUERY]') || content.includes('[SYNTHESIS]') || content.includes('[ACTION_RESULT');
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

        {/* Conversation History View */}
        {isLoading ? (
          <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
            {[1,2,3,4].map(i => (
              <div key={i} className="flex flex-col gap-4 w-full">
                <div className="h-16 w-3/4 self-end rounded-2xl bg-[var(--color-ink)]/5 animate-pulse" />
                <div className="h-24 w-3/4 self-start rounded-2xl bg-[var(--color-ink)]/5 animate-pulse" />
              </div>
            ))}
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-[var(--color-ink-light)] bg-white/50 rounded-3xl border-2 border-dashed border-[var(--color-ink)]/10">
            <Bookmark size={48} className="mb-4 opacity-50" />
            <h3 className="text-xl font-medium text-[var(--color-ink)]">{dict?.no_notes_found || "Henüz bir işlem veya not bulunamadı"}</h3>
            <p className="mt-2 text-center max-w-md" dangerouslySetInnerHTML={{ __html: dict?.no_notes_desc || "Burada Clarity Engine ile yaptığınız konuşmalar ve işlemler listelenir." }} />
          </div>
        ) : (
          <div className="flex flex-col gap-8 max-w-4xl mx-auto w-full pb-20">
            {filteredNotes.map(note => {
              const originalQuery = extractOriginalQuery(note.content);
              const synthesis = extractSynthesis(note.content);
              const actionResult = extractActionResult(note.content);
              
              const isAgentInteraction = contentHasTags(note.content);
              const timeString = new Date(note.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });

              return (
                <div key={note.id} className="flex flex-col gap-4 w-full group">
                  
                  {/* User Bubble (The Query or Manual Note) */}
                  <div className="flex flex-col items-end w-full">
                    <div className="bg-[var(--color-burnt-orange)] text-white px-6 py-4 rounded-3xl rounded-tr-sm max-w-[85%] sm:max-w-[75%] shadow-sm">
                      <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{originalQuery}</p>
                    </div>
                    <span className="text-[11px] text-[var(--color-ink-light)] mt-1.5 font-medium px-1">
                      Siz • {timeString}
                    </span>
                  </div>

                  {/* Agent Bubble (Synthesis & Action Result) */}
                  {(synthesis || actionResult || !isAgentInteraction) && (
                    <div className="flex flex-col items-start w-full mt-1">
                      <div className="bg-white border border-[var(--color-ink)]/10 px-6 py-4 rounded-3xl rounded-tl-sm max-w-[85%] sm:max-w-[75%] shadow-sm">
                        
                        {synthesis && (
                          <div className="text-[15px] text-[var(--color-ink)] leading-relaxed whitespace-pre-wrap mb-3">
                            {synthesis}
                          </div>
                        )}
                        
                        {actionResult && (
                          <div className="inline-flex items-center gap-2 bg-green-50 border border-green-100 text-green-700 px-3 py-2 rounded-xl text-xs font-bold mt-1">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                            {actionResult}
                          </div>
                        )}

                        {!isAgentInteraction && !synthesis && !actionResult && (
                          <div className="text-[15px] text-[var(--color-ink)] italic">
                            (Sisteme manuel not olarak eklendi)
                          </div>
                        )}

                      </div>
                      <span className="text-[11px] text-[var(--color-ink-light)] mt-1.5 font-medium px-1">
                        Clarity Engine • {timeString}
                      </span>
                    </div>
                  )}

                  {/* Actions Row */}
                  <div className="flex items-center justify-center mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => {
                        localStorage.setItem('clarity_restore_note', JSON.stringify({
                          originalQuery,
                          synthesis,
                          actionResult
                        }));
                        router.push('/tr/app?restore=true');
                      }}
                      className="flex items-center gap-2 bg-white border border-[var(--color-ink)]/10 text-[var(--color-ink-light)] hover:text-[var(--color-burnt-orange)] hover:border-[var(--color-burnt-orange)]/30 px-4 py-2 rounded-full text-xs font-semibold shadow-sm transition-all hover:shadow-md"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                      Konuşmaya Devam Et
                    </button>
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
