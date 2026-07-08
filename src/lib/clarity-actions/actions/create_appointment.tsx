import { SchemaType } from '@google/generative-ai';
import { ClarityAction, ActionExecutionContext } from '../types';
import React from 'react';
import { fetchWithGoogleAuth } from '@/lib/google-api';

export const CreateAppointmentAction: ClarityAction = {
  name: 'create_appointment',
  description: 'Create a new appointment/meeting with a customer. Always use this tool if the user wants to schedule an appointment or meeting.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      customer: { type: SchemaType.STRING, description: 'The name of the customer.' },
      title: { type: SchemaType.STRING, description: 'The title or topic of the appointment.' },
      start: { type: SchemaType.STRING, description: 'The start date and time (ISO 8601 string local time).' },
      createMeet: { type: SchemaType.BOOLEAN, description: 'Whether to create a Google Meet link.' }
    },
    required: ['customer', 'title', 'start']
  },
  buttonText: 'Randevuyu Oluştur',
  
  renderUI: (payload: any) => (
    <>
      <span className="font-medium text-[var(--color-ink)]">{payload.customer}</span> ile <span className="font-medium text-[var(--color-ink)]">{new Date(payload.start).toLocaleString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span> zamanında <span className="font-medium text-[var(--color-ink)]">"{payload.title}"</span> randevusu oluşturulacak. 
      {payload.createMeet && " 🎥 Google Meet eklenecek."}
    </>
  ),

  execute: async (payload: any, context: ActionExecutionContext) => {
    try {
      let finalContent = `/appointment ${payload.customer} - Konu: ${payload.title}`;
      finalContent += ` - Zaman: ${new Date(payload.start).toISOString()}`;
      
      let actionResultText = `Randevu atandı.`;
      
      const googleToken = localStorage.getItem('google_access_token');
      if (googleToken) {
        try {
          const googleRes = await fetchWithGoogleAuth('/api/calendar/events', {
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
          const googleData = await googleRes.json();
          if (googleData.success && googleData.hangoutLink) {
             finalContent += ` - Meet: ${googleData.hangoutLink}`;
             actionResultText += `\n- Google Meet etkinliği eklendi ve takvimle senkronize edildi.`;
          }
        } catch (err) {
          console.error("Google Sync Error:", err);
        }
      }

      // We need to import ingestMemory dynamically or pass it via context if we run into cyclic dependencies. 
      // Let's import it directly here.
      const { ingestMemory } = await import('@/lib/saule-core-client');

      const res = await ingestMemory(
        finalContent,
        'action',
        { source: 'search_bar_auto', author: context.user.uid, createdAt: Date.now() },
        'fact',
        'personal',
        context.user.uid,
        context.token
      );
      
      await ingestMemory(
        `[ORIGINAL_QUERY] ${context.currentQuery}\n[SYNTHESIS] Randevu veritabanında işlem yapıldı.\n[ACTION_RESULT] ${actionResultText}`,
        'knowledge',
        { source: 'search_bar_auto', author: context.user.uid, createdAt: Date.now() },
        'fact',
        'personal',
        context.user.uid,
        context.token
      );

      return { success: true, message: actionResultText, data: { id: res.node?.id || res.id } };
    } catch (error: any) {
      console.error(error);
      return { success: false, message: 'Randevu oluşturulurken hata oluştu.' };
    }
  }
};
