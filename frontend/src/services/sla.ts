import { apiClient } from './api';

export type SLAStatus = 'ON_TRACK' | 'AT_RISK' | 'BREACHED' | 'PAUSED' | 'COMPLETED';

export interface SLAPolicy {
  id: string;
  name: string;
  priority: string;
  response_time_minutes: number;
  resolution_time_minutes: number;
  at_risk_threshold_percent: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SLAPolicyCreate {
  name: string;
  priority: string;
  response_time_minutes: number;
  resolution_time_minutes: number;
  at_risk_threshold_percent: number;
  active?: boolean;
}

export interface SLAPolicyUpdate {
  name?: string;
  priority?: string;
  response_time_minutes?: number;
  resolution_time_minutes?: number;
  at_risk_threshold_percent?: number;
  active?: boolean;
}

export interface SLAOverviewResponse {
  total_active_tickets: number;
  on_track_count: number;
  at_risk_count: number;
  breached_count: number;
  completed_count: number;
  response_sla_compliance: number;
  resolution_sla_compliance: number;
  average_response_minutes: number;
  average_resolution_minutes: number;
}

export const slaService = {
  getPolicies: async () => {
    const response = await apiClient.get<SLAPolicy[]>('/sla/policies');
    return response.data;
  },

  createPolicy: async (data: SLAPolicyCreate) => {
    const response = await apiClient.post<SLAPolicy>('/sla/policies', data);
    return response.data;
  },

  updatePolicy: async (id: string, data: SLAPolicyUpdate) => {
    const response = await apiClient.patch<SLAPolicy>(`/sla/policies/${id}`, data);
    return response.data;
  },

  deactivatePolicy: async (id: string) => {
    await apiClient.delete(`/sla/policies/${id}`);
  },

  getOverview: async () => {
    const response = await apiClient.get<SLAOverviewResponse>('/sla/overview');
    return response.data;
  }
};
