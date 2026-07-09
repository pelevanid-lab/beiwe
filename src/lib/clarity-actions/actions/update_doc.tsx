import { SchemaType } from '@google/generative-ai';
import { ClarityAction, ActionExecutionContext } from '../types';
import React from 'react';
import { db } from '@/lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

export const UpdateDocAction: ClarityAction = {
  name: 'update_doc',
  description: 'Update the content of an existing native document in Beiwe Docs. Use this for rewriting, summarizing, or appending text to a document.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      docId: { type: SchemaType.STRING, description: 'ID of the document to update' },
      title: { type: SchemaType.STRING, description: 'New title of the document (optional, pass original if unchanged)' },
      content: { type: SchemaType.STRING, description: 'New HTML or text content of the document' }
    },
    required: ['docId', 'content']
  },
  buttonText: 'Değişiklikleri Onayla ve Kaydet',
  
  renderUI: (payload) => {
    return (
      <div className="flex flex-col gap-2">
        <p><span className="font-medium text-[var(--color-ink)]">Belge güncellenecek:</span> {payload.title || 'Mevcut Belge'}</p>
        <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg max-h-40 overflow-y-auto text-xs text-blue-900 font-mono">
          {payload.content.slice(0, 500)} {payload.content.length > 500 ? '...' : ''}
        </div>
      </div>
    );
  },

  execute: async (payload: any, context: ActionExecutionContext) => {
    try {
      const docRef = doc(db, 'beiwe_docs', payload.docId);
      
      const updateData: any = {
        content: payload.content,
        updatedAt: serverTimestamp(),
      };
      
      if (payload.title) {
        updateData.title = payload.title;
      }

      await updateDoc(docRef, updateData);

      // Dispatch event to app to reload this doc's content if it is currently open
      if (typeof window !== 'undefined') {
         window.dispatchEvent(new CustomEvent('docUpdated', { detail: { id: payload.docId, content: payload.content, title: payload.title } }));
      }

      return { 
        success: true, 
        message: 'Değişiklikler başarıyla kaydedildi.' 
      };
    } catch (error: any) {
      console.error('Update doc error:', error);
      return { success: false, message: 'Doküman güncellenirken hata: ' + error.message };
    }
  }
};
