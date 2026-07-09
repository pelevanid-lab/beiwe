import { SchemaType } from '@google/generative-ai';
import { ClarityAction, ActionExecutionContext } from '../types';
import React from 'react';
import { db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp, collection } from 'firebase/firestore';

export const CreateDocAction: ClarityAction = {
  name: 'create_doc',
  description: 'Create a new native document in Beiwe Docs.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      title: { type: SchemaType.STRING, description: 'Title of the new document' },
      content: { type: SchemaType.STRING, description: 'HTML or text content of the document' }
    },
    required: ['title', 'content']
  },
  buttonText: 'Dokümanı Oluştur',
  
  renderUI: (payload) => {
    return (
      <div className="flex flex-col gap-2">
        <p><span className="font-medium text-[var(--color-ink)]">"{payload.title}"</span> başlıklı yeni bir belge oluşturulacak.</p>
        <div className="bg-gray-50 border border-gray-100 p-3 rounded-lg max-h-32 overflow-y-auto text-xs text-gray-600 font-mono">
          {payload.content.slice(0, 300)} {payload.content.length > 300 ? '...' : ''}
        </div>
      </div>
    );
  },

  execute: async (payload: any, context: ActionExecutionContext) => {
    try {
      const newDocId = crypto.randomUUID();
      const docRef = doc(collection(db, 'beiwe_docs'), newDocId);
      
      await setDoc(docRef, {
        title: payload.title,
        content: payload.content,
        ownerId: context.user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        type: 'document'
      });

      // Dispatch event to app to open this doc directly
      if (typeof window !== 'undefined') {
         window.dispatchEvent(new CustomEvent('routeUI', { detail: { module: `docs-${newDocId}` } }));
      }

      return { 
        success: true, 
        message: `Doküman başarıyla oluşturuldu ve kaydedildi. [UI_ROUTE: docs-${newDocId}]` 
      };
    } catch (error: any) {
      console.error('Create doc error:', error);
      return { success: false, message: 'Doküman oluşturulurken hata: ' + error.message };
    }
  }
};
