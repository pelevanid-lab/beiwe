import { ClarityAction } from './types';
import { CreateCustomerAction } from './actions/create_customer';
import { AddNoteAction } from './actions/add_note';
import { DeleteNoteAction } from './actions/delete_note';
import { CreateAppointmentAction } from './actions/create_appointment';
import { UpdateAppointmentAction } from './actions/update_appointment';
import { DeleteAppointmentAction } from './actions/delete_appointment';
import { MultiStepPlanAction } from './actions/multi_step_plan';
import { ImportContactsAction } from './actions/import_contacts';
import { SendEmailAction } from './actions/send_email';
import { CreateDocAction } from './actions/create_doc';
import { UpdateDocAction } from './actions/update_doc';

// This is the single source of truth for all Agent capabilities.
// To add a new module/capability, create a new Action file and add it here.
export const CLARITY_ACTIONS: Record<string, ClarityAction> = {
  create_customer: CreateCustomerAction,
  add_note: AddNoteAction,
  delete_note: DeleteNoteAction,
  create_appointment: CreateAppointmentAction,
  update_appointment: UpdateAppointmentAction,
  delete_appointment: DeleteAppointmentAction,
  multi_step_plan: MultiStepPlanAction,
  import_google_contacts: ImportContactsAction,
  send_email: SendEmailAction,
  create_doc: CreateDocAction,
  update_doc: UpdateDocAction
};
