'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Users, Search, Plus, UserPlus, Clock, ChevronRight, FileText, Phone, Mail } from 'lucide-react';
import { ingestMemory } from '@/lib/saule-core-client';
import { useRouter } from 'next/navigation';

export default function CustomersClient({ dict }: { dict: any }) {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  
  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerDetails, setNewCustomerDetails] = useState('');
  const [newCustomerType, setNewCustomerType] = useState('Lead');

  const fetchCustomers = async () => {
    if (!user) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_SAULE_API_URL || 'https://us-central1-saule-core.cloudfunctions.net/api';
      const res = await fetch(`${apiUrl}/api/smi/nodes`);
      if (!res.ok) throw new Error('Failed to fetch');
      
      const data = await res.json();
      const allNodes = data.nodes || [];
      
      // Müşteri düğümlerini filtrele (tarihe göre en yeni en üstte)
      const userCustomers = allNodes.filter((n: any) => 
        n.spaceId === user.uid && 
        (n.content.includes('/customer ') || n.content.includes('/müşteri '))
      ).sort((a: any, b: any) => b.createdAt - a.createdAt);
      
      // Aynı isimli müşterilerin sadece en güncel (en yeni) olanını göster
      const uniqueCustomers: any[] = [];
      const seenNames = new Set();
      
      userCustomers.forEach((c: any) => {
        const match = c.content.match(/\/(?:customer|müşteri)\s+([^-]+)/i);
        const name = match ? match[1].trim().toLowerCase() : '';
        if (name && !seenNames.has(name)) {
          seenNames.add(name);
          uniqueCustomers.push(c);
        }
      });
      
      setCustomers(uniqueCustomers);
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
      let finalContent = `/customer ${newCustomerName.trim()}`;
      if (newCustomerType) {
        finalContent += ` - Tip: ${newCustomerType}`;
      }
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
      setNewCustomerType('Lead');
      // Reload
      await fetchCustomers();
    } catch (err) {
      console.error("Failed to add customer:", err);
      setIsLoading(false);
    }
  };

  const filteredCustomers = customers.filter(c => c.content.toLowerCase().includes(searchQuery.toLowerCase()));

  const extractCustomerName = (content: string) => {
    const match = content.match(/\/(?:customer|müşteri)\s+([^-]+)/i);
    return match ? match[1].trim() : dict.customers.unknown_customer;
  };

  const extractCustomerDetails = (content: string) => {
    if (content.includes('- Ek Bilgi:')) {
      return content.split('- Ek Bilgi:')[1].trim();
    }
    return '';
  };

  const extractCustomerType = (content: string) => {
    if (content.includes('- Tip:')) {
      const match = content.match(/- Tip:\s*([^-]+)/i);
      return match ? match[1].trim() : '-';
    }
    return '-';
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
              <h1 className="text-3xl font-bold text-[var(--color-ink)] tracking-tight">{dict.customers.title}</h1>
            </div>
            <button 
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-[var(--color-burnt-orange)] text-white px-5 py-2.5 rounded-xl font-medium hover:bg-orange-600 transition-colors shadow-sm"
            >
              <Plus size={18} />
              <span>{dict.customers.add_new}</span>
            </button>
          </div>
          <p className="text-[var(--color-ink-light)] text-lg">
            {dict.customers.subtitle}
          </p>
        </header>

        {/* Search Bar */}
        <div className="relative group w-full max-w-2xl">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-[var(--color-ink)]/40 group-focus-within:text-[var(--color-burnt-orange)] transition-colors" />
          </div>
          <input
            type="text"
            placeholder={dict.customers.search_placeholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[var(--color-paper)] border-2 border-[var(--color-ink)]/10 rounded-2xl py-4 pl-12 pr-4 text-lg text-[var(--color-ink)] placeholder-[var(--color-ink)]/30 focus:outline-none focus:border-[var(--color-burnt-orange)] focus:ring-4 focus:ring-[var(--color-burnt-orange)]/10 transition-all shadow-sm"
          />
        </div>

        {/* Table View */}
        {isLoading ? (
          <div className="bg-white rounded-3xl border border-[var(--color-ink)]/5 shadow-sm p-8 space-y-4">
            {[1,2,3].map(i => (
              <div key={i} className="h-16 rounded-xl bg-[var(--color-ink)]/5 animate-pulse" />
            ))}
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-[var(--color-ink-light)] bg-white/50 rounded-3xl border-2 border-dashed border-[var(--color-ink)]/10">
            <UserPlus size={48} className="mb-4 opacity-50" />
            <h3 className="text-xl font-medium text-[var(--color-ink)]">{dict.customers.not_found}</h3>
            <p className="mt-2 text-center max-w-md" dangerouslySetInnerHTML={{ __html: dict.customers.not_found_desc }} />
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-[var(--color-ink)]/5 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[var(--color-ink)]/5 border-b border-[var(--color-ink)]/10">
                  <tr>
                    <th className="px-6 py-4 text-sm font-semibold text-[var(--color-ink-light)] uppercase tracking-wider">{dict.customers.col_customer}</th>
                    <th className="px-6 py-4 text-sm font-semibold text-[var(--color-ink-light)] uppercase tracking-wider">{dict.customers.col_type}</th>
                    <th className="px-6 py-4 text-sm font-semibold text-[var(--color-ink-light)] uppercase tracking-wider">{dict.customers.col_details}</th>
                    <th className="px-6 py-4 text-sm font-semibold text-[var(--color-ink-light)] uppercase tracking-wider">{dict.customers.col_date}</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-[var(--color-ink-light)] uppercase tracking-wider">{dict.customers.col_actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-ink)]/5">
                  {filteredCustomers.map(c => {
                    const name = extractCustomerName(c.content);
                    const type = extractCustomerType(c.content);
                    const details = extractCustomerDetails(c.content);
                    
                    return (
                      <tr 
                        key={c.id} 
                        onClick={() => router.push(`/tr/app/customers/${c.id}`)}
                        className="hover:bg-[var(--color-burnt-orange)]/5 transition-colors cursor-pointer group"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-[var(--color-ink)]/5 flex items-center justify-center text-[var(--color-ink)] font-bold text-sm">
                              {name.charAt(0).toUpperCase()}
                            </div>
                            <div className="font-semibold text-[var(--color-ink)]">{name}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${type === 'Lead' ? 'bg-blue-100 text-blue-800' : type === 'Consumer' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                            {type}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-[var(--color-ink-light)] max-w-xs truncate">
                            {details || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1 text-sm text-[var(--color-ink-light)]">
                            <Clock size={14} />
                            {new Date(c.createdAt).toLocaleDateString('tr-TR')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button className="text-[var(--color-burnt-orange)] opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-[var(--color-burnt-orange)]/10 rounded-lg inline-flex items-center gap-1 font-medium text-sm">
                            {dict.customers.detail_btn} <ChevronRight size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-[var(--color-ink)]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--color-paper)] rounded-3xl p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 fade-in duration-200">
            <h2 className="text-2xl font-bold text-[var(--color-ink)] mb-6">{dict.customers.new_customer_title}</h2>
            <form onSubmit={handleAddCustomer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-ink-light)] mb-1">{dict.customers.name_label}</label>
                <input
                  type="text"
                  required
                  value={newCustomerName}
                  onChange={e => setNewCustomerName(e.target.value)}
                  className="w-full border-2 border-[var(--color-ink)]/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--color-burnt-orange)] text-[var(--color-ink)]"
                  placeholder={dict.customers.name_placeholder}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-ink-light)] mb-1">{dict.customers.type_label}</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="customerType" 
                      value="Lead" 
                      checked={newCustomerType === 'Lead'} 
                      onChange={() => setNewCustomerType('Lead')} 
                      className="text-[var(--color-burnt-orange)] focus:ring-[var(--color-burnt-orange)]"
                    />
                    <span className="text-[var(--color-ink)]">Lead</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="customerType" 
                      value="Consumer" 
                      checked={newCustomerType === 'Consumer'} 
                      onChange={() => setNewCustomerType('Consumer')} 
                      className="text-[var(--color-burnt-orange)] focus:ring-[var(--color-burnt-orange)]"
                    />
                    <span className="text-[var(--color-ink)]">Consumer</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-ink-light)] mb-1">{dict.customers.details_label}</label>
                <textarea
                  value={newCustomerDetails}
                  onChange={e => setNewCustomerDetails(e.target.value)}
                  className="w-full border-2 border-[var(--color-ink)]/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--color-burnt-orange)] text-[var(--color-ink)] min-h-[100px] resize-none"
                  placeholder={dict.customers.details_placeholder}
                />
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 rounded-xl font-medium text-[var(--color-ink)] hover:bg-[var(--color-ink)]/5 transition-colors"
                >
                  {dict.customers.cancel}
                </button>
                <button
                  type="submit"
                  disabled={!newCustomerName.trim()}
                  className="px-5 py-2.5 rounded-xl font-medium bg-[var(--color-burnt-orange)] text-white hover:bg-orange-600 transition-colors disabled:opacity-50"
                >
                  {dict.customers.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
