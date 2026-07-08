import { SchemaType, FunctionDeclaration } from '@google/generative-ai';
import React from 'react';

export interface ActionExecutionContext {
  user: any;
  token: string;
  activeWorkspace: string;
  currentQuery: string;
}

export interface ClarityAction {
  name: string;
  description: string;
  parameters: {
    type: SchemaType;
    properties: Record<string, any>;
    required?: string[];
  };
  buttonText: string;
  
  // Renders the action details in the UI before execution
  renderUI: (payload: any) => React.ReactNode;
  
  // Executes the action when the user clicks the action button
  execute: (payload: any, context: ActionExecutionContext) => Promise<{ success: boolean; message: string; data?: any }>;
}
