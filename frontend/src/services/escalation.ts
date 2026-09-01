import { apiClient } from './api';
import type { User } from '../store/authStore';

export type EscalationTriggerType = 'SLA_BREACH' | 'MANUAL';
export type EscalationStatusType = 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED' | 'CANCELLED';

export interface Escalation {
  id: string;
  ticket_id: string;
  project_id: string;
  trigger_type: EscalationTriggerType;
  reason: string;
  triggered_by_id: string | null;
  assigned_to_id: string | null;
  status: EscalationStatusType;
  created_at: string;
  acknowledged_at: string | null;
  resolved_at: string | null;
  updated_at: string;
  triggered_by: User | null;
  assigned_to: User | null;
  ticket_key: string | null;
  ticket_title: string | null;
  ticket_priority: string | null;
  ticket_status: string | null;
  project_name: string | null;
}

export interface EscalationCreate {
  ticket_id: string;
  reason: string;
  assigned_to_id?: string | null;
}

export interface EscalationMetrics {
  open_count: number;
  acknowledged_count: number;
  resolved_count: number;
  today_count: number;
}

export const escalationService = {
  getEscalations: async (params?: {
    project_id?: string;
    status?: string;
    trigger_type?: string;
    assigned_to?: string;
    skip?: number;
    limit?: number;
  }): Promise<Escalation[]> => {
    const response = await apiClient.get<Escalation[]>('/escalations', { params });
    return response.data;
  },

  getEscalation: async (id: string): Promise<Escalation> => {
    const response = await apiClient.get<Escalation>(`/escalations/${id}`);
    return response.data;
  },

  getMetrics: async (): Promise<EscalationMetrics> => {
    const response = await apiClient.get<EscalationMetrics>('/escalations/metrics');
    return response.data;
  },

  createEscalation: async (data: EscalationCreate): Promise<Escalation> => {
    const response = await apiClient.post<Escalation>('/escalations', data);
    return response.data;
  },

  acknowledge: async (id: string): Promise<Escalation> => {
    const response = await apiClient.patch<Escalation>(`/escalations/${id}/acknowledge`);
    return response.data;
  },

  takeOver: async (id: string): Promise<Escalation> => {
    const response = await apiClient.patch<Escalation>(`/escalations/${id}/take-over`);
    return response.data;
  },

  resolve: async (id: string): Promise<Escalation> => {
    const response = await apiClient.patch<Escalation>(`/escalations/${id}/resolve`);
    return response.data;
  },
};
