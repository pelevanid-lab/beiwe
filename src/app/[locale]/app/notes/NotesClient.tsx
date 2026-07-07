'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Bookmark, Search, Clock, Trash2 } from 'lucide-react';
import HeroSearch from '@/components/HeroSearch';
import { useRouter } from 'next/navigation';

export default function NotesClient({ dict }: { dict: any }) {
  const { user } = useAuth();
  const [notes, setNotes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (!user) return;
    
    const fetchNotes = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_SAULE_API_URL || 'https://us-central1-saule-core.cloudfunctions.net/api';
        const res = await fetch(`${apiUrl}/api/smi/nodes`);
        if (!res.ok) throw new Error('Failed to fetch');
        
        const data = await res.json();
        const allNodes = data.nodes || [];
        
        // Sadece kullanıcıya ait olan "fact" veya "knowledge" düğümlerini getir (veya içinde 'not' geçenler)
        const userNotes = allNodes.filter((n: any) => 
          n.spaceId === user.uid && 
          (n.category === 'knowledge' || n.content.includes('/not '))
        ).sort((a: any, b: any) => b.createdAt - a.createdAt);
        
        setNotes(userNotes);
      } catch (err) {
        console.error("Failed to fetch notes:", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchNotes();
  }, [user]);

  const filteredNotes = notes.filter(n => n.content.toLowerCase().includes(searchQuery.toLowerCase()));

  const formatContent = (content: string) => {
    // '/not ' komutunu temizle
    return content.replace(/^\/not\s+/i, '');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--color-paper)] p-8 overflow-y-auto w-full relative">
      <div className="max-w-5xl mx-auto w-full space-y-8">
        
        <header className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[var(--color-burnt-orange)]/10 rounded-xl text-[var(--color-burnt-orange)]">
              <Bookmark size={24} />
            </div>
            <h1 className="text-3xl font-bold text-[var(--color-ink)] tracking-tight">Notlarım</h1>
          </div>
          <p className="text-[var(--color-ink-light)] text-lg">
            Saule SML veritabanındaki tüm notlarınız
          </p>
        </header>

        {/* Search Bar for Notes */}
        <div className="relative group w-full max-w-2xl">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-[var(--color-ink)]/40 group-focus-within:text-[var(--color-burnt-orange)] transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Notlarda ara..."
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
            <h3 className="text-xl font-medium text-[var(--color-ink)]">Henüz bir not bulunamadı</h3>
            <p className="mt-2 text-center max-w-md">
              Arama çubuğuna <strong>/not</strong> yazarak yeni bir not ekleyebilirsiniz.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNotes.map(note => (
              <div key={note.id} className="group bg-white rounded-3xl p-6 border border-[var(--color-ink)]/5 shadow-sm hover:shadow-xl hover:border-[var(--color-burnt-orange)]/30 transition-all duration-300 flex flex-col justify-between cursor-pointer">
                <div className="space-y-4">
                  <p className="text-[var(--color-ink)] text-lg leading-relaxed line-clamp-4">
                    {formatContent(note.content)}
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-[var(--color-ink)]/5 flex justify-between items-center text-[var(--color-ink-light)] text-sm">
                  <div className="flex items-center gap-2">
                    <Clock size={14} />
                    <span>
                      {new Date(note.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
