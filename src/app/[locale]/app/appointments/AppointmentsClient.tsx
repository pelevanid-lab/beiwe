'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Calendar, Search, Plus, Clock, CalendarPlus } from 'lucide-react';
import { ingestMemory } from '@/lib/saule-core-client';

export default function AppointmentsClient({ dict }: { dict: any }) {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');

  const fetchAppointments = async () => {
    if (!user) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_SAULE_API_URL || 'https://us-central1-saule-core.cloudfunctions.net/api';
      const res = await fetch(`${apiUrl}/api/smi/nodes`);
      if (!res.ok) throw new Error('Failed to fetch');
      
      const data = await res.json();
      const allNodes = data.nodes || [];
      
      // Randevu düğümlerini filtrele (Örn: /randevu veya /görev ile başlayan ve randevu/toplantı kelimeleri içerenler)
      const userAppointments = allNodes.filter((n: any) => 
        n.spaceId === user.uid && 
        n.content.includes('/randevu ')
      ).sort((a: any, b: any) => b.createdAt - a.createdAt);
      
      setAppointments(userAppointments);
    } catch (err) {
      console.error("Failed to fetch appointments:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [user]);

  const handleAddAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !user) return;
    
    setIsLoading(true);
    try {
      let finalContent = `/randevu ${newTitle.trim()}`;
      if (newDate.trim()) {
        finalContent += ` - Zaman: ${newDate.trim()}`;
      }

      const token = await user.getIdToken();
      await ingestMemory(
        finalContent,
        'action',
        { source: 'appointments_page', author: user.uid, createdAt: Date.now() },
        'task',
        'personal',
        user.uid,
        token
      );
      
      setShowAddModal(false);
      setNewTitle('');
      setNewDate('');
      // Reload
      await fetchAppointments();
    } catch (err) {
      console.error("Failed to add appointment:", err);
      setIsLoading(false);
    }
  };

  const filteredAppointments = appointments.filter(a => a.content.toLowerCase().includes(searchQuery.toLowerCase()));

  const extractTitle = (content: string) => {
    const match = content.match(/\/randevu\s+([^-]+)/i);
    return match ? match[1].trim() : 'Bilinmeyen Randevu';
  };

  const extractDate = (content: string) => {
    if (content.includes('- Zaman:')) {
      return content.split('- Zaman:')[1].trim();
    }
    return 'Tarih Belirtilmedi';
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--color-paper)] p-8 overflow-y-auto w-full relative">
      <div className="max-w-5xl mx-auto w-full space-y-8">
        
        <header className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[var(--color-burnt-orange)]/10 rounded-xl text-[var(--color-burnt-orange)]">
                <Calendar size={24} />
              </div>
              <h1 className="text-3xl font-bold text-[var(--color-ink)] tracking-tight">Randevular</h1>
            </div>
            <button 
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-[var(--color-burnt-orange)] text-white px-5 py-2.5 rounded-xl font-medium hover:bg-orange-600 transition-colors shadow-sm"
            >
              <Plus size={18} />
              <span>Yeni Randevu</span>
            </button>
          </div>
          <p className="text-[var(--color-ink-light)] text-lg">
            Yaklaşan etkinlikleriniz ve toplantılarınız
          </p>
        </header>

        {/* Search Bar */}
        <div className="relative group w-full max-w-2xl">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-[var(--color-ink)]/40 group-focus-within:text-[var(--color-burnt-orange)] transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Randevularda ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[var(--color-paper)] border-2 border-[var(--color-ink)]/10 rounded-2xl py-4 pl-12 pr-4 text-lg text-[var(--color-ink)] placeholder-[var(--color-ink)]/30 focus:outline-none focus:border-[var(--color-burnt-orange)] focus:ring-4 focus:ring-[var(--color-burnt-orange)]/10 transition-all shadow-sm"
          />
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1,2].map(i => (
              <div key={i} className="h-40 rounded-2xl bg-[var(--color-ink)]/5 animate-pulse" />
            ))}
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-[var(--color-ink-light)] bg-white/50 rounded-3xl border-2 border-dashed border-[var(--color-ink)]/10">
            <CalendarPlus size={48} className="mb-4 opacity-50" />
            <h3 className="text-xl font-medium text-[var(--color-ink)]">Randevu bulunamadı</h3>
            <p className="mt-2 text-center max-w-md">
              Sağ üstteki düğmeyi kullanarak veya arama çubuğuna <strong>/randevu Ahmet Bey Toplantısı</strong> yazarak ekleyebilirsiniz.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredAppointments.map(a => {
              const title = extractTitle(a.content);
              const date = extractDate(a.content);
              
              return (
                <div key={a.id} className="group bg-white rounded-3xl p-6 border border-[var(--color-ink)]/5 shadow-sm hover:shadow-xl hover:border-[var(--color-burnt-orange)]/30 transition-all duration-300 flex flex-col cursor-pointer">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[var(--color-ink)] font-semibold text-lg line-clamp-1">{title}</h3>
                  </div>
                  <div className="flex items-center gap-2 text-[var(--color-ink-light)] text-sm bg-[var(--color-ink)]/5 self-start px-3 py-1.5 rounded-lg font-medium">
                    <Clock size={14} className="text-[var(--color-burnt-orange)]" />
                    <span>{date}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-[var(--color-ink)]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--color-paper)] rounded-3xl p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 fade-in duration-200">
            <h2 className="text-2xl font-bold text-[var(--color-ink)] mb-6">Yeni Randevu</h2>
            <form onSubmit={handleAddAppointment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-ink-light)] mb-1">Randevu Başlığı / Kiminle</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full border-2 border-[var(--color-ink)]/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--color-burnt-orange)] text-[var(--color-ink)]"
                  placeholder="Örn: Proje Sunumu"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-ink-light)] mb-1">Zaman (Tarih ve Saat)</label>
                <input
                  type="datetime-local"
                  required
                  value={newDate}
                  onChange={e => setNewDate(e.target.value)}
                  className="w-full border-2 border-[var(--color-ink)]/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--color-burnt-orange)] text-[var(--color-ink)]"
                />
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 rounded-xl font-medium text-[var(--color-ink)] hover:bg-[var(--color-ink)]/5 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={!newTitle.trim()}
                  className="px-5 py-2.5 rounded-xl font-medium bg-[var(--color-burnt-orange)] text-white hover:bg-orange-600 transition-colors disabled:opacity-50"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
