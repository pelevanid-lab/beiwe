'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, Mail, Phone, MapPin, Calendar as CalendarIcon, FileText, Briefcase, Edit2, Check, X, MessageCircle, Send } from 'lucide-react';

const InstagramIcon = ({ size = 14, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
);
import { useAuth } from '@/components/AuthProvider';
import { useRouter, usePathname } from 'next/navigation';
import { ingestMemory } from '@/lib/saule-core-client';

export default function CustomerDetailClient({ dict, id }: { dict: any, id: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [customer, setCustomer] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDetails, setEditDetails] = useState('');
  const [editType, setEditType] = useState('Lead');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editInstagram, setEditInstagram] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const extractPhone = (content: string) => {
    const explicitMatch = content.match(/- Telefon:\s*(.*?)(?=\s+- |$)/i);
    if (explicitMatch && explicitMatch[1].trim()) return explicitMatch[1].trim();

    const phoneMatch = content.match(/[\+]?[0-9\s\-\.()]{10,20}/);
    if (phoneMatch && phoneMatch[0].replace(/[^0-9]/g, '').length >= 10) return phoneMatch[0].trim();
    return null;
  };

  const extractEmail = (content: string) => {
    const explicitMatch = content.match(/- E-posta:\s*(.*?)(?=\s+- |$)/i);
    if (explicitMatch && explicitMatch[1].trim()) {
      let email = explicitMatch[1].trim();
      return email.replace(/\[AT\]/g, '@').replace(/\[DOT\]/g, '.');
    }

    const emailMatch = content.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    return emailMatch ? emailMatch[0] : null;
  };

  const extractInstagram = (content: string) => {
    const m = content.match(/- Instagram:\s*@?([^\s-]+)/i);
    return m ? m[1].trim() : null;
  };

  // Note states
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [editingOldNoteId, setEditingOldNoteId] = useState<string | null>(null);

  // Appointment states
  const [isAddingAppointment, setIsAddingAppointment] = useState(false);
  const [appointmentTitle, setAppointmentTitle] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [createMeet, setCreateMeet] = useState(false);
  const [isSavingAppointment, setIsSavingAppointment] = useState(false);
  const [editingOldAppointment, setEditingOldAppointment] = useState<{title: string, timeStr: string} | null>(null);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  useEffect(() => {
    const fetchCustomer = async () => {
      if (!user) return;
      try {
        const apiUrl = process.env.NEXT_PUBLIC_SAULE_API_URL || 'https://us-central1-saule-core.cloudfunctions.net/api';
        const res = await fetch(`${apiUrl}/api/smi/nodes?t=${Date.now()}`, { cache: 'no-store' });
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

          if (targetNode.content.includes('- Tip:')) {
            const typeMatch = targetNode.content.match(/- Tip:\s*([^-]+)/i);
            if (typeMatch) {
              setEditType(typeMatch[1].trim());
            } else {
              setEditType('-');
            }
          } else {
            setEditType('-');
          }

          if (targetNode.content.includes('- Ek Bilgi:')) {
            setEditDetails(targetNode.content.split('- Ek Bilgi:')[1].trim());
          } else {
            setEditDetails('');
          }

          setEditPhone(extractPhone(targetNode.content) || '');
          setEditEmail(extractEmail(targetNode.content) || '');
          setEditInstagram(extractInstagram(targetNode.content) || '');

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
    return match ? match[1].trim() : dict.customers.unknown_customer;
  };

  const extractCustomerDetails = (content: string) => {
    if (content.includes('- Ek Bilgi:')) {
      return content.split('- Ek Bilgi:')[1].trim();
    }
    return dict.customers.not_specified;
  };

  const extractCustomerType = (content: string) => {
    if (content.includes('- Tip:')) {
      const match = content.match(/- Tip:\s*([^-]+)/i);
      return match ? match[1].trim() : '-';
    }
    return '-';
  };

  const formatLocalizedDate = (timestamp: number) => {
    const currentLocale = pathname.split('/')[1] || 'tr';
    const langMap: any = {
      'tr': 'tr-TR',
      'en': 'en-US',
      'ru': 'ru-RU',
      'uk': 'uk-UA'
    };
    return new Intl.DateTimeFormat(langMap[currentLocale] || 'tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(timestamp));
  };

  const handlePhoneClick = () => {
    if (!customer) return;
    const phone = extractPhone(customer.content);
    if (phone) {
      window.location.href = `tel:${phone.replace(/\s+/g, '')}`;
    } else {
      alert(dict.customers.phone_not_found || "Telefon numarası bulunamadı.");
    }
  };

  const handleEmailClick = () => {
    if (!customer) return;
    const email = extractEmail(customer.content);
    if (email) {
      const name = extractCustomerName(customer.content);
      const currentLocale = pathname.split('/')[1] || 'tr';
      router.push(`/${currentLocale}/app/inbox?customer=${encodeURIComponent(name)}&platform=gmail&contact=${encodeURIComponent(email)}`);
    } else {
      alert(dict.customers.email_not_found || "E-posta adresi bulunamadı.");
    }
  };

  const handleWhatsappClick = () => {
    if (!customer) return;
    const phone = extractPhone(customer.content);
    if (phone) {
      const name = extractCustomerName(customer.content);
      const currentLocale = pathname.split('/')[1] || 'tr';
      router.push(`/${currentLocale}/app/inbox?customer=${encodeURIComponent(name)}&platform=whatsapp&contact=${encodeURIComponent(phone)}`);
    } else {
      alert("WhatsApp için geçerli bir telefon numarası bulunamadı.");
    }
  };

  const handleTelegramClick = () => {
    if (!customer) return;
    const phone = extractPhone(customer.content);
    if (phone) {
      let cleanStr = phone.replace(/[\s\-\.()]/g, '');
      if (cleanStr.startsWith('00')) {
        cleanStr = '+' + cleanStr.substring(2);
      } else if (cleanStr.startsWith('0')) {
        cleanStr = '+90' + cleanStr.substring(1);
      } else if (!cleanStr.startsWith('+') && !cleanStr.startsWith('90')) {
        cleanStr = '+90' + cleanStr;
      } else if (!cleanStr.startsWith('+') && cleanStr.startsWith('90')) {
        cleanStr = '+' + cleanStr;
      }
      window.open(`https://t.me/${cleanStr}`, '_blank');
    } else {
      alert("Telegram için geçerli bir telefon numarası bulunamadı.");
    }
  };

  const handleDeleteCustomer = async () => {
    if (!user) return;
    setIsDeleting(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_SAULE_API_URL || 'https://us-central1-saule-core.cloudfunctions.net/api';
      const token = await user.getIdToken();
      const res = await fetch(`${apiUrl}/api/smi/nodes/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!res.ok) {
        throw new Error('Failed to delete');
      }
      
      const locale = pathname.split('/')[1] || 'tr';
      router.replace(`/${locale}/app/customers`);
    } catch (err) {
      console.error("Failed to delete customer:", err);
      alert(dict.customers.delete_error);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editName.trim() || !user || !customer) return;
    setIsSaving(true);
    try {
      const token = await user.getIdToken();
      let newContent = `/customer ${editName.trim()}`;
      if (editType && editType !== '-') {
        newContent += ` - Tip: ${editType}`;
      }
      if (editPhone.trim()) {
        newContent += ` - Telefon: ${editPhone.trim()}`;
      }
      if (editEmail.trim()) {
        const safeEmail = editEmail.trim().replace(/@/g, '[AT]').replace(/\./g, '[DOT]');
        newContent += ` - E-posta: ${safeEmail}`;
      }
      if (editInstagram.trim()) {
        newContent += ` - Instagram: @${editInstagram.trim().replace(/^@/, '')}`;
      }
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
        const locale = pathname.split('/')[1] || 'tr';
        // Navigate to new ID silently
        router.replace(`/${locale}/app/customers/${res.node.id}`);
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
      
      // If editing, "delete" the old note first via append-log
      if (editingOldNoteId) {
        await ingestMemory(
          `/delete_note ${name} - ID:${editingOldNoteId}`,
          'action', { source: 'manual_edit', author: user.uid, createdAt: Date.now() }, 'task', 'personal', user.uid, token
        );
      }

      const res = await ingestMemory(
        `/note ${name} - ${newNote.trim()}`,
        'knowledge',
        { source: 'manual_customer_note', author: user.uid, createdAt: Date.now() },
        'fact',
        'personal',
        user.uid,
        token
      );
      
      // Just manually update the UI to avoid full reload
      setAppointments((prev: any[]) => {
        let newList = prev;
        if (editingOldNoteId) {
           newList = [...newList, { id: `del-${Date.now()}`, content: `/delete_note ${name} - ID:${editingOldNoteId}`, createdAt: Date.now() }];
        }
        return [
          {
            id: res.node?.id || Date.now().toString(),
            content: `/note ${name} - ${newNote.trim()}`,
            createdAt: Date.now(),
          },
          ...newList
        ].sort((a, b) => b.createdAt - a.createdAt);
      });
      
      setNewNote('');
      setEditingOldNoteId(null);
      setIsAddingNote(false);
    } catch (err) {
      console.error("Failed to add note:", err);
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleEditNoteClick = (noteText: string, noteId: string) => {
    setNewNote(noteText);
    setEditingOldNoteId(noteId);
    setIsAddingNote(true);
    setIsAddingAppointment(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!user) return;
    
    try {
      const token = await user.getIdToken();
      const finalContent = `/delete_note ${name} - ID:${noteId}`;
      const res = await ingestMemory(
        finalContent,
        'action',
        { source: 'manual_delete', author: user.uid, createdAt: Date.now() },
        'task',
        'personal',
        user.uid,
        token
      );
      
      setAppointments((prev: any[]) => [
        {
          id: res.node?.id || Date.now().toString(),
          content: finalContent,
          createdAt: Date.now(),
        },
        ...prev
      ].sort((a, b) => b.createdAt - a.createdAt));
      
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddAppointment = async () => {
    if (!appointmentTitle.trim() || !appointmentDate.trim() || !user || !customer) return;
    setIsSavingAppointment(true);
    try {
      const token = await user.getIdToken();
      let finalContent = `/appointment ${name} - Konu: ${appointmentTitle.trim()} - Zaman: ${appointmentDate.trim()}`;
      
      const googleToken = localStorage.getItem('google_access_token');
      
      // If editing, cancel the old one first
      if (editingOldAppointment && editingOldAppointment.timeStr) {
        if (googleToken) {
          try {
            await fetch('/api/calendar/events', {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                token: googleToken,
                title: `${name} - ${editingOldAppointment.title}`,
                start: new Date(editingOldAppointment.timeStr).toISOString()
              })
            });
          } catch (e) {}
        }
        await ingestMemory(
          `/cancel_appointment ${name} - Zaman: ${new Date(editingOldAppointment.timeStr).toISOString()}`,
          'action', { source: 'manual_edit', author: user.uid, createdAt: Date.now() }, 'task', 'personal', user.uid, token
        );
      }

      if (googleToken) {
        try {
          const googleRes = await fetch('/api/calendar/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              token: googleToken,
              appointment: {
                title: appointmentTitle.trim(),
                customer: name,
                start: new Date(appointmentDate).toISOString(),
                end: new Date(new Date(appointmentDate).getTime() + 60*60*1000).toISOString(),
                createMeet: createMeet,
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
              }
            })
          });
          const googleData = await googleRes.json();
          if (googleData.success && googleData.hangoutLink) {
             finalContent += ` - Meet: ${googleData.hangoutLink}`;
          }
        } catch (e) { console.error(e); }
      }

      const res = await ingestMemory(
        finalContent,
        'action',
        { source: 'manual_customer_appointment', author: user.uid, createdAt: Date.now() },
        'task',
        'personal',
        user.uid,
        token
      );
      
      setAppointments((prev: any[]) => [
        {
          id: res.node?.id || Date.now().toString(),
          content: finalContent,
          createdAt: Date.now(),
        },
        ...prev
      ].sort((a, b) => b.createdAt - a.createdAt));
      
      setAppointmentTitle('');
      setAppointmentDate('');
      setEditingOldAppointment(null);
      setIsAddingAppointment(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingAppointment(false);
    }
  };

  const handleEditAppointmentClick = (title: string, timeStr: string) => {
    setAppointmentTitle(title);
    if (timeStr) {
      const d = new Date(timeStr);
      const tzOffset = d.getTimezoneOffset() * 60000;
      const localISOTime = (new Date(d.getTime() - tzOffset)).toISOString().slice(0, 16);
      setAppointmentDate(localISOTime);
    }
    setEditingOldAppointment({title, timeStr});
    setIsAddingAppointment(true);
    setIsAddingNote(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteAppointment = async (title: string, timeStr: string) => {
    if (!user) return;
    
    try {
      const googleToken = localStorage.getItem('google_access_token');
      if (googleToken && timeStr) {
        try {
          await fetch('/api/calendar/events', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              token: googleToken,
              title: `${name} - ${title}`,
              start: new Date(timeStr).toISOString()
            })
          });
        } catch (e) {}
      }

      const token = await user.getIdToken();
      const finalContent = `/cancel_appointment ${name} - Zaman: ${timeStr ? new Date(timeStr).toISOString() : ''}`;
      const res = await ingestMemory(
        finalContent,
        'action',
        { source: 'manual_delete', author: user.uid, createdAt: Date.now() },
        'task',
        'personal',
        user.uid,
        token
      );
      
      setAppointments((prev: any[]) => [
        {
          id: res.node?.id || Date.now().toString(),
          content: finalContent,
          createdAt: Date.now(),
        },
        ...prev
      ].sort((a, b) => b.createdAt - a.createdAt));
      
    } catch (e) {
      console.error(e);
    }
  };

  const promptDeleteNote = (noteId: string) => {
    setConfirmModal({
      isOpen: true,
      title: dict.customers.delete || 'Sil',
      message: dict.customers.delete_confirm || "Bu notu silmek istediğinize emin misiniz?",
      onConfirm: () => {
        handleDeleteNote(noteId);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const promptDeleteAppointment = (title: string, timeStr: string) => {
    setConfirmModal({
      isOpen: true,
      title: dict.customers.delete || 'İptal Et',
      message: dict.appointments?.delete_confirm || "Bu randevuyu iptal etmek istediğinize emin misiniz?",
      onConfirm: () => {
        handleDeleteAppointment(title, timeStr);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const getInitials = (n: string) => {
    return n.split(' ').map(part => part[0]).join('').substring(0, 2).toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[var(--color-paper)] w-full">
        <div className="w-8 h-8 rounded-full border-4 border-[var(--color-burnt-orange)] border-t-transparent animate-spin"></div>
      </div>
    );
  }

  if (!customer) {
    if (id === 'pending') {
      return (
        <div className="flex-1 flex flex-col items-center justify-center bg-[var(--color-paper)] w-full h-full min-h-[400px]">
          <div className="w-16 h-16 rounded-full bg-[var(--color-burnt-orange)]/10 text-[var(--color-burnt-orange)] flex items-center justify-center mb-6 animate-pulse">
            <User size={32} />
          </div>
          <h2 className="text-2xl font-bold text-[var(--color-ink)] mb-2">Müşteri Taslağı</h2>
          <p className="text-[var(--color-ink-light)] text-center max-w-md">
            Müşteri kaydı hazırlanıyor... Lütfen işlemi onaylayın, onayladığınız anda detaylar burada belirecektir.
          </p>
        </div>
      );
    }
    
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[var(--color-paper)] w-full min-h-[400px]">
        <User size={64} className="text-[var(--color-ink)]/20 mb-4" />
        <h2 className="text-2xl font-bold text-[var(--color-ink)]">{dict.customers.not_found}</h2>
        <button onClick={() => router.back()} className="mt-6 text-[var(--color-burnt-orange)] hover:underline">{dict.customers.back_to_customers}</button>
      </div>
    );
  }

  const name = extractCustomerName(customer.content);
  const details = extractCustomerDetails(customer.content);
  const type = extractCustomerType(customer.content);
  const dateStr = new Date(customer.createdAt).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--color-paper)] overflow-y-auto w-full relative">
      <div className="max-w-5xl mx-auto w-full p-8 space-y-8">
        
        {/* Header */}
        <button onClick={() => router.back()} className="flex items-center gap-2 text-[var(--color-ink-light)] hover:text-[var(--color-ink)] transition-colors text-sm font-medium">
          <ArrowLeft size={16} /> {dict.customers.back_to_customers}
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
                <div className="flex items-center gap-2">
                  <CalendarIcon size={14} className="text-[var(--color-ink-light)]" />
                  <span className="text-[var(--color-ink-light)]">{dict.customers.registered_at || 'Kayıt:'} {formatLocalizedDate(customer.createdAt)}</span>
                </div>
                {isEditing ? (
                  <div className="flex items-center gap-2 bg-[var(--color-ink)]/5 px-3 py-1.5 rounded-lg border border-[var(--color-ink)]/10">
                    <span className="text-xs font-semibold uppercase tracking-wider">Tip:</span>
                    <select 
                      value={editType} 
                      onChange={e => setEditType(e.target.value)}
                      className="bg-transparent border-none outline-none text-[var(--color-ink)] text-sm font-medium focus:ring-0 cursor-pointer p-0"
                    >
                      <option value="-">{dict.customers.select}</option>
                      <option value="Lead">Lead</option>
                      <option value="Consumer">Consumer</option>
                    </select>
                  </div>
                ) : (
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${type === 'Lead' ? 'bg-blue-100 text-blue-800' : type === 'Consumer' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {type}
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={handlePhoneClick}
                className="p-3 bg-[var(--color-ink)]/5 hover:bg-[var(--color-ink)]/10 text-[var(--color-ink)] rounded-xl transition-colors"
                title="Ara"
              >
                <Phone size={20} />
              </button>
              <button 
                onClick={handleEmailClick}
                className="p-3 bg-[var(--color-ink)]/5 hover:bg-[var(--color-ink)]/10 text-[var(--color-ink)] rounded-xl transition-colors"
                title="E-posta Gönder"
              >
                <Mail size={20} />
              </button>
              <button 
                onClick={handleWhatsappClick}
                className="p-3 bg-[var(--color-ink)]/5 hover:bg-[var(--color-ink)]/10 text-green-600 rounded-xl transition-colors"
                title="WhatsApp"
              >
                <MessageCircle size={20} />
              </button>
              <button 
                onClick={handleTelegramClick}
                className="p-3 bg-[var(--color-ink)]/5 hover:bg-[var(--color-ink)]/10 text-blue-500 rounded-xl transition-colors"
                title="Telegram"
              >
                <Send size={20} />
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
                    <Check size={20} /> {isSaving ? dict.customers.saving : dict.customers.save}
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button 
                    onClick={() => setShowDeleteModal(true)}
                    className="px-6 py-3 bg-red-50 text-red-600 font-medium rounded-xl hover:bg-red-100 transition-colors shadow-sm"
                  >
                    {dict.customers.delete}
                  </button>
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="px-6 py-3 bg-[var(--color-burnt-orange)] text-white font-medium rounded-xl hover:bg-orange-600 transition-colors shadow-sm"
                  >
                    {dict.customers.editing}
                  </button>
                </div>
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
              <h3 className="font-semibold text-[var(--color-ink)] mb-4 text-lg">{dict.customers.customer_info}</h3>
              <div className="space-y-4">
                {isEditing ? (
                  <div className="mb-4">
                    <label className="text-xs font-semibold text-[var(--color-ink-light)] uppercase tracking-wider block mb-1">{dict.customers.phone || 'Telefon'}</label>
                    <input 
                      type="text"
                      value={editPhone}
                      onChange={e => setEditPhone(e.target.value)}
                      className="w-full bg-[var(--color-ink)]/5 border-2 border-[var(--color-burnt-orange)] rounded-xl p-2 outline-none text-sm text-[var(--color-ink)]"
                      placeholder={dict.customers.phone_placeholder || 'Örn: 0555 123 45 67 veya +44...'}
                    />
                  </div>
                ) : (
                  extractPhone(customer.content) && (
                    <div>
                      <label className="text-xs font-semibold text-[var(--color-ink-light)] uppercase tracking-wider block mb-1">{dict.customers.phone || 'Telefon'}</label>
                      <a href={`tel:${extractPhone(customer.content)?.replace(/\s+/g, '')}`} className="text-sm font-medium text-[var(--color-ink)] hover:text-[var(--color-burnt-orange)] flex items-center gap-2 transition-colors">
                        <Phone size={14} className="text-[var(--color-ink-light)]" />
                        {extractPhone(customer.content)}
                      </a>
                    </div>
                  )
                )}

                {isEditing ? (
                  <div className="mb-4">
                    <label className="text-xs font-semibold text-[var(--color-ink-light)] uppercase tracking-wider block mb-1">{dict.customers.email || 'E-posta'}</label>
                    <input 
                      type="email"
                      value={editEmail}
                      onChange={e => setEditEmail(e.target.value)}
                      className="w-full bg-[var(--color-ink)]/5 border-2 border-[var(--color-burnt-orange)] rounded-xl p-2 outline-none text-sm text-[var(--color-ink)]"
                      placeholder={dict.customers.email_placeholder || 'Örn: test@test.com'}
                    />
                  </div>
                ) : (
                  extractEmail(customer.content) && (
                    <div>
                      <label className="text-xs font-semibold text-[var(--color-ink-light)] uppercase tracking-wider block mb-1">{dict.customers.email || 'E-posta'}</label>
                      <a href={`mailto:${extractEmail(customer.content)}`} className="text-sm font-medium text-[var(--color-ink)] hover:text-[var(--color-burnt-orange)] flex items-center gap-2 transition-colors">
                        <Mail size={14} className="text-[var(--color-ink-light)]" />
                        {extractEmail(customer.content)}
                      </a>
                    </div>
                  )
                )}

                {isEditing ? (
                  <div className="mb-4">
                    <label className="text-xs font-semibold text-[var(--color-ink-light)] uppercase tracking-wider block mb-1">Instagram</label>
                    <div className="flex items-center gap-1 bg-[var(--color-ink)]/5 border-2 border-[var(--color-burnt-orange)] rounded-xl px-2">
                      <span className="text-sm text-[var(--color-ink-light)]">@</span>
                      <input 
                        type="text"
                        value={editInstagram.replace(/^@/, '')}
                        onChange={e => setEditInstagram(e.target.value)}
                        className="flex-1 bg-transparent p-2 outline-none text-sm text-[var(--color-ink)]"
                        placeholder="kullanici_adi"
                      />
                    </div>
                  </div>
                ) : (
                  extractInstagram(customer.content) && (
                    <div>
                      <label className="text-xs font-semibold text-[var(--color-ink-light)] uppercase tracking-wider block mb-1">Instagram</label>
                      <a
                        href={`https://instagram.com/${extractInstagram(customer.content)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-[var(--color-ink)] hover:text-pink-500 flex items-center gap-2 transition-colors"
                      >
                        <InstagramIcon size={14} className="text-pink-400" />
                        @{extractInstagram(customer.content)}
                      </a>
                    </div>
                  )
                )}

                <div className={extractPhone(customer.content) || extractEmail(customer.content) || extractInstagram(customer.content) || isEditing ? "pt-4 border-t border-[var(--color-ink)]/5" : ""}>
                  <label className="text-xs font-semibold text-[var(--color-ink-light)] uppercase tracking-wider block mb-2">{dict.customers.notes_and_details}</label>
                  {isEditing ? (
                    <textarea 
                      value={editDetails}
                      onChange={e => setEditDetails(e.target.value)}
                      className="w-full min-h-[120px] bg-[var(--color-ink)]/5 border-2 border-[var(--color-burnt-orange)] rounded-xl p-3 outline-none text-sm text-[var(--color-ink)] resize-none"
                      placeholder={dict.customers.edit_note_placeholder}
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
                <h3 className="font-semibold text-[var(--color-ink)] text-lg">{dict.customers.history_and_interactions}</h3>
                <div className="flex gap-4">
                  <button 
                    onClick={() => { 
                      setIsAddingAppointment(!isAddingAppointment); 
                      setIsAddingNote(false); 
                      if (isAddingAppointment) setEditingOldAppointment(null);
                    }}
                    className="text-sm font-medium text-[var(--color-burnt-orange)] hover:underline"
                  >
                    {isAddingAppointment ? dict.customers.cancel : `+ ${dict.appointments.add_new || 'Randevu Ekle'}`}
                  </button>
                  <button 
                    onClick={() => { 
                      setIsAddingNote(!isAddingNote); 
                      setIsAddingAppointment(false); 
                      if (isAddingNote) setEditingOldNoteId(null);
                    }}
                    className="text-sm font-medium text-[var(--color-burnt-orange)] hover:underline"
                  >
                    {isAddingNote ? dict.customers.cancel : '+ Etkileşim Notu'}
                  </button>
                </div>
              </div>

              {isAddingNote && (
                <div className="mb-8 bg-[var(--color-ink)]/5 p-4 rounded-2xl border border-[var(--color-ink)]/10 animate-in fade-in duration-200">
                  <textarea 
                    value={newNote}
                    onChange={e => setNewNote(e.target.value)}
                    placeholder={dict.customers.write_note_placeholder.replace('{name}', name)}
                    className="w-full bg-white border border-[var(--color-ink)]/10 rounded-xl p-3 text-sm focus:outline-none focus:border-[var(--color-burnt-orange)] min-h-[100px] resize-none mb-3 text-[var(--color-ink)]"
                  />
                  <div className="flex justify-end">
                    <button 
                      onClick={handleAddNote}
                      disabled={!newNote.trim() || isSavingNote}
                      className="px-4 py-2 bg-[var(--color-burnt-orange)] text-white text-sm font-medium rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors flex items-center gap-2"
                    >
                      {isSavingNote ? dict.customers.adding : <><Check size={16} /> {dict.customers.save_note}</>}
                    </button>
                  </div>
                </div>
              )}

              {isAddingAppointment && (
                <div className="mb-8 bg-[var(--color-ink)]/5 p-4 rounded-2xl border border-[var(--color-ink)]/10 animate-in fade-in duration-200 space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-[var(--color-ink-light)] uppercase tracking-wider block mb-1">Randevu Başlığı</label>
                    <input 
                      type="text"
                      value={appointmentTitle}
                      onChange={e => setAppointmentTitle(e.target.value)}
                      placeholder="Örn. Toplantı, Bakım vb."
                      className="w-full bg-white border border-[var(--color-ink)]/10 rounded-xl p-2 text-sm focus:outline-none focus:border-[var(--color-burnt-orange)] text-[var(--color-ink)]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[var(--color-ink-light)] uppercase tracking-wider block mb-1">Tarih & Saat</label>
                    <input 
                      type="datetime-local"
                      value={appointmentDate}
                      onChange={e => setAppointmentDate(e.target.value)}
                      className="w-full bg-white border border-[var(--color-ink)]/10 rounded-xl p-2 text-sm focus:outline-none focus:border-[var(--color-burnt-orange)] text-[var(--color-ink)]"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <input 
                      type="checkbox" 
                      id="createMeetCustomer" 
                      checked={createMeet} 
                      onChange={(e) => setCreateMeet(e.target.checked)}
                      className="w-4 h-4 text-[var(--color-burnt-orange)] bg-white border-gray-300 rounded focus:ring-[var(--color-burnt-orange)]"
                    />
                    <label htmlFor="createMeetCustomer" className="text-sm text-[var(--color-ink)] cursor-pointer">
                      Google Meet linki oluştur
                    </label>
                  </div>
                  <div className="flex justify-end pt-2">
                    <button 
                      onClick={handleAddAppointment}
                      disabled={!appointmentTitle.trim() || !appointmentDate.trim() || isSavingAppointment}
                      className="px-4 py-2 bg-[var(--color-burnt-orange)] text-white text-sm font-medium rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors flex items-center gap-2"
                    >
                      {isSavingAppointment ? dict.customers.adding : <><Check size={16} /> {dict.customers.save}</>}
                    </button>
                  </div>
                </div>
              )}
              
              <div className="space-y-6">
                
                {/* Dinamik Etkileşimler */}
                {(() => {
                  const deletedNoteIds = appointments
                    .filter(a => a.content.includes('/delete_note'))
                    .map(a => {
                       const match = a.content.match(/ID:(.*)/);
                       return match ? match[1].trim() : '';
                    });

                  return appointments.map(app => {
                    const isCancel = app.content.includes('/cancel_appointment');
                    const isNote = app.content.includes('/note');
                    
                    if (app.content.includes('/delete_note') || deletedNoteIds.includes(app.id)) {
                      return null; // hide completely
                    }
                    
                    if (isNote) {
                      const noteMatch = app.content.match(/\/(?:note|not)\s+[^-]+-\s*(.*)/i);
                      const noteText = noteMatch ? noteMatch[1].trim() : app.content;
                      const noteDate = formatLocalizedDate(app.createdAt);
                      const noteTime = new Date(app.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
                      
                      return (
                        <div key={app.id} className="relative pl-6 border-l-2 border-[var(--color-ink)]/10 pb-4 group">
                          <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-500 border-4 border-white"></div>
                          <div className="text-xs font-semibold text-[var(--color-ink-light)] mb-1">{noteDate} - {noteTime}</div>
                          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-[var(--color-ink)] relative">
                            <div className="font-medium flex items-center gap-2 mb-2 text-blue-600">
                              <FileText size={14}/> {dict.customers.interaction_note}
                            </div>
                            
                            {(() => {
                              // If it looks like a chat archive (e.g. [Ben] or [Müşteri]), render it as bubbles
                              if (noteText.includes('[Ben]') || noteText.includes('[Müşteri]') || (noteText.includes('[') && noteText.includes(']'))) {
                                const lines = noteText.split('\n').filter((l: string) => l.trim() !== '');
                                const isChat = lines.some((l: string) => l.trim().startsWith('['));
                                
                                if (isChat) {
                                  // extract header part vs chat part
                                  const headerLines: string[] = [];
                                  const chatLines: string[] = [];
                                  
                                  lines.forEach((line: string) => {
                                    if (line.trim().startsWith('[')) chatLines.push(line);
                                    else headerLines.push(line);
                                  });
                                  
                                  return (
                                    <div className="space-y-4 mt-3">
                                      {headerLines.length > 0 && (
                                        <p className="text-sm font-semibold text-[var(--color-ink)] opacity-80 mb-2 whitespace-pre-wrap">{headerLines.join('\n')}</p>
                                      )}
                                      <div className="flex flex-col gap-2">
                                        {chatLines.map((line: string, i: number) => {
                                          const match = line.match(/^\[(.*?)\]\s*(.*)$/);
                                          if (match) {
                                            const isMe = match[1].toLowerCase() === 'ben' || match[1].toLowerCase() === 'me';
                                            const senderName = match[1];
                                            const text = match[2];
                                            
                                            return (
                                              <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${isMe ? 'bg-[var(--color-burnt-orange)] text-white rounded-tr-sm' : 'bg-white border border-[var(--color-ink)]/10 text-[var(--color-ink)] rounded-tl-sm shadow-sm'}`}>
                                                  {!isMe && <div className="text-[10px] font-bold opacity-60 mb-0.5">{senderName}</div>}
                                                  {text}
                                                </div>
                                              </div>
                                            );
                                          }
                                          // Fallback line
                                          return <div key={i} className="text-sm">{line}</div>;
                                        })}
                                      </div>
                                    </div>
                                  );
                                }
                              }
                              
                              // Fallback for regular text notes
                              return <p className="whitespace-pre-wrap">{noteText}</p>;
                            })()}
                            
                            <div className="flex items-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => handleEditNoteClick(noteText, app.id)}
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-700 bg-white px-2 py-1 rounded-md shadow-sm border border-gray-200 transition-colors"
                              >
                                <Edit2 size={12}/> {dict.customers.editing || 'Düzenle'}
                              </button>
                              <button 
                                onClick={() => promptDeleteNote(app.id)}
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 bg-white px-2 py-1 rounded-md shadow-sm border border-red-100 transition-colors"
                              >
                                <X size={12}/> {dict.customers.delete || 'Sil'}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    }
                  const titleMatch = app.content.match(/- Konu:\s*(.*?)(?=\s+- Zaman:|$)/i);
                  const title = titleMatch ? titleMatch[1].trim() : (isCancel ? dict.appointments.cancelled_appointment : dict.appointments.appointment);
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
                          <CalendarIcon size={14}/> {isCancel ? dict.appointments.cancelled_desc : dict.appointments.created_desc}
                        </div>
                        <p className="font-semibold">{title}</p>
                        {timeStr && <p className="text-[var(--color-ink-light)] text-xs mt-1">{dict.appointments.planned_time}: {new Date(timeStr).toLocaleString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>}
                        {!isCancel && (
                          <div className="flex items-center gap-3 mt-3">
                            {meetLink && (
                              <a href={meetLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 transition-colors">
                                 {dict.appointments.join_meet || 'Toplantıya Katıl'}
                              </a>
                            )}
                            <button 
                              onClick={() => handleEditAppointmentClick(title, timeStr)}
                              className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-gray-700 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 transition-colors"
                            >
                              <Edit2 size={14}/> {dict.customers.editing || 'Düzenle'}
                            </button>
                            <button 
                              onClick={() => promptDeleteAppointment(title, timeStr)}
                              className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-600 hover:text-red-700 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100 transition-colors"
                            >
                              <X size={14}/> {dict.customers.delete || 'İptal Et'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                });
                })()}

                {/* Müşteri Kaydı (Sabit İlk Etkileşim) */}
                <div className="relative pl-6 border-l-2 border-[var(--color-ink)]/10 pb-4">
                  <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-[var(--color-ink)]/20 border-4 border-white"></div>
                  <div className="text-xs font-semibold text-[var(--color-ink-light)] mb-1">{dateStr}</div>
                  <div className="bg-[var(--color-ink)]/5 rounded-xl p-4 text-sm text-[var(--color-ink)]">
                    <div className="font-medium flex items-center gap-2 mb-1"><User size={14}/> {dict.customers.customer_registered_title}</div>
                    {dict.customers.customer_registered_desc}
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[var(--color-paper)] rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200 border border-[var(--color-ink)]/10">
            <h3 className="text-xl font-bold text-[var(--color-ink)] mb-3">{dict.customers.delete}</h3>
            <p className="text-[var(--color-ink-light)] mb-8 leading-relaxed">
              {dict.customers.delete_confirm}
            </p>
            <div className="flex items-center justify-end gap-3">
              <button 
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="px-5 py-2.5 bg-[var(--color-ink)]/5 text-[var(--color-ink)] font-medium rounded-xl hover:bg-[var(--color-ink)]/10 transition-colors disabled:opacity-50"
              >
                {dict.customers.cancel}
              </button>
              <button 
                onClick={handleDeleteCustomer}
                disabled={isDeleting}
                className="px-5 py-2.5 bg-red-500 text-white font-medium rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isDeleting ? dict.customers.deleting : dict.customers.delete}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generic Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[var(--color-paper)] rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200 border border-[var(--color-ink)]/10">
            <h3 className="text-xl font-bold text-[var(--color-ink)] mb-3">{confirmModal.title}</h3>
            <p className="text-[var(--color-ink-light)] mb-8 leading-relaxed">
              {confirmModal.message}
            </p>
            <div className="flex items-center justify-end gap-3">
              <button 
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="px-5 py-2.5 bg-[var(--color-ink)]/5 text-[var(--color-ink)] font-medium rounded-xl hover:bg-[var(--color-ink)]/10 transition-colors"
              >
                {dict.customers.cancel || 'İptal'}
              </button>
              <button 
                onClick={confirmModal.onConfirm}
                className="px-5 py-2.5 bg-red-500 text-white font-medium rounded-xl hover:bg-red-600 transition-colors flex items-center gap-2"
              >
                {dict.customers.delete || 'Sil'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
