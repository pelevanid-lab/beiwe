'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Users, Search, Plus, UserPlus, Clock, ChevronRight, FileText, Phone, Mail, CloudDownload, AlertCircle } from 'lucide-react';
import { ingestMemory } from '@/lib/saule-core-client';
import { fetchWithGoogleAuth } from '@/lib/google-api';
import { useRouter } from 'next/navigation';
import { setClarityContext } from '@/lib/clarity-context';

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

  // Google Contacts Modal state
  const [showContactsModal, setShowContactsModal] = useState(false);
  const [contactsList, setContactsList] = useState<any[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [contactsError, setContactsError] = useState<string | null>(null);

  const tComingSoon = dict?.common?.coming_soon || 'Yakında';

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
      
      // Clarity Engine'e müşteri listesini bildir
      setClarityContext({
        module: 'customers',
        title: 'Müşteri Listesi',
        data: {
          customers: uniqueCustomers.map((c: any) => {
            const match = c.content.match(/\/(?:customer|müşteri)\s+([^-]+)/i);
            return { id: c.id, name: match ? match[1].trim() : '?' };
          }),
          totalCount: uniqueCustomers.length
        }
      });
    } catch (err) {
      console.error("Failed to fetch customers:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenContactsModal = async () => {
    setShowContactsModal(true);
    setIsLoadingContacts(true);
    setContactsError(null);
    setContactsList([]);
    setSelectedContacts([]);
    try {
      const res = await fetchWithGoogleAuth('https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,phoneNumbers&pageSize=100');
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to fetch contacts');
      }
      setContactsList(data.connections || []);
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes('No Google access token') || err.message?.includes('Failed to refresh') || err.message?.includes('insufficient authentication scopes')) {
        setContactsError('Google hesabınızın kişi okuma izni eksik. Lütfen Entegrasyonlar sayfasından Google bağlantınızı kesip tekrar bağlayın (Kişiler izni gereklidir).');
      } else {
        setContactsError('Kişiler yüklenirken bir hata oluştu: ' + err.message);
      }
    } finally {
      setIsLoadingContacts(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
    
    // Check if we should auto-open the import contacts modal
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('action') === 'import_google_contacts') {
        handleOpenContactsModal();
        // Remove the action from URL
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      }
    }
  }, [user]);

  const handleImportContacts = async () => {
    if (selectedContacts.length === 0 || !user) return;
    setIsLoading(true);
    setShowContactsModal(false);
    try {
      const token = await user.getIdToken();
      
      for (const resourceName of selectedContacts) {
        const contact = contactsList.find(c => c.resourceName === resourceName);
        if (!contact) continue;
        
        const name = contact.names?.[0]?.displayName || 'İsimsiz Kişi';
        const phone = contact.phoneNumbers?.[0]?.value || '';
        const email = contact.emailAddresses?.[0]?.value || '';
        
        let details = '';
        if (phone) details += `Telefon: ${phone} `;
        if (email) {
          const safeEmail = email.replace(/@/g, '[AT]').replace(/\./g, '[DOT]');
          details += `E-posta: ${safeEmail} `;
        }
        
        let finalContent = `/customer ${name} - Tip: Lead`;
        if (details.trim()) {
          finalContent += ` - Ek Bilgi: ${details.trim()} (Google Contacts'ten aktarıldı)`;
        } else {
          finalContent += ` - Ek Bilgi: (Google Contacts'ten aktarıldı)`;
        }

        await ingestMemory(
          finalContent,
          'action',
          { source: 'customers_page_import', author: user.uid, createdAt: Date.now() },
          'fact',
          'personal',
          user.uid,
          token
        );
      }
      await fetchCustomers();
    } catch (err) {
      console.error("Failed to import contacts:", err);
    } finally {
      setIsLoading(false);
    }
  };

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
            <div className="flex gap-2">
              <button 
                disabled
                className="relative flex items-center gap-2 bg-white border border-[var(--color-ink)]/10 text-[var(--color-ink)] px-5 py-2.5 rounded-xl font-medium opacity-50 cursor-not-allowed shadow-sm"
              >
                <CloudDownload size={18} />
                <span className="hidden sm:inline">Google'dan Aktar</span>
                <span className="absolute -top-2 -right-2 bg-[var(--color-burnt-orange)] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap">{tComingSoon}</span>
              </button>
              <button 
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 bg-[var(--color-burnt-orange)] text-white px-5 py-2.5 rounded-xl font-medium hover:bg-orange-600 transition-colors shadow-sm"
              >
                <Plus size={18} />
                <span>{dict.customers.add_new}</span>
              </button>
            </div>
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
      {/* Google Contacts Modal */}
      {showContactsModal && (
        <div className="fixed inset-0 bg-[var(--color-ink)]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--color-paper)] rounded-3xl p-8 w-full max-w-2xl shadow-2xl animate-in zoom-in-95 fade-in duration-200 max-h-[85vh] flex flex-col">
            <h2 className="text-2xl font-bold text-[var(--color-ink)] mb-2 flex items-center gap-2">
              <CloudDownload className="text-[var(--color-burnt-orange)]" /> Google Contacts
            </h2>
            <p className="text-sm text-[var(--color-ink-light)] mb-6">Rehberinizdeki kişileri seçerek müşteri listenize aktarabilirsiniz.</p>
            
            {isLoadingContacts ? (
              <div className="flex-1 flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-burnt-orange)] mb-4"></div>
                <p className="text-[var(--color-ink-light)]">Google Contacts yükleniyor...</p>
              </div>
            ) : contactsError ? (
              <div className="flex-1 flex flex-col items-center justify-center py-8">
                <AlertCircle size={48} className="text-red-500 mb-4" />
                <p className="text-center text-[var(--color-ink)] font-medium mb-6 max-w-md">{contactsError}</p>
                <button 
                  onClick={() => router.push('/tr/app/integrations')}
                  className="bg-[var(--color-burnt-orange)] text-white px-6 py-2.5 rounded-xl font-medium hover:bg-orange-600 transition-colors"
                >
                  Entegrasyonlara Git
                </button>
              </div>
            ) : contactsList.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-12 text-[var(--color-ink-light)]">
                Rehberinizde kişi bulunamadı.
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto min-h-0 border border-[var(--color-ink)]/10 rounded-xl bg-white mb-6">
                <div className="divide-y divide-[var(--color-ink)]/5">
                  <label className="flex items-center gap-3 p-4 hover:bg-[var(--color-ink)]/5 cursor-pointer bg-gray-50 font-medium border-b border-[var(--color-ink)]/10">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded text-[var(--color-burnt-orange)] focus:ring-[var(--color-burnt-orange)]"
                      checked={selectedContacts.length === contactsList.length && contactsList.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedContacts(contactsList.map(c => c.resourceName));
                        else setSelectedContacts([]);
                      }}
                    />
                    Tümünü Seç ({contactsList.length})
                  </label>
                  {contactsList.map(contact => {
                    const name = contact.names?.[0]?.displayName || 'İsimsiz Kişi';
                    const phone = contact.phoneNumbers?.[0]?.value || '';
                    const email = contact.emailAddresses?.[0]?.value || '';
                    const isChecked = selectedContacts.includes(contact.resourceName);
                    
                    return (
                      <label key={contact.resourceName} className="flex items-center gap-4 p-4 hover:bg-[var(--color-burnt-orange)]/5 transition-colors cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) setSelectedContacts(prev => prev.filter(id => id !== contact.resourceName));
                            else setSelectedContacts(prev => [...prev, contact.resourceName]);
                          }}
                          className="w-4 h-4 rounded text-[var(--color-burnt-orange)] focus:ring-[var(--color-burnt-orange)]"
                        />
                        <div className="w-10 h-10 rounded-full bg-[var(--color-ink)]/5 flex items-center justify-center text-[var(--color-ink)] font-bold text-sm shrink-0">
                          {name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-[var(--color-ink)] truncate">{name}</div>
                          <div className="text-xs text-[var(--color-ink-light)] truncate">
                            {phone} {phone && email ? '•' : ''} {email}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
            
            <div className="flex justify-end gap-3 mt-auto shrink-0 pt-4 border-t border-[var(--color-ink)]/10">
              <button
                type="button"
                onClick={() => setShowContactsModal(false)}
                className="px-5 py-2.5 rounded-xl font-medium text-[var(--color-ink)] hover:bg-[var(--color-ink)]/5 transition-colors"
              >
                İptal
              </button>
              <button
                type="button"
                disabled={selectedContacts.length === 0 || isLoadingContacts || !!contactsError}
                onClick={handleImportContacts}
                className="px-5 py-2.5 rounded-xl font-medium bg-[var(--color-burnt-orange)] text-white hover:bg-orange-600 transition-colors disabled:opacity-50"
              >
                Seçilenleri Aktar ({selectedContacts.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
