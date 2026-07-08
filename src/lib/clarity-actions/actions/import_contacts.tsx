import { SchemaType } from '@google/generative-ai';
import { ClarityAction, ActionExecutionContext } from '../types';
import React from 'react';

export const ImportContactsAction: ClarityAction = {
  name: 'import_google_contacts',
  description: 'Import contacts from Google Contacts. Use this when the user wants to sync, transfer, or import people/customers from their Google account.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      intent: { type: SchemaType.STRING, description: 'User intent confirmed' }
    }
  },
  buttonText: 'Müşteriler Sayfasına Git',
  
  renderUI: () => (
    <>
      <span className="font-medium text-[var(--color-ink)]">Google Rehber</span>'inizdeki kişileri Müşteriler sayfasından seçerek aktarabilirsiniz.
    </>
  ),

  execute: async (payload: any, context: ActionExecutionContext) => {
    try {
      // We return a special success message that the frontend can intercept 
      // or we just return success and let the user click the link/button if we wanted.
      // Actually, since execution just runs the backend logic, we can return a navigation instruction.
      // For now, let's just return a success message. The user will be guided by the UI.
      if (typeof window !== 'undefined') {
        window.location.href = '/tr/app/customers?action=import_google_contacts';
      }
      return { success: true, message: 'Müşteriler sayfasına yönlendiriliyorsunuz...' };
    } catch (error: any) {
      console.error(error);
      return { success: false, message: 'Yönlendirme sırasında hata oluştu.' };
    }
  }
};
