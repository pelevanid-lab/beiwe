'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Calendar as CalendarIcon, Search, Plus, Clock, CalendarPlus, User, X } from 'lucide-react';
import { fetchWithGoogleAuth } from '@/lib/google-api';
import { ingestMemory } from '@/lib/saule-core-client';
import { setClarityContext } from '@/lib/clarity-context';
import { Calendar, momentLocalizer, View, Views } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'moment/locale/tr';
import 'moment/locale/ru';
import 'moment/locale/uk';

const localizer = momentLocalizer(moment);

export default function AppointmentsClient({ dict }: { dict: any }) {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  
  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customersList, setCustomersList] = useState<string[]>([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [createMeet, setCreateMeet] = useState(false);
  const [recurrence, setRecurrence] = useState('none');

  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, event: any}>({ isOpen: false, event: null });

  // Calendar Control States
  const [currentView, setCurrentView] = useState<View>(Views.MONTH);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  useEffect(() => {
    // Set moment locale based on dictionary
    if (dict.appointments.calendar_today === "Today") {
      moment.locale('en');
    } else if (dict.appointments.calendar_today === "Сегодня") {
      moment.locale('ru');
    } else if (dict.appointments.calendar_today === "Сьогодні") {
      moment.locale('uk');
    } else {
      moment.locale('tr');
    }
  }, [dict]);

  const fetchAppointments = async () => {
    if (!user) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_SAULE_API_URL || 'https://us-central1-saule-core.cloudfunctions.net/api';
      const res = await fetch(`${apiUrl}/api/smi/nodes`);
      if (!res.ok) throw new Error('Failed to fetch');
      
      const data = await res.json();
      const allNodes = data.nodes || [];
      
      const cancelNodes = allNodes.filter((n: any) => 
        n.spaceId === user.uid && 
        n.content.includes('/cancel_appointment ')
      );
      
      const cancelledIdentifiers = cancelNodes.map((n: any) => {
        // format: /cancel_appointment Faruk - Zaman: 2026-07-15T07:00:00.000Z
        const match = n.content.match(/\/cancel_appointment\s+(.*?)\s+- Zaman:\s*(.*?)$/i);
        if (match) {
           return `${match[1].trim()}_${match[2].trim()}`;
        }
        return '';
      }).filter((s: string) => s !== '');

      const userAppointments = allNodes.filter((n: any) => 
        n.spaceId === user.uid && 
        (n.content.includes('/appointment ') || n.content.includes('/randevu '))
      ).filter((n: any) => {
        // extract customer and time
        const customerMatch = n.content.match(/\/(?:appointment|randevu)\s+(.*?)\s+- Konu:/i);
        const timeMatch = n.content.match(/- Zaman:\s*(.*?)(?=\s+- Tekrar:|\s+- Meet:|$)/i);
        
        if (customerMatch && timeMatch) {
           const identifier = `${customerMatch[1].trim()}_${timeMatch[1].trim()}`;
           if (cancelledIdentifiers.includes(identifier)) return false; // Filter out cancelled ones
        } else if (timeMatch) {
           // fallback if old format
           const identifier = timeMatch[1].trim();
           if (cancelledIdentifiers.some((c: string) => c.endsWith(`_${identifier}`))) return false;
        }
        return true;
      }).sort((a: any, b: any) => b.createdAt - a.createdAt);

      // Müşterileri de aynı kaynaktan çekip listeye alalım
      const userCustomers = allNodes.filter((n: any) => 
        n.spaceId === user.uid && 
        (n.content.includes('/customer ') || n.content.includes('/müşteri '))
      );
      const extractedCustomers = userCustomers.map((c: any) => {
        const match = c.content.match(/\/(?:customer|müşteri)\s+([^-]+)/i);
        return match ? match[1].trim() : '';
      }).filter((name: string) => name !== '');
      setCustomersList(Array.from(new Set(extractedCustomers)));
      
      setAppointments(userAppointments);

      // Parse into events
      const parsedEvents = userAppointments.map((a: any) => {
        let title = 'Bilinmeyen Randevu';
        let customer = '';
        let rec = 'none';

        // Check new format: /appointment Müşteri - Konu: Başlık - Zaman: ...
        if (a.content.includes('- Konu:')) {
          const match = a.content.match(/\/(?:appointment|randevu)\s+(.*?)\s+- Konu:/i);
          customer = match ? match[1].trim() : '';
          
          const titleMatch = a.content.match(/- Konu:\s*(.*?)(?=\s+- Zaman:|$)/i);
          title = titleMatch ? titleMatch[1].trim() : '';

          const recMatch = a.content.match(/- Tekrar:\s*(.*?)$/i);
          if (recMatch) rec = recMatch[1].trim();
        } else {
           // Old format fallback
           const match = a.content.match(/\/(?:appointment|randevu)\s+([^-]+)/i);
           title = match ? match[1].trim() : dict.appointments.unknown_appointment;
        }
        
        let start = new Date(a.createdAt);
        let end = new Date(a.createdAt + 60 * 60 * 1000); // 1 hour default
        let meetLink = '';

        if (a.content.includes('- Meet:')) {
          const meetMatch = a.content.match(/- Meet:\s*(.*?)(?=\s+- Tekrar:|$)/i);
          if (meetMatch) meetLink = meetMatch[1].trim();
        }

        if (a.content.includes('- Zaman:')) {
          const timeMatch = a.content.match(/- Zaman:\s*(.*?)(?=\s+- Tekrar:|\s+- Meet:|$)/i);
          const dateStr = timeMatch ? timeMatch[1].trim() : a.content.split('- Zaman:')[1].trim();
          
          // Try to parse the dateStr
          let parsed = new Date(dateStr);
          if (isNaN(parsed.getTime())) {
            // Try parsing old format: DD.MM.YYYY HH:mm:ss
            const parts = dateStr.split(/[\s.]+/);
            if (parts.length >= 3) {
              const day = parseInt(parts[0], 10);
              const month = parseInt(parts[1], 10) - 1;
              const year = parseInt(parts[2], 10);
              const timeParts = parts[3] ? parts[3].split(':') : [0, 0, 0];
              const hours = parseInt(timeParts[0], 10) || 0;
              const minutes = parseInt(timeParts[1], 10) || 0;
              parsed = new Date(year, month, day, hours, minutes);
            }
          }
          if (!isNaN(parsed.getTime())) {
             start = parsed;
             end = new Date(parsed.getTime() + 60 * 60 * 1000);
          }
        }
        
        return {
          id: a.id,
          title,
          customer,
          recurrence: rec,
          meetLink,
          start,
          end,
          resource: a,
          isGoogle: false
        };
      });

      // Try to fetch Google Calendar Events
      const googleToken = localStorage.getItem('google_access_token');
      if (googleToken) {
        try {
          const googleRes = await fetchWithGoogleAuth('/api/calendar/events');
          const googleData = await googleRes.json();
          if (googleData.success && googleData.events) {
            const googleEvents = googleData.events.map((ge: any) => ({
              id: ge.id,
              title: ge.summary || dict.appointments.calendar_google_event,
              customer: 'Google Calendar',
              recurrence: 'none',
              meetLink: ge.hangoutLink || '',
              start: new Date(ge.start.dateTime || ge.start.date),
              end: new Date(ge.end.dateTime || ge.end.date),
              resource: ge,
              isGoogle: true
            })).filter((ge: any) => {
              // DEDUPLICATION: Avoid showing the same event twice if it came from Beiwe
              // Check if a local event has the exact same start time (within 1 minute)
              return !parsedEvents.some((pe: any) => 
                Math.abs(pe.start.getTime() - ge.start.getTime()) < 60000
              );
            });
            parsedEvents.push(...googleEvents);
          }
        } catch (e) {
          console.error("Failed to fetch Google Calendar events:", e);
        }
      }
      
      setEvents(parsedEvents);
      
      // Clarity Engine'e randevu listesini bildir
      const now = new Date();
      const upcoming = parsedEvents.filter((e: any) => e.start >= now);
      setClarityContext({
        module: 'appointments',
        title: 'Randevu Takvimi',
        data: {
          appointments: parsedEvents.map((e: any) => ({
            id: e.id,
            title: e.title,
            start: e.start?.toISOString(),
            customer: e.customer
          })),
          totalCount: parsedEvents.length,
          upcomingCount: upcoming.length
        }
      });

    } catch (err) {
      console.error("Failed to fetch appointments:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [user]);

  const handleDeleteEvent = async (eventToDelete: any) => {
    if (!user || !eventToDelete) return;
    
    setIsLoading(true);
    try {
      const googleToken = localStorage.getItem('google_access_token');
      
      if (googleToken) {
        try {
          await fetch('/api/calendar/events', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              token: googleToken,
              title: eventToDelete.customer && eventToDelete.customer !== dict.customers.unknown_customer 
                     ? `${eventToDelete.customer} - ${eventToDelete.title}`
                     : eventToDelete.title || dict.appointments.beiwe_appointment,
              start: eventToDelete.start.toISOString()
            })
          });
        } catch (err) {
          console.error("Google Calendar Delete Error:", err);
        }
      }

      const token = await user.getIdToken();
      await ingestMemory(
        `/cancel_appointment ${eventToDelete.customer} - Zaman: ${eventToDelete.start.toISOString()}`,
        'action',
        { source: 'manual_delete', author: user.uid, createdAt: Date.now() },
        'task',
        'personal',
        user.uid,
        token
      );
      
      setSelectedEvent(null);
      await fetchAppointments();
    } catch (error) {
      console.error("Failed to delete appointment", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !user) return;
    
    setIsLoading(true);
    try {
      const customerStr = customerName.trim() ? customerName.trim() : dict.customers.unknown_customer;
      let finalContent = `/appointment ${customerStr} - Konu: ${newTitle.trim()}`;
      
      let parsedDate = new Date();
      if (newDate.trim()) {
        finalContent += ` - Zaman: ${newDate.trim()}`;
        parsedDate = new Date(newDate.trim());
      }
      if (recurrence !== 'none') {
        finalContent += ` - Tekrar: ${recurrence}`;
      }

      // Google Calendar Two-Way Sync Notification (Wait for it so we can grab Meet link)
      const googleToken = localStorage.getItem('google_access_token');
      
      if (editingEvent) {
         if (googleToken) {
           try {
             await fetch('/api/calendar/events', {
               method: 'DELETE',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({
                 token: googleToken,
                 title: editingEvent.customer && editingEvent.customer !== dict.customers.unknown_customer 
                        ? `${editingEvent.customer} - ${editingEvent.title}`
                        : editingEvent.title || 'Beiwe Appointment',
                 start: editingEvent.start.toISOString()
               })
             });
           } catch (e) {}
         }
         
         const token = await user.getIdToken();
         await ingestMemory(
           `/cancel_appointment ${editingEvent.customer} - Zaman: ${editingEvent.start.toISOString()}`,
           'action',
           { source: 'manual_edit', author: user.uid, createdAt: Date.now() },
           'task',
           'personal',
           user.uid,
           token
         );
      }

      if (googleToken) {
        try {
          const googleRes = await fetchWithGoogleAuth('/api/calendar/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              token: googleToken,
              appointment: {
                title: newTitle.trim(),
                customer: customerName.trim(),
                start: parsedDate.toISOString(),
                end: new Date(parsedDate.getTime() + 60*60*1000).toISOString(),
                recurrence,
                createMeet,
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
              }
            })
          });
          const googleData = await googleRes.json();
          if (googleData.success && googleData.hangoutLink) {
             finalContent += ` - Meet: ${googleData.hangoutLink}`;
          }
        } catch (err) {
          console.error("Google Sync API Error:", err);
        }
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

      // Yeni müşteri ise arka planda sessizce Müşteriler listesine de ekle
      if (customerStr !== dict.customers.unknown_customer && !customersList.includes(customerStr)) {
        await ingestMemory(
          `/customer ${customerStr}`,
          'action',
          { source: 'appointments_page_auto', author: user.uid, createdAt: Date.now() },
          'fact',
          'personal',
          user.uid,
          token
        );
      }
      
      setShowAddModal(false);
      setNewTitle('');
      setNewDate('');
      setCustomerName('');
      setCreateMeet(false);
      setRecurrence('none');
      setEditingEvent(null);
      await fetchAppointments();
    } catch (err) {
      console.error("Failed to add appointment:", err);
      setIsLoading(false);
    }
  };

  const handleSelectSlot = ({ start }: { start: Date }) => {
    const defaultStart = new Date(start);
    defaultStart.setHours(9, 0, 0, 0); // Varsayılan sabah 09:00

    const offset = defaultStart.getTimezoneOffset();
    const localDate = new Date(defaultStart.getTime() - (offset * 60 * 1000));
    
    setNewDate(localDate.toISOString().slice(0, 16));
    setNewTitle('');
    setCustomerName('');
    setCreateMeet(false);
    setRecurrence('none');
    setShowAddModal(true);
  };

  const EventComponent = ({ event }: any) => {
    return (
      <div className="p-0.5 flex flex-col h-full overflow-hidden leading-tight">
        <span className="font-bold text-xs truncate">
          {event.isGoogle ? 'G ' : ''}{event.title}
        </span>
        {event.customer && <span className="text-[10px] opacity-90 truncate mt-0.5">👤 {event.customer}</span>}
        {event.recurrence && event.recurrence !== 'none' && (
           <span className="text-[10px] opacity-75 truncate mt-0.5">🔁 {event.recurrence}</span>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--color-paper)] p-8 overflow-y-auto w-full relative">
      <div className="max-w-7xl mx-auto w-full space-y-8 h-full flex flex-col">
        
        <header className="flex flex-col gap-2 shrink-0">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[var(--color-burnt-orange)]/10 rounded-xl text-[var(--color-burnt-orange)]">
                <CalendarIcon size={24} />
              </div>
              <h1 className="text-3xl font-bold text-[var(--color-ink)] tracking-tight">{dict.appointments.title}</h1>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => window.location.href = '/api/auth/google/connect'}
                className="flex items-center gap-2 bg-white border-2 border-blue-200 text-blue-700 px-5 py-2.5 rounded-xl font-bold hover:bg-blue-50 transition-colors shadow-sm"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4 4 0 0 0-4-4 4 4 0 0 0-4 4v4"/><path d="M12 14v-4"/><path d="M8 10h8"/><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/></svg>
                <span>Google Takvim Bağla</span>
              </button>
              <button 
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 bg-[var(--color-burnt-orange)] text-white px-5 py-2.5 rounded-xl font-medium hover:bg-orange-600 transition-colors shadow-sm"
              >
                <Plus size={18} />
                <span>{dict.appointments.add_new}</span>
              </button>
            </div>
          </div>
          <p className="text-[var(--color-ink-light)] text-lg">
            {dict.appointments.subtitle}
          </p>
        </header>

        {/* Calendar View */}
        <div className="flex-1 bg-white rounded-3xl p-6 border border-[var(--color-ink)]/5 shadow-sm min-h-[600px]">
          {isLoading ? (
             <div className="w-full h-full bg-[var(--color-ink)]/5 animate-pulse rounded-2xl" />
          ) : (
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              selectable={true}
              onSelectSlot={handleSelectSlot}
              onSelectEvent={(event: any) => setSelectedEvent(event)}
              view={currentView}
              onView={(view: any) => setCurrentView(view)}
              date={currentDate}
              onNavigate={(date: any) => setCurrentDate(date)}
              views={['month', 'week', 'day', 'agenda']}
              components={{
                event: EventComponent
              }}
              style={{ height: '100%' }}
              messages={{
                next: dict.appointments.calendar_next,
                previous: dict.appointments.calendar_prev,
                today: dict.appointments.calendar_today,
                month: dict.appointments.calendar_month,
                week: dict.appointments.calendar_week,
                day: dict.appointments.calendar_day,
                agenda: dict.appointments.calendar_agenda
              }}
              eventPropGetter={(event: any) => {
                return {
                  style: {
                    backgroundColor: event.isGoogle ? '#4285F4' : 'var(--color-burnt-orange)',
                    borderRadius: '6px',
                    opacity: 0.95,
                    color: 'white',
                    border: 'none',
                    display: 'block'
                  }
                };
              }}
            />
          )}
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-[var(--color-ink)]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--color-paper)] rounded-3xl p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 fade-in duration-200">
            <h2 className="text-2xl font-bold text-[var(--color-ink)] mb-6">{dict.appointments.add_modal_title}</h2>
            <form onSubmit={handleAddAppointment} className="space-y-4">
              <div className="relative">
                <label className="block text-sm font-medium text-[var(--color-ink-light)] mb-1">{dict.appointments.customer_label}</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={e => {
                    setCustomerName(e.target.value);
                    setShowCustomerDropdown(true);
                  }}
                  onFocus={() => setShowCustomerDropdown(true)}
                  onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)}
                  className="w-full border-2 border-[var(--color-ink)]/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--color-burnt-orange)] text-[var(--color-ink)]"
                  placeholder={dict.appointments.customer_placeholder}
                />
                
                {/* Müşteri Combobox Dropdown */}
                {showCustomerDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-[var(--color-ink)]/10 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {customersList.filter(c => c.toLowerCase().includes(customerName.toLowerCase())).map((c, idx) => (
                      <div 
                        key={idx}
                        className="px-4 py-2 hover:bg-[var(--color-burnt-orange)]/10 cursor-pointer text-[var(--color-ink)]"
                        onClick={() => {
                          setCustomerName(c);
                          setShowCustomerDropdown(false);
                        }}
                      >
                        {c}
                      </div>
                    ))}
                    {customerName.trim() && !customersList.some(c => c.toLowerCase() === customerName.toLowerCase()) && (
                      <div 
                        className="px-4 py-3 bg-[var(--color-ink)]/5 cursor-pointer text-[var(--color-burnt-orange)] font-medium flex items-center gap-2 border-t border-[var(--color-ink)]/5"
                        onClick={() => setShowCustomerDropdown(false)}
                      >
                        <Plus size={16} />
                        {dict.appointments.add_as_new.replace('{name}', customerName)}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-ink-light)] mb-1">
                    {dict.appointments.title_label} <span className="text-[var(--color-burnt-orange)]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    className="w-full border-2 border-[var(--color-ink)]/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--color-burnt-orange)] text-[var(--color-ink)]"
                    placeholder={dict.appointments.title_placeholder}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-ink-light)] mb-1">
                    {dict.appointments.time_label} <span className="text-[var(--color-burnt-orange)]">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={newDate}
                    onChange={e => setNewDate(e.target.value)}
                    className="w-full border-2 border-[var(--color-ink)]/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--color-burnt-orange)] text-[var(--color-ink)]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-ink-light)] mb-1">{dict.appointments.recurrence_label}</label>
                <select
                  value={recurrence}
                  onChange={e => setRecurrence(e.target.value)}
                  className="w-full border-2 border-[var(--color-ink)]/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--color-burnt-orange)] text-[var(--color-ink)] bg-white"
                >
                  <option value="none">{dict.appointments.rec_none}</option>
                  <option value="Günlük">{dict.appointments.rec_daily}</option>
                  <option value="Gün Aşırı">{dict.appointments.rec_every_other_day}</option>
                  <option value="Haftalık">{dict.appointments.rec_weekly}</option>
                  <option value="Aylık">{dict.appointments.rec_monthly}</option>
                  <option value="Yıllık">{dict.appointments.rec_yearly}</option>
                </select>
              </div>

              {/* Google Meet Checkbox */}
              <div className="flex items-center gap-3 bg-[var(--color-ink)]/5 p-4 rounded-xl border border-[var(--color-ink)]/10">
                <input
                  type="checkbox"
                  id="createMeet"
                  checked={createMeet}
                  onChange={e => setCreateMeet(e.target.checked)}
                  className="w-5 h-5 text-[var(--color-burnt-orange)] rounded border-[var(--color-ink)]/20 focus:ring-[var(--color-burnt-orange)]"
                />
                <label htmlFor="createMeet" className="text-sm font-semibold text-[var(--color-ink)] cursor-pointer select-none">
                  {dict.appointments.create_meet_label}
                </label>
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingEvent(null);
                    setNewTitle('');
                    setCustomerName('');
                    setNewDate('');
                    setCreateMeet(false);
                  }}
                  className="px-5 py-2.5 rounded-xl font-medium text-[var(--color-ink)] hover:bg-[var(--color-ink)]/5 transition-colors"
                >
                  {dict.customers.cancel}
                </button>
                <button
                  type="submit"
                  disabled={!newTitle.trim()}
                  className="px-5 py-2.5 rounded-xl font-medium bg-[var(--color-burnt-orange)] text-white hover:bg-orange-600 transition-colors disabled:opacity-50"
                >
                  {dict.customers.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-[var(--color-ink)]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--color-paper)] rounded-3xl p-8 w-full max-w-sm shadow-2xl relative animate-in zoom-in-95 fade-in duration-200">
            <button 
              onClick={() => setSelectedEvent(null)}
              className="absolute top-4 right-4 p-2 bg-[var(--color-ink)]/5 rounded-full hover:bg-[var(--color-ink)]/10 transition-colors"
            >
              <X size={16} />
            </button>
            <div className="w-12 h-12 rounded-full bg-[var(--color-burnt-orange)]/10 text-[var(--color-burnt-orange)] flex items-center justify-center mb-6">
               <CalendarIcon size={24} />
            </div>
            <h2 className="text-xl font-bold text-[var(--color-ink)] mb-1 leading-tight">
              {selectedEvent.title}
            </h2>
            {selectedEvent.customer && selectedEvent.customer !== dict.customers.unknown_customer && (
              <p className="text-sm font-semibold text-[var(--color-ink-light)] mb-6 flex items-center gap-1.5">
                <User size={14} /> {selectedEvent.customer}
              </p>
            )}
            
            <div className="space-y-4">
              <div className="bg-white rounded-xl p-4 border border-[var(--color-ink)]/10 flex items-start gap-3 shadow-sm">
                 <Clock className="text-[var(--color-burnt-orange)] shrink-0 mt-0.5" size={18} />
                 <div>
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{dict.appointments.time_title}</p>
                   <p className="text-sm font-medium text-[var(--color-ink)]">{selectedEvent.start.toLocaleString(typeof navigator !== 'undefined' && navigator.language.includes('en') ? 'en-US' : 'tr-TR')}</p>
                 </div>
              </div>
              {selectedEvent.meetLink && (
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 shadow-sm flex flex-col gap-3">
                   <div className="flex items-center gap-2 text-blue-600 font-semibold text-sm">
                     <CalendarIcon size={18} /> {dict.appointments.meet_room}
                   </div>
                   <a 
                     href={selectedEvent.meetLink} 
                     target="_blank" 
                     rel="noopener noreferrer"
                     className="block w-full text-center py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                   >
                     {dict.appointments.join_meet}
                   </a>
                </div>
              )}
            </div>
            
            <div className="mt-6 pt-6 border-t border-[var(--color-ink)]/5 flex items-center justify-between">
               <button 
                 onClick={() => setConfirmModal({ isOpen: true, event: selectedEvent })}
                 className="px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
               >
                 {dict.appointments.delete}
               </button>
               <button 
                 onClick={() => {
                    setEditingEvent(selectedEvent);
                    setNewTitle(selectedEvent.title);
                    setCustomerName(selectedEvent.customer !== dict.customers.unknown_customer ? selectedEvent.customer : '');
                    setNewDate(moment(selectedEvent.start).format('YYYY-MM-DDTHH:mm'));
                    setRecurrence(selectedEvent.recurrence || 'none');
                    setCreateMeet(!!selectedEvent.meetLink);
                    setSelectedEvent(null);
                    setShowAddModal(true);
                 }}
                 className="px-4 py-2 text-sm font-medium text-[var(--color-burnt-orange)] hover:bg-[var(--color-burnt-orange)]/10 rounded-lg transition-colors flex items-center gap-2"
               >
                 {dict.customers.editing}
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[var(--color-paper)] rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200 border border-[var(--color-ink)]/10">
            <h3 className="text-xl font-bold text-[var(--color-ink)] mb-3">{dict.appointments.delete}</h3>
            <p className="text-[var(--color-ink-light)] mb-8 leading-relaxed">
              {dict.appointments.delete_confirm}
            </p>
            <div className="flex items-center justify-end gap-3">
              <button 
                onClick={() => setConfirmModal({ isOpen: false, event: null })}
                className="px-5 py-2.5 bg-[var(--color-ink)]/5 text-[var(--color-ink)] font-medium rounded-xl hover:bg-[var(--color-ink)]/10 transition-colors"
              >
                {dict.customers?.cancel || 'İptal'}
              </button>
              <button 
                onClick={() => {
                  handleDeleteEvent(confirmModal.event);
                  setConfirmModal({ isOpen: false, event: null });
                }}
                className="px-5 py-2.5 bg-red-500 text-white font-medium rounded-xl hover:bg-red-600 transition-colors flex items-center gap-2"
              >
                {dict.appointments.delete}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
