import { apiClient } from './api';

export interface DashboardTicketMetrics {
  total: number;
  open: number;
  in_progress: number;
  resolved: number;
  escalated: number;
  sla_breached: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface DashboardSLAMetrics {
  on_track: number;
  at_risk: number;
  breached: number;
  on_track_percent: number;
  at_risk_percent: number;
  breached_percent: number;
}

export interface DashboardEscalationMetrics {
  open: number;
  acknowledged: number;
  resolved: number;
}

export interface DashboardProjectOverviewItem {
  id: string;
  name: string;
  ticket_count: number;
  at_risk_count: number;
  breached_count: number;
  escalated_count: number;
  total_sla_count: number;
  sla_compliance_percent: number;
}

export interface DashboardNeedsAttentionItem {
  id: string;
  ticket_key: string;
  title: string;
  priority: string;
  status: string;
  assignee_name: string | null;
  assignee_id: string | null;
  project_id: string;
  reason: string;
  reason_code: number;
  due_in_minutes: number | null;
}

export interface DashboardActivityItem {
  id: string;
  ticket_key: string | null;
  ticket_id: string | null;
  project_id: string | null;
  message: string;
  created_at: string;
}

export interface DashboardPersonalEscalationSummary {
  open: number;
  acknowledged: number;
  resolved: number;
}

export interface DashboardPersonalWorkSummary {
  assigned_to_me: number;
  open: number;
  in_progress: number;
  at_risk: number;
  sla_breached: number;
  escalated_to_me: number;
  resolved_by_me: number;
  my_projects?: number;
  my_projects_tickets?: number;
}

export interface DashboardUpcomingDeadlineItem {
  ticket_key: string;
  ticket_id: string;
  project_id: string;
  priority: string;
  due_in_minutes: number;
}

export interface DashboardTrendItem {
  date: string;
  created: number;
  resolved: number;
}

export interface DashboardTeamWorkloadItem {
  user_id: string;
  name: string;
  role: string;
  assigned: number;
  in_progress: number;
  at_risk: number;
  breached: number;
}

export interface DashboardSlaByPriorityItem {
  priority: string;
  on_track: number;
  at_risk: number;
  breached: number;
  total: number;
}

export interface DashboardOverviewResponse {
  role: string;
  ticket_metrics: DashboardTicketMetrics;
  sla_metrics: DashboardSLAMetrics;
  escalation_metrics: DashboardEscalationMetrics;
  project_metrics: DashboardProjectOverviewItem[];
  attention_tickets: DashboardNeedsAttentionItem[];
  recent_activity: DashboardActivityItem[];
  personal_metrics: DashboardPersonalWorkSummary;
  personal_escalations: DashboardPersonalEscalationSummary;
  upcoming_deadlines: DashboardUpcomingDeadlineItem[];
  ticket_trend: DashboardTrendItem[];
  team_workload: DashboardTeamWorkloadItem[];
  sla_by_priority: DashboardSlaByPriorityItem[];
}

export const dashboardService = {
  getOverview: async (projectId?: string | null): Promise<DashboardOverviewResponse> => {
    const params = projectId ? { project_id: projectId } : {};
    const response = await apiClient.get<DashboardOverviewResponse>('/dashboard/overview', { params });
    return response.data;
  }
};
