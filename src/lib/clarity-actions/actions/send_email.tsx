import { SchemaType } from '@google/generative-ai';
import { ClarityAction, ActionExecutionContext } from '../types';
import React from 'react';
import { fetchWithGoogleAuth } from '@/lib/google-api';

export const SendEmailAction: ClarityAction = {
  name: 'send_email',
  description: 'Send an email directly from the assistant. Use this tool when the user wants to send an email to a contact.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      to: { type: SchemaType.STRING, description: 'The email address of the recipient.' },
      subject: { type: SchemaType.STRING, description: 'The subject of the email.' },
      text: { type: SchemaType.STRING, description: 'The body/content of the email.' }
    },
    required: ['to', 'subject', 'text']
  },
  buttonText: 'E-postayı Gönder',
  
  renderUI: (payload: any) => (
    <div className="flex flex-col gap-2">
      <div className="text-sm">
        <span className="font-semibold text-[var(--color-ink)]">Kime:</span> {payload.to}
      </div>
      <div className="text-sm">
        <span className="font-semibold text-[var(--color-ink)]">Konu:</span> {payload.subject}
      </div>
      <div className="text-sm mt-2 p-3 bg-white rounded-xl border border-[var(--color-ink)]/10 whitespace-pre-wrap">
        {payload.text}
      </div>
    </div>
  ),

  execute: async (payload: any, context: ActionExecutionContext) => {
    try {
      const res = await fetchWithGoogleAuth('/api/gmail/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: payload.to,
          subject: payload.subject,
          text: payload.text
        })
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, message: `E-posta gönderilemedi: ${data.error || 'Bilinmeyen hata'}` };
      }

      const { ingestMemory } = await import('@/lib/saule-core-client');
      
      const actionResultText = `E-posta başarıyla gönderildi (Kime: ${payload.to}).`;
      
      await ingestMemory(
        `[ORIGINAL_QUERY] ${context.currentQuery}\n[SYNTHESIS] Asistan üzerinden e-posta gönderildi.\n[ACTION_RESULT] ${actionResultText}`,
        'knowledge',
        { source: 'search_bar_auto', author: context.user.uid, createdAt: Date.now() },
        'fact',
        'personal',
        context.user.uid,
        context.token
      );

      return { success: true, message: actionResultText };
    } catch (error: any) {
      console.error('Send Email Action Error:', error);
      return { success: false, message: 'E-posta gönderilirken bir hata oluştu.' };
    }
  }
};
