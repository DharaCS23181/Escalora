from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from uuid import UUID

from app.models.ticket import TicketPriority

class DashboardTicketMetrics(BaseModel):
    total: int
    open: int
    in_progress: int
    resolved: int
    escalated: int
    sla_breached: int
    critical: int
    high: int
    medium: int
    low: int

class DashboardSLAMetrics(BaseModel):
    on_track: int
    at_risk: int
    breached: int
    on_track_percent: float
    at_risk_percent: float
    breached_percent: float

class DashboardEscalationMetrics(BaseModel):
    open: int
    acknowledged: int
    resolved: int

class DashboardProjectOverviewItem(BaseModel):
    id: UUID
    name: str
    ticket_count: int
    at_risk_count: int
    breached_count: int
    escalated_count: int
    total_sla_count: int
    sla_compliance_percent: float

class DashboardNeedsAttentionItem(BaseModel):
    id: UUID
    ticket_key: str
    title: str
    priority: str
    status: str
    assignee_name: Optional[str]
    reason: str
    reason_code: int # 1 = breached, 2 = escalated, 3 = at risk, 4 = critical open
    due_in_minutes: Optional[int]

class DashboardActivityItem(BaseModel):
    id: UUID
    ticket_key: Optional[str]
    ticket_id: Optional[UUID]
    project_id: UUID
    message: str
    created_at: datetime

class DashboardPersonalEscalationSummary(BaseModel):
    open: int
    acknowledged: int
    resolved: int

class DashboardPersonalWorkSummary(BaseModel):
    assigned_to_me: int
    open: int
    in_progress: int
    at_risk: int
    sla_breached: int
    escalated_to_me: int
    resolved_by_me: int
    my_projects: Optional[int] = None
    my_projects_tickets: Optional[int] = None

class DashboardUpcomingDeadlineItem(BaseModel):
    ticket_key: str
    ticket_id: UUID
    project_id: UUID
    priority: TicketPriority
    due_in_minutes: int

class DashboardTrendItem(BaseModel):
    date: str
    created: int
    resolved: int

class DashboardTeamWorkloadItem(BaseModel):
    user_id: UUID
    name: str
    role: str
    assigned: int
    in_progress: int
    at_risk: int
    breached: int

class DashboardSlaByPriorityItem(BaseModel):
    priority: str
    on_track: int
    at_risk: int
    breached: int
    total: int

class DashboardOverviewResponse(BaseModel):
    role: str
    ticket_metrics: DashboardTicketMetrics
    sla_metrics: DashboardSLAMetrics
    escalation_metrics: DashboardEscalationMetrics
    project_metrics: List[DashboardProjectOverviewItem]
    attention_tickets: List[DashboardNeedsAttentionItem]
    recent_activity: List[DashboardActivityItem]
    personal_metrics: DashboardPersonalWorkSummary
    personal_escalations: DashboardPersonalEscalationSummary
    upcoming_deadlines: List[DashboardUpcomingDeadlineItem]
    ticket_trend: List[DashboardTrendItem]
    team_workload: List[DashboardTeamWorkloadItem]
    sla_by_priority: List[DashboardSlaByPriorityItem]
