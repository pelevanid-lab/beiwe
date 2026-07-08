import { SchemaType } from '@google/generative-ai';
import { ClarityAction, ActionExecutionContext } from '../types';
import React from 'react';
import { ingestMemory } from '@/lib/saule-core-client';

export const AddNoteAction: ClarityAction = {
  name: 'add_note',
  description: 'Add a note or log an interaction to an existing customer record. Always use this tool if the user wants to add a note.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      customer: { type: SchemaType.STRING, description: 'The name of the customer.' },
      note: { type: SchemaType.STRING, description: 'The content of the note.' }
    },
    required: ['customer', 'note']
  },
  buttonText: 'Notu Ekle',
  
  renderUI: (payload: any) => (
    <>
      <span className="font-medium text-[var(--color-ink)]">{payload.customer}</span> isimli müşteriye şu not eklenecek: <span className="italic">"{payload.note}"</span>
    </>
  ),

  execute: async (payload: any, context: ActionExecutionContext) => {
    try {
      await ingestMemory(
        `/note Müşteri: ${payload.customer} - ${payload.note}`,
        'action',
        { source: 'search_bar_auto', author: context.user.uid, createdAt: Date.now() },
        'fact',
        'personal',
        context.user.uid,
        context.token
      );
      
      await ingestMemory(
        `[ORIGINAL_QUERY] ${context.currentQuery}\n[SYNTHESIS] Müşteriye not eklendi.\n[ACTION_RESULT] Not başarıyla eklendi.`,
        'knowledge',
        { source: 'search_bar_auto', author: context.user.uid, createdAt: Date.now() },
        'fact',
        'personal',
        context.user.uid,
        context.token
      );

      return { success: true, message: 'Not başarıyla eklendi.' };
    } catch (error: any) {
      console.error(error);
      return { success: false, message: 'Not eklenirken hata oluştu.' };
    }
  }
};
