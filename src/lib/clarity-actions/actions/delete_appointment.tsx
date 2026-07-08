import { SchemaType } from '@google/generative-ai';
import { ClarityAction, ActionExecutionContext } from '../types';
import React from 'react';

export const DeleteAppointmentAction: ClarityAction = {
  name: 'delete_appointment',
  description: 'Delete or cancel an existing appointment. Always use this tool if the user wants to cancel a meeting.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      customer: { type: SchemaType.STRING },
      title: { type: SchemaType.STRING },
      oldStart: { type: SchemaType.STRING }
    },
    required: ['customer', 'title', 'oldStart']
  },
  buttonText: 'Randevuyu İptal Et',
  
  renderUI: (payload: any) => (
    <>
      <span className="font-medium text-[var(--color-ink)]">{payload.customer}</span> isimli müşterinin randevusu tamamen <strong>iptal edilecek</strong>.
    </>
  ),

  execute: async (payload: any, context: ActionExecutionContext) => {
    try {
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
        } catch (err) {
          console.error("Google Sync Delete Error:", err);
        }
      }

      const { ingestMemory } = await import('@/lib/saule-core-client');
      
      await ingestMemory(
        `İptal Edilen Randevu: ${payload.customer} - ${payload.title} (${new Date(payload.oldStart).toISOString()})`,
        'action',
        { source: 'search_bar_auto', author: context.user.uid, createdAt: Date.now() },
        'fact',
        'personal',
        context.user.uid,
        context.token
      );
      
      await ingestMemory(
        `[ORIGINAL_QUERY] ${context.currentQuery}\n[SYNTHESIS] Randevu iptal edildi.\n[ACTION_RESULT] Randevu başarıyla silindi.`,
        'knowledge',
        { source: 'search_bar_auto', author: context.user.uid, createdAt: Date.now() },
        'fact',
        'personal',
        context.user.uid,
        context.token
      );

      return { success: true, message: 'Randevu başarıyla iptal edildi.' };
    } catch (error: any) {
      console.error(error);
      return { success: false, message: 'Randevu iptal edilirken hata oluştu.' };
    }
  }
};
