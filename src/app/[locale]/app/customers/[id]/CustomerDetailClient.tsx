'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { ArrowLeft, User, Mail, Phone, MapPin, Calendar as CalendarIcon, FileText, Briefcase, Edit2, Check, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ingestMemory } from '@/lib/saule-core-client';

export default function CustomerDetailClient({ dict, id }: { dict: any, id: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const [customer, setCustomer] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDetails, setEditDetails] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Note states
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);

  useEffect(() => {
    const fetchCustomer = async () => {
      if (!user) return;
      try {
        const apiUrl = process.env.NEXT_PUBLIC_SAULE_API_URL || 'https://us-central1-saule-core.cloudfunctions.net/api';
        const res = await fetch(`${apiUrl}/api/smi/nodes`);
        if (!res.ok) throw new Error('Failed to fetch');
        
        const data = await res.json();
        const allNodes = data.nodes || [];
        
        const targetNode = allNodes.find((n: any) => n.id === id && n.spaceId === user.uid);
        if (targetNode) {
          setCustomer(targetNode);
          
          // Müşteri ismini çıkar
          const match = targetNode.content.match(/\/(?:customer|müşteri)\s+([^-]+)/i);
          const customerName = match ? match[1].trim() : '';

          setEditName(customerName);

          if (targetNode.content.includes('- Ek Bilgi:')) {
            setEditDetails(targetNode.content.split('- Ek Bilgi:')[1].trim());
          } else {
            setEditDetails('');
          }

          // Bu müşteriye ait randevuları bul
          if (customerName) {
            const customerAppointments = allNodes.filter((n: any) => 
              n.spaceId === user.uid && 
              (n.content.includes('/appointment ') || n.content.includes('/randevu ') || n.content.includes('/cancel_appointment ') || n.content.includes('/note ')) &&
              n.content.includes(customerName)
            ).sort((a: any, b: any) => b.createdAt - a.createdAt);
            
            setAppointments(customerAppointments);
          }
        }
      } catch (err) {
        console.error("Failed to fetch customer:", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCustomer();
  }, [user, id]);

  const extractCustomerName = (content: string) => {
    const match = content.match(/\/(?:customer|müşteri)\s+([^-]+)/i);
    return match ? match[1].trim() : 'Bilinmeyen Müşteri';
  };

  const extractCustomerDetails = (content: string) => {
    if (content.includes('- Ek Bilgi:')) {
      return content.split('- Ek Bilgi:')[1].trim();
    }
    return 'Belirtilmedi';
  };

  const handleSaveEdit = async () => {
    if (!editName.trim() || !user || !customer) return;
    setIsSaving(true);
    try {
      const token = await user.getIdToken();
      let newContent = `/customer ${editName.trim()}`;
      if (editDetails.trim()) {
        newContent += ` - Ek Bilgi: ${editDetails.trim()}`;
      }
      
      const res = await ingestMemory(
        newContent,
        'action',
        { source: 'customers_page_edit', author: user.uid, createdAt: Date.now() },
        'fact',
        'personal',
        user.uid,
        token
      );
      
      if (res.node && res.node.id) {
        setIsEditing(false);
        // Navigate to new ID silently
        router.replace(`/tr/app/customers/${res.node.id}`);
      } else {
        // Fallback
        setCustomer((prev: any) => ({ ...prev, content: newContent }));
        setIsEditing(false);
      }
    } catch (err) {
      console.error("Failed to update customer:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !user || !name) return;
    setIsSavingNote(true);
    try {
      const token = await user.getIdToken();
      const res = await ingestMemory(
        `/note ${name} - ${newNote.trim()}`,
        'knowledge',
        { source: 'manual_customer_note', author: user.uid, createdAt: Date.now() },
        'fact',
        'personal',
        user.uid,
        token
      );
      
      if (res.node) {
        setAppointments(prev => [res.node, ...prev].sort((a: any, b: any) => b.createdAt - a.createdAt));
      }
      
      setNewNote('');
      setIsAddingNote(false);
    } catch (err) {
      console.error("Failed to add note:", err);
    } finally {
      setIsSavingNote(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[var(--color-paper)] w-full">
        <div className="w-8 h-8 rounded-full border-4 border-[var(--color-burnt-orange)] border-t-transparent animate-spin"></div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[var(--color-paper)] w-full">
        <User size={64} className="text-[var(--color-ink)]/20 mb-4" />
        <h2 className="text-2xl font-bold text-[var(--color-ink)]">Müşteri Bulunamadı</h2>
        <button onClick={() => router.back()} className="mt-6 text-[var(--color-burnt-orange)] hover:underline">Geri Dön</button>
      </div>
    );
  }

  const name = extractCustomerName(customer.content);
  const details = extractCustomerDetails(customer.content);
  const dateStr = new Date(customer.createdAt).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--color-paper)] overflow-y-auto w-full relative">
      <div className="max-w-5xl mx-auto w-full p-8 space-y-8">
        
        {/* Header */}
        <button onClick={() => router.back()} className="flex items-center gap-2 text-[var(--color-ink-light)] hover:text-[var(--color-ink)] transition-colors text-sm font-medium">
          <ArrowLeft size={16} /> Müşterilere Dön
        </button>

        <div className="bg-white rounded-3xl p-8 border border-[var(--color-ink)]/5 shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-[var(--color-burnt-orange)]/10 text-[var(--color-burnt-orange)] flex items-center justify-center text-4xl font-bold">
              {name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              {isEditing ? (
                <input 
                  type="text" 
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="text-3xl font-bold text-[var(--color-ink)] mb-2 bg-[var(--color-ink)]/5 border-2 border-[var(--color-burnt-orange)] rounded-lg px-3 py-1 w-full outline-none"
                  autoFocus
                />
              ) : (
                <h1 className="text-3xl font-bold text-[var(--color-ink)] mb-2">{name}</h1>
              )}
              <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--color-ink-light)]">
                <span className="flex items-center gap-1.5"><CalendarIcon size={16} /> Kayıt: {dateStr}</span>
                <span className="flex items-center gap-1.5"><Briefcase size={16} /> Müşteri</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button className="p-3 bg-[var(--color-ink)]/5 hover:bg-[var(--color-ink)]/10 text-[var(--color-ink)] rounded-xl transition-colors">
                <Phone size={20} />
              </button>
              <button className="p-3 bg-[var(--color-ink)]/5 hover:bg-[var(--color-ink)]/10 text-[var(--color-ink)] rounded-xl transition-colors">
                <Mail size={20} />
              </button>
              
              {isEditing ? (
                <div className="flex gap-2">
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-3 bg-[var(--color-ink)]/10 text-[var(--color-ink)] font-medium rounded-xl hover:bg-[var(--color-ink)]/20 transition-colors shadow-sm"
                  >
                    <X size={20} />
                  </button>
                  <button 
                    onClick={handleSaveEdit}
                    disabled={isSaving}
                    className="px-6 py-3 bg-[var(--color-burnt-orange)] text-white font-medium rounded-xl hover:bg-orange-600 transition-colors shadow-sm flex items-center gap-2"
                  >
                    <Check size={20} /> {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="px-6 py-3 bg-[var(--color-burnt-orange)] text-white font-medium rounded-xl hover:bg-orange-600 transition-colors shadow-sm"
                >
                  Düzenle
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content Tabs / Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Left Column: Details */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-[var(--color-ink)]/5 shadow-sm relative group">
              {!isEditing && (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="absolute top-4 right-4 p-2 bg-[var(--color-ink)]/5 text-[var(--color-ink-light)] hover:text-[var(--color-burnt-orange)] hover:bg-[var(--color-burnt-orange)]/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Edit2 size={16} />
                </button>
              )}
              <h3 className="font-semibold text-[var(--color-ink)] mb-4 text-lg">Müşteri Bilgileri</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-[var(--color-ink-light)] uppercase tracking-wider block mb-2">Ek Bilgiler & Notlar</label>
                  {isEditing ? (
                    <textarea 
                      value={editDetails}
                      onChange={e => setEditDetails(e.target.value)}
                      className="w-full min-h-[120px] bg-[var(--color-ink)]/5 border-2 border-[var(--color-burnt-orange)] rounded-xl p-3 outline-none text-sm text-[var(--color-ink)] resize-none"
                      placeholder="Not ekleyin..."
                    />
                  ) : (
                    <p className="text-sm text-[var(--color-ink)] whitespace-pre-wrap">{details}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Activity / History */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-[var(--color-ink)]/5 shadow-sm min-h-[400px]">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-[var(--color-ink)] text-lg">Geçmiş ve Etkileşimler</h3>
                <button 
                  onClick={() => setIsAddingNote(!isAddingNote)}
                  className="text-sm font-medium text-[var(--color-burnt-orange)] hover:underline"
                >
                  {isAddingNote ? 'İptal' : '+ Not Ekle'}
                </button>
              </div>

              {isAddingNote && (
                <div className="mb-8 bg-[var(--color-ink)]/5 p-4 rounded-2xl border border-[var(--color-ink)]/10 animate-in fade-in duration-200">
                  <textarea 
                    value={newNote}
                    onChange={e => setNewNote(e.target.value)}
                    placeholder={`${name} ile ilgili yeni bir etkileşim veya not yazın...`}
                    className="w-full bg-white border border-[var(--color-ink)]/10 rounded-xl p-3 text-sm focus:outline-none focus:border-[var(--color-burnt-orange)] min-h-[100px] resize-none mb-3 text-[var(--color-ink)]"
                  />
                  <div className="flex justify-end">
                    <button 
                      onClick={handleAddNote}
                      disabled={!newNote.trim() || isSavingNote}
                      className="px-4 py-2 bg-[var(--color-burnt-orange)] text-white text-sm font-medium rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors flex items-center gap-2"
                    >
                      {isSavingNote ? 'Ekleniyor...' : <><Check size={16} /> Notu Kaydet</>}
                    </button>
                  </div>
                </div>
              )}
              
              <div className="space-y-6">
                
                {/* Dinamik Randevu Etkileşimleri */}
                {appointments.map(app => {
                  const isCancel = app.content.includes('/cancel_appointment');
                  const isNote = app.content.includes('/note');
                  
                  if (isNote) {
                    const noteMatch = app.content.match(/\/(?:note|not)\s+[^-]+-\s*(.*)/i);
                    const noteText = noteMatch ? noteMatch[1].trim() : app.content;
                    const noteDate = new Date(app.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
                    const noteTime = new Date(app.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
                    
                    return (
                      <div key={app.id} className="relative pl-6 border-l-2 border-[var(--color-ink)]/10 pb-4">
                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-500 border-4 border-white"></div>
                        <div className="text-xs font-semibold text-[var(--color-ink-light)] mb-1">{noteDate} - {noteTime}</div>
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-[var(--color-ink)]">
                          <div className="font-medium flex items-center gap-2 mb-2 text-blue-600">
                            <FileText size={14}/> Etkileşim Notu
                          </div>
                          <p className="whitespace-pre-wrap">{noteText}</p>
                        </div>
                      </div>
                    );
                  }
                  const titleMatch = app.content.match(/- Konu:\s*(.*?)(?=\s+- Zaman:|$)/i);
                  const title = titleMatch ? titleMatch[1].trim() : (isCancel ? 'İptal Edilen Randevu' : 'Randevu');
                  const timeMatch = app.content.match(/- Zaman:\s*(.*?)(?=\s+- Tekrar:|\s+- Meet:|$)/i);
                  const timeStr = timeMatch ? timeMatch[1].trim() : '';
                  const meetMatch = app.content.match(/- Meet:\s*(.*?)(?=\s+- Tekrar:|$)/i);
                  const meetLink = meetMatch ? meetMatch[1].trim() : '';
                  const appDate = new Date(app.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });

                  return (
                    <div key={app.id} className="relative pl-6 border-l-2 border-[var(--color-ink)]/10 pb-4">
                      <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-4 border-white ${isCancel ? 'bg-red-500' : 'bg-[var(--color-burnt-orange)]'}`}></div>
                      <div className="text-xs font-semibold text-[var(--color-ink-light)] mb-1">{appDate}</div>
                      <div className={`${isCancel ? 'bg-red-50 border-red-100' : 'bg-[var(--color-burnt-orange)]/5 border-[var(--color-burnt-orange)]/10'} border rounded-xl p-4 text-sm text-[var(--color-ink)]`}>
                        <div className={`font-medium flex items-center gap-2 mb-1 ${isCancel ? 'text-red-500' : 'text-[var(--color-burnt-orange)]'}`}>
                          <CalendarIcon size={14}/> {isCancel ? 'Randevu İptal Edildi / Silindi' : 'Yeni Randevu Oluşturuldu'}
                        </div>
                        <p className="font-semibold">{title}</p>
                        {timeStr && <p className="text-[var(--color-ink-light)] text-xs mt-1">Planlanan Zaman: {new Date(timeStr).toLocaleString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>}
                        {!isCancel && meetLink && (
                          <a href={meetLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 mt-3 text-sm font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 transition-colors">
                             Google Meet'e Katıl
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Müşteri Kaydı (Sabit İlk Etkileşim) */}
                <div className="relative pl-6 border-l-2 border-[var(--color-ink)]/10 pb-4">
                  <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-[var(--color-ink)]/20 border-4 border-white"></div>
                  <div className="text-xs font-semibold text-[var(--color-ink-light)] mb-1">{dateStr}</div>
                  <div className="bg-[var(--color-ink)]/5 rounded-xl p-4 text-sm text-[var(--color-ink)]">
                    <div className="font-medium flex items-center gap-2 mb-1"><User size={14}/> Müşteri Kaydı Oluşturuldu</div>
                    Müşteri sisteme eklendi.
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
