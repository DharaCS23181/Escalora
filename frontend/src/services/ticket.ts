import { apiClient } from './api';
import type { User } from '../store/authStore';

export type TicketType = 'BUG' | 'INCIDENT' | 'MAINTENANCE' | 'TASK' | 'CHANGE_REQUEST';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'ON_HOLD' | 'RESOLVED' | 'CLOSED';
export type EscalationStatus = 'NONE' | 'ESCALATED' | 'RESOLVED';

export interface Ticket {
  id: string;
  ticket_key: string;
  project_id: string;
  title: string;
  description: string | null;
  type: TicketType;
  priority: TicketPriority;
  status: TicketStatus;
  assignee_id: string | null;
  created_by_id: string | null;
  
  sla_policy_id: string | null;
  sla_started_at: string | null;
  sla_due_at: string | null;
  sla_status: string | null;
  
  escalation_status: EscalationStatus;
  escalated_at: string | null;
  escalated_to_id: string | null;
  
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  
  assignee?: User | null;
  created_by?: User | null;
}

export interface TicketCreate {
  title: string;
  description?: string;
  type: TicketType;
  priority: TicketPriority;
  project_id: string;
  assignee_id?: string;
}

export interface TicketActivity {
  id: string;
  ticket_id: string;
  actor_id: string | null;
  action: string;
  old_value: string | null;
  new_value: string | null;
  metadata_json: Record<string, any> | null;
  created_at: string;
  actor?: User | null;
}

export const ticketService = {
  createTicket: async (data: TicketCreate): Promise<Ticket> => {
    const response = await apiClient.post('/tickets', data);
    return response.data;
  },

  getTickets: async (params?: { project_id?: string; status?: string; priority?: string; assignee_id?: string; skip?: number; limit?: number }): Promise<Ticket[]> => {
    const response = await apiClient.get('/tickets', { params });
    return response.data;
  },

  getTicket: async (id: string): Promise<Ticket> => {
    const response = await apiClient.get(`/tickets/${id}`);
    return response.data;
  },

  updateStatus: async (id: string, status: TicketStatus): Promise<Ticket> => {
    const response = await apiClient.patch(`/tickets/${id}/status`, { status });
    return response.data;
  },

  assignTicket: async (id: string, assignee_id: string | null): Promise<Ticket> => {
    const response = await apiClient.patch(`/tickets/${id}/assign`, { assignee_id });
    return response.data;
  },

  getActivity: async (id: string): Promise<TicketActivity[]> => {
    const response = await apiClient.get(`/tickets/${id}/activity`);
    return response.data;
  },
};
