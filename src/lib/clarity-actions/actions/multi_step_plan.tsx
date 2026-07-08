import { SchemaType } from '@google/generative-ai';
import { ClarityAction, ActionExecutionContext } from '../types';
import React from 'react';
import { CreateCustomerAction } from './create_customer';
import { CreateAppointmentAction } from './create_appointment';

export const MultiStepPlanAction: ClarityAction = {
  name: 'multi_step_plan',
  description: 'Create a multi-step plan when multiple actions are needed at once (e.g., registering a new customer AND creating an appointment for them).',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      steps: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            title: { type: SchemaType.STRING },
            description: { type: SchemaType.STRING }
          }
        }
      },
      customer: { type: SchemaType.STRING },
      title: { type: SchemaType.STRING },
      start: { type: SchemaType.STRING },
      createMeet: { type: SchemaType.BOOLEAN }
    },
    required: ['steps', 'customer', 'title', 'start']
  },
  buttonText: 'Planı Onayla ve Uygula',
  
  renderUI: (payload: any) => (
    <div className="flex flex-col gap-2 mt-2">
      {payload.steps?.map((step: any, idx: number) => (
        <div key={idx} className="flex items-start gap-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
          <div className="w-5 h-5 rounded-full bg-[var(--color-burnt-orange)]/20 text-[var(--color-burnt-orange)] flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
            {idx + 1}
          </div>
          <div>
            <div className="font-bold text-[var(--color-ink)] text-xs mb-0.5">{step.title}</div>
            <div className="text-xs text-[var(--color-ink-light)]">{step.description}</div>
          </div>
        </div>
      ))}
    </div>
  ),

  execute: async (payload: any, context: ActionExecutionContext) => {
    try {
      // 1. Create Customer
      await CreateCustomerAction.execute({ name: payload.customer }, context);
      
      // 2. Create Appointment
      const aptResult = await CreateAppointmentAction.execute({
        customer: payload.customer,
        title: payload.title,
        start: payload.start,
        createMeet: payload.createMeet
      }, context);

      return { success: true, message: `Çoklu plan başarıyla uygulandı.\n${aptResult.message}` };
    } catch (error: any) {
      console.error(error);
      return { success: false, message: 'Plan uygulanırken hata oluştu.' };
    }
  }
};
