import { SchemaType } from '@google/generative-ai';
import { ClarityAction, ActionExecutionContext } from '../types';
import React from 'react';
import { ingestMemory } from '@/lib/saule-core-client';

export const CreateCustomerAction: ClarityAction = {
  name: 'create_customer',
  description: 'Create a new customer record. Always use this tool if the user wants to add or register a new customer or contact.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      name: { type: SchemaType.STRING, description: 'The full name of the customer.' }
    },
    required: ['name']
  },
  buttonText: 'Müşteriyi Kaydet',
  
  renderUI: (payload: any) => (
    <>
      <span className="font-medium text-[var(--color-ink)]">{payload.name}</span> isimli yeni bir müşteri kaydı oluşturulacak.
    </>
  ),

  execute: async (payload: any, context: ActionExecutionContext) => {
    try {
      const res = await ingestMemory(
        `/customer ${payload.name}`,
        'action',
        { source: 'search_bar_auto', author: context.user.uid, createdAt: Date.now() },
        'fact',
        'personal',
        context.user.uid,
        context.token
      );
      
      await ingestMemory(
        `[ORIGINAL_QUERY] ${context.currentQuery}\n[SYNTHESIS] Müşteri veritabanında işlem yapıldı.\n[ACTION_RESULT] Müşteri başarıyla eklendi.`,
        'knowledge',
        { source: 'search_bar_auto', author: context.user.uid, createdAt: Date.now() },
        'fact',
        'personal',
        context.user.uid,
        context.token
      );

      return { success: true, message: 'Müşteri başarıyla eklendi.', data: { id: res.node?.id || res.id } };
    } catch (error: any) {
      console.error(error);
      return { success: false, message: 'Müşteri eklenirken hata oluştu.' };
    }
  }
};
