'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Users, Search, Plus, UserPlus, Clock } from 'lucide-react';
import { ingestMemory } from '@/lib/saule-core-client';

export default function CustomersClient({ dict }: { dict: any }) {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerDetails, setNewCustomerDetails] = useState('');

  const fetchCustomers = async () => {
    if (!user) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_SAULE_API_URL || 'https://us-central1-saule-core.cloudfunctions.net/api';
      const res = await fetch(`${apiUrl}/api/smi/nodes`);
      if (!res.ok) throw new Error('Failed to fetch');
      
      const data = await res.json();
      const allNodes = data.nodes || [];
      
      // Müşteri düğümlerini filtrele
      const userCustomers = allNodes.filter((n: any) => 
        n.spaceId === user.uid && 
        n.content.includes('/müşteri ')
      ).sort((a: any, b: any) => b.createdAt - a.createdAt);
      
      setCustomers(userCustomers);
    } catch (err) {
      console.error("Failed to fetch customers:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [user]);

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName.trim() || !user) return;
    
    setIsLoading(true);
    try {
      let finalContent = `/müşteri ${newCustomerName.trim()}`;
      if (newCustomerDetails.trim()) {
        finalContent += ` - Ek Bilgi: ${newCustomerDetails.trim()}`;
      }

      const token = await user.getIdToken();
      await ingestMemory(
        finalContent,
        'action',
        { source: 'customers_page', author: user.uid, createdAt: Date.now() },
        'fact',
        'personal',
        user.uid,
        token
      );
      
      setShowAddModal(false);
      setNewCustomerName('');
      setNewCustomerDetails('');
      // Reload
      await fetchCustomers();
    } catch (err) {
      console.error("Failed to add customer:", err);
      setIsLoading(false);
    }
  };

  const filteredCustomers = customers.filter(c => c.content.toLowerCase().includes(searchQuery.toLowerCase()));

  const extractCustomerName = (content: string) => {
    const match = content.match(/\/müşteri\s+([^-]+)/i);
    return match ? match[1].trim() : 'Bilinmeyen Müşteri';
  };

  const extractCustomerDetails = (content: string) => {
    if (content.includes('- Ek Bilgi:')) {
      return content.split('- Ek Bilgi:')[1].trim();
    }
    return '';
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--color-paper)] p-8 overflow-y-auto w-full relative">
      <div className="max-w-5xl mx-auto w-full space-y-8">
        
        <header className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[var(--color-burnt-orange)]/10 rounded-xl text-[var(--color-burnt-orange)]">
                <Users size={24} />
              </div>
              <h1 className="text-3xl font-bold text-[var(--color-ink)] tracking-tight">Müşteriler</h1>
            </div>
            <button 
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-[var(--color-burnt-orange)] text-white px-5 py-2.5 rounded-xl font-medium hover:bg-orange-600 transition-colors shadow-sm"
            >
              <Plus size={18} />
              <span>Yeni Ekle</span>
            </button>
          </div>
          <p className="text-[var(--color-ink-light)] text-lg">
            Ağınızdaki tüm müşteriler ve bağlantılar
          </p>
        </header>

        {/* Search Bar */}
        <div className="relative group w-full max-w-2xl">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-[var(--color-ink)]/40 group-focus-within:text-[var(--color-burnt-orange)] transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Müşterilerde ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[var(--color-paper)] border-2 border-[var(--color-ink)]/10 rounded-2xl py-4 pl-12 pr-4 text-lg text-[var(--color-ink)] placeholder-[var(--color-ink)]/30 focus:outline-none focus:border-[var(--color-burnt-orange)] focus:ring-4 focus:ring-[var(--color-burnt-orange)]/10 transition-all shadow-sm"
          />
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => (
              <div key={i} className="h-40 rounded-2xl bg-[var(--color-ink)]/5 animate-pulse" />
            ))}
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-[var(--color-ink-light)] bg-white/50 rounded-3xl border-2 border-dashed border-[var(--color-ink)]/10">
            <UserPlus size={48} className="mb-4 opacity-50" />
            <h3 className="text-xl font-medium text-[var(--color-ink)]">Müşteri bulunamadı</h3>
            <p className="mt-2 text-center max-w-md">
              Sağ üstteki düğmeyi kullanarak veya arama çubuğuna <strong>/müşteri Ahmet Bey</strong> yazarak ekleyebilirsiniz.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCustomers.map(c => {
              const name = extractCustomerName(c.content);
              const details = extractCustomerDetails(c.content);
              
              return (
                <div key={c.id} className="group bg-white rounded-3xl p-6 border border-[var(--color-ink)]/5 shadow-sm hover:shadow-xl hover:border-[var(--color-burnt-orange)]/30 transition-all duration-300 flex flex-col cursor-pointer">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-[var(--color-ink)]/5 flex items-center justify-center text-[var(--color-ink)] font-bold text-lg">
                      {name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-[var(--color-ink)] font-semibold text-lg line-clamp-1">{name}</h3>
                      <div className="flex items-center gap-1 text-[var(--color-ink-light)] text-xs mt-1">
                        <Clock size={12} />
                        <span>{new Date(c.createdAt).toLocaleDateString('tr-TR')}</span>
                      </div>
                    </div>
                  </div>
                  {details && (
                    <p className="text-[var(--color-ink-light)] text-sm line-clamp-3 mt-2 border-t border-[var(--color-ink)]/5 pt-3">
                      {details}
                    </p>
                  )}
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
            <h2 className="text-2xl font-bold text-[var(--color-ink)] mb-6">Yeni Müşteri Ekle</h2>
            <form onSubmit={handleAddCustomer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-ink-light)] mb-1">Müşteri Adı / Ünvanı</label>
                <input
                  type="text"
                  required
                  value={newCustomerName}
                  onChange={e => setNewCustomerName(e.target.value)}
                  className="w-full border-2 border-[var(--color-ink)]/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--color-burnt-orange)] text-[var(--color-ink)]"
                  placeholder="Örn: Ahmet Yılmaz"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-ink-light)] mb-1">Ek Bilgiler (Opsiyonel)</label>
                <textarea
                  value={newCustomerDetails}
                  onChange={e => setNewCustomerDetails(e.target.value)}
                  className="w-full border-2 border-[var(--color-ink)]/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--color-burnt-orange)] text-[var(--color-ink)] min-h-[100px] resize-none"
                  placeholder="Şirket, İletişim, Notlar..."
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
                  disabled={!newCustomerName.trim()}
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
