import { SchemaType } from '@google/generative-ai';
import { ClarityAction, ActionExecutionContext } from '../types';
import React from 'react';
import { deleteNode, ingestMemory } from '@/lib/saule-core-client';

export const DeleteNoteAction: ClarityAction = {
  name: 'delete_note',
  description: 'Delete a specific note from the system using its ID. Use this ONLY when the user explicitly wants to delete a note AND you have identified the note ID from the context memory.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      noteId: { type: SchemaType.STRING, description: 'The unique ID of the note to be deleted.' },
      summary: { type: SchemaType.STRING, description: 'A short summary of the note being deleted (for the UI).' }
    },
    required: ['noteId', 'summary']
  },
  buttonText: 'Notu Sil',
  
  renderUI: (payload: any) => (
    <>
      Şu not sistemden silinecek: <span className="font-medium italic">"{payload.summary}"</span>
      <div className="text-xs text-[var(--color-ink)]/50 mt-1 font-mono">ID: {payload.noteId}</div>
    </>
  ),

  execute: async (payload: any, context: ActionExecutionContext) => {
    try {
      await deleteNode(payload.noteId, context.token);
      
      await ingestMemory(
        `[ORIGINAL_QUERY] ${context.currentQuery}\n[SYNTHESIS] Müşteri notu silindi.\n[ACTION_RESULT] "${payload.summary}" başarıyla silindi.`,
        'knowledge',
        { source: 'search_bar_auto', author: context.user.uid, createdAt: Date.now() },
        'fact',
        'personal',
        context.user.uid,
        context.token
      );

      return { success: true, message: 'Not başarıyla silindi.' };
    } catch (error: any) {
      console.error(error);
      return { success: false, message: 'Not silinirken hata oluştu.' };
    }
  }
};
