import { SchemaType } from '@google/generative-ai';
import { ClarityAction, ActionExecutionContext } from '../types';
import React from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';

// Tasks Clarity Action
// Appends a checkbox line to the user's pinned Tasks document in the Docs collection.
export const CreateTaskAction: ClarityAction = {
  name: 'create_task',
  description: 'Create a new task or to-do item for the user. Use this when the user wants to add something to their task list, to-do list, or needs to remember to do something.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      task: { type: SchemaType.STRING, description: 'The task description to add to the task list.' },
      dueDate: { type: SchemaType.STRING, description: 'Optional due date or time hint (e.g. "yarın", "Perşembe", "15 Temmuz").' },
    },
    required: ['task']
  },
  buttonText: 'Görevi Ekle',

  renderUI: (payload: any) => (
    <>
      <span className="font-medium text-[var(--color-ink)]">"{payload.task}"</span> görevi listeye eklenecek.
      {payload.dueDate && <> · <span className="text-[var(--color-ink-light)]">{payload.dueDate}</span></>}
    </>
  ),

  execute: async (payload: any, context: ActionExecutionContext) => {
    try {
      const newTaskData = {
        title: `${payload.task}${payload.dueDate ? ` (${payload.dueDate})` : ''}`,
        isCompleted: false,
        ownerId: context.user.uid,
        createdAt: Date.now() // or serverTimestamp() if imported, but Date.now works for consistency with the rest
      };

      const { addDoc } = await import('firebase/firestore');
      await addDoc(collection(db, 'beiwe_tasks'), newTaskData);

      // Also save to Saule memory
      const { ingestMemory } = await import('@/lib/saule-core-client');
      await ingestMemory(
        `[TASK_CREATED] ${payload.task}${payload.dueDate ? ` - Due: ${payload.dueDate}` : ''}`,
        'action',
        { source: 'clarity_engine', author: context.user.uid, createdAt: Date.now() },
        'fact',
        'personal',
        context.user.uid,
        context.token
      );

      return {
        success: true,
        message: `✅ "${payload.task}" görevi listenize eklendi.`,
        data: { task: payload.task }
      };
    } catch (error: any) {
      console.error('create_task error:', error);
      return { success: false, message: 'Görev eklenirken bir hata oluştu.' };
    }
  }
};
