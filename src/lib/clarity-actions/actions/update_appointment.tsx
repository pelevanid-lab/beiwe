import { SchemaType } from '@google/generative-ai';
import { ClarityAction, ActionExecutionContext } from '../types';
import React from 'react';
import { fetchWithGoogleAuth } from '@/lib/google-api';

export const UpdateAppointmentAction: ClarityAction = {
  name: 'update_appointment',
  description: 'Update an existing appointment. Always use this tool if the user wants to change the time of a meeting.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      customer: { type: SchemaType.STRING },
      title: { type: SchemaType.STRING },
      oldStart: { type: SchemaType.STRING },
      start: { type: SchemaType.STRING },
      createMeet: { type: SchemaType.BOOLEAN }
    },
    required: ['customer', 'title', 'oldStart', 'start']
  },
  buttonText: 'Randevuyu Güncelle',
  
  renderUI: (payload: any) => (
    <>
      <span className="font-medium text-[var(--color-ink)]">{payload.customer}</span> isimli müşterinin randevusu <span className="font-medium text-[var(--color-ink)]">{new Date(payload.start).toLocaleString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span> zamanına güncellenecek.
    </>
  ),

  execute: async (payload: any, context: ActionExecutionContext) => {
    try {
      let finalContent = `/appointment ${payload.customer} - Konu: ${payload.title}`;
      finalContent += ` - Zaman: ${new Date(payload.start).toISOString()}`;
      
      const googleToken = localStorage.getItem('google_access_token');
      if (googleToken && payload.oldStart) {
        try {
          await fetch('/api/calendar/events', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              token: googleToken,
              eventId: `apt_${new Date(payload.oldStart).getTime()}`
            })
          });
          
          await fetchWithGoogleAuth('/api/calendar/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              token: googleToken,
              appointment: {
                title: payload.title,
                customer: payload.customer,
                start: payload.start,
                end: new Date(new Date(payload.start).getTime() + 60*60*1000).toISOString(),
                recurrence: 'none',
                createMeet: payload.createMeet || false,
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
              }
            })
          });
        } catch (err) {
          console.error("Google Sync Update Error:", err);
        }
      }

      const { ingestMemory } = await import('@/lib/saule-core-client');
      
      await ingestMemory(
        finalContent,
        'action',
        { source: 'search_bar_auto', author: context.user.uid, createdAt: Date.now() },
        'fact',
        'personal',
        context.user.uid,
        context.token
      );
      
      await ingestMemory(
        `[ORIGINAL_QUERY] ${context.currentQuery}\n[SYNTHESIS] Randevu veritabanında güncellendi.\n[ACTION_RESULT] Randevu başarıyla güncellendi.`,
        'knowledge',
        { source: 'search_bar_auto', author: context.user.uid, createdAt: Date.now() },
        'fact',
        'personal',
        context.user.uid,
        context.token
      );

      return { success: true, message: 'Randevu başarıyla güncellendi.' };
    } catch (error: any) {
      console.error(error);
      return { success: false, message: 'Randevu güncellenirken hata oluştu.' };
    }
  }
};
