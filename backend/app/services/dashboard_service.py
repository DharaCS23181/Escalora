import uuid
import asyncio
from typing import List
from datetime import datetime, UTC
from sqlalchemy import select, func, case, text, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.user import User, RoleEnum
from app.models.project import Project
from app.models.project_member import ProjectMember
from app.models.ticket import Ticket, TicketStatus, TicketPriority, EscalationStatus
from app.models.ticket_sla import TicketSLA, SLAStatus
from app.models.escalation import Escalation, EscalationStatusEnum
from app.models.ticket_activity import TicketActivity
from app.schemas.dashboard import (
    DashboardOverviewResponse, DashboardTicketMetrics, DashboardSLAMetrics,
    DashboardEscalationMetrics, DashboardProjectOverviewItem, DashboardNeedsAttentionItem,
    DashboardActivityItem, DashboardPersonalWorkSummary, DashboardUpcomingDeadlineItem,
    DashboardTrendItem, DashboardTeamWorkloadItem, DashboardSlaByPriorityItem,
    DashboardPersonalEscalationSummary
)

async def _get_authorized_project_ids(session: AsyncSession, user: User) -> List[uuid.UUID] | None:
    """Return a list of project IDs the user has access to. Returns None if ADMIN (has access to all)."""
    if user.role == RoleEnum.ADMIN:
        return None
    
    if user.role == RoleEnum.PROJECT_LEAD:
        result = await session.execute(
            select(Project.id).where(Project.project_lead_id == user.id)
        )
    else:
        result = await session.execute(
            select(ProjectMember.project_id).where(ProjectMember.user_id == user.id)
        )
        
    return [row[0] for row in result.all()]

async def get_dashboard_overview(session: AsyncSession, current_user: User, project_id: uuid.UUID | None = None) -> DashboardOverviewResponse:
    auth_project_ids = await _get_authorized_project_ids(session, current_user)
    
    # Base filter condition for queries
    def apply_rbac(query, project_col):
        if project_id:
            if current_user.role != RoleEnum.ADMIN:
                if auth_project_ids is not None and project_id not in auth_project_ids:
                    # Unauthorized for this specific project
                    return query.where(project_col == uuid.UUID(int=0))
            return query.where(project_col == project_id)
        
        if auth_project_ids is not None:
            return query.where(project_col.in_(auth_project_ids))
        return query

    # Fire multiple optimized aggregation queries concurrently
    now = datetime.now(UTC)

    # 1. Ticket Metrics & SLA Metrics
    tickets_query = select(
        func.count(Ticket.id).label("total"),
        func.sum(case((Ticket.status == TicketStatus.OPEN, 1), else_=0)).label("open"),
        func.sum(case((Ticket.status == TicketStatus.IN_PROGRESS, 1), else_=0)).label("in_progress"),
        func.sum(case((Ticket.status == TicketStatus.RESOLVED, 1), else_=0)).label("resolved"),
        func.sum(case((Ticket.escalation_status.in_([EscalationStatus.ESCALATED, EscalationStatus.ACKNOWLEDGED]), 1), else_=0)).label("escalated"),
        
        func.sum(case((Ticket.priority == TicketPriority.CRITICAL, 1), else_=0)).label("critical"),
        func.sum(case((Ticket.priority == TicketPriority.HIGH, 1), else_=0)).label("high"),
        func.sum(case((Ticket.priority == TicketPriority.MEDIUM, 1), else_=0)).label("medium"),
        func.sum(case((Ticket.priority == TicketPriority.LOW, 1), else_=0)).label("low"),
    )
    tickets_query = apply_rbac(tickets_query, Ticket.project_id)

    # Note: SLA status breached can be computed by joining TicketSLA
    sla_query = select(
        func.count(TicketSLA.id).label("total"),
        func.sum(case((TicketSLA.status == SLAStatus.ON_TRACK, 1), else_=0)).label("on_track"),
        func.sum(case((TicketSLA.status == SLAStatus.AT_RISK, 1), else_=0)).label("at_risk"),
        func.sum(case((TicketSLA.status == SLAStatus.BREACHED, 1), else_=0)).label("breached")
    ).join(Ticket, Ticket.id == TicketSLA.ticket_id)
    sla_query = apply_rbac(sla_query, Ticket.project_id)

    # 2. Escalation Metrics
    esc_query = select(
        func.sum(case((Escalation.status == EscalationStatusEnum.OPEN, 1), else_=0)).label("open"),
        func.sum(case((Escalation.status == EscalationStatusEnum.ACKNOWLEDGED, 1), else_=0)).label("acknowledged"),
        func.sum(case((Escalation.status == EscalationStatusEnum.RESOLVED, 1), else_=0)).label("resolved")
    )
    esc_query = apply_rbac(esc_query, Escalation.project_id)

    # 3. Project Overview
    # Group tickets and SLA states by project
    proj_query = select(
        Project.id,
        Project.name,
        func.count(Ticket.id).label("ticket_count"),
        func.sum(case((Ticket.escalation_status.in_([EscalationStatus.ESCALATED, EscalationStatus.ACKNOWLEDGED]), 1), else_=0)).label("escalated_count"),
        func.sum(case((TicketSLA.status == SLAStatus.AT_RISK, 1), else_=0)).label("at_risk_count"),
        func.sum(case((TicketSLA.status == SLAStatus.BREACHED, 1), else_=0)).label("breached_count"),
        func.count(TicketSLA.id).label("total_sla_count")
    ).outerjoin(Ticket, Ticket.project_id == Project.id)\
     .outerjoin(TicketSLA, TicketSLA.ticket_id == Ticket.id)\
     .group_by(Project.id)
    proj_query = apply_rbac(proj_query, Project.id)

    # 4. Personal Work Summary
    my_tickets_query = select(
        func.count(Ticket.id).label("assigned_to_me"),
        func.sum(case((Ticket.status == TicketStatus.OPEN, 1), else_=0)).label("open"),
        func.sum(case((Ticket.status == TicketStatus.IN_PROGRESS, 1), else_=0)).label("in_progress"),
        func.sum(case((TicketSLA.status == SLAStatus.AT_RISK, 1), else_=0)).label("at_risk"),
        func.sum(case((TicketSLA.status == SLAStatus.BREACHED, 1), else_=0)).label("sla_breached"),
        func.sum(case((Ticket.escalation_status.in_([EscalationStatus.ESCALATED, EscalationStatus.ACKNOWLEDGED]), 1), else_=0)).label("escalated_to_me"),
        func.sum(case((Ticket.status == TicketStatus.RESOLVED, 1), else_=0)).label("resolved_by_me")
    ).outerjoin(TicketSLA, TicketSLA.ticket_id == Ticket.id)\
     .where(Ticket.assignee_id == current_user.id)
    # Note: Resolved by me usually means assignee is me and status is resolved.

    my_esc_query = select(
        func.sum(case((Escalation.status == EscalationStatusEnum.OPEN, 1), else_=0)).label("open"),
        func.sum(case((Escalation.status == EscalationStatusEnum.ACKNOWLEDGED, 1), else_=0)).label("acknowledged"),
        func.sum(case((Escalation.status == EscalationStatusEnum.RESOLVED, 1), else_=0)).label("resolved")
    ).where(Escalation.assigned_to_id == current_user.id)

    proj_filter_sql = ""
    if project_id:
        if current_user.role == RoleEnum.ADMIN or (auth_project_ids is not None and project_id in auth_project_ids):
            proj_filter_sql = f"AND project_id = '{project_id}'"
        else:
            proj_filter_sql = f"AND project_id = '00000000-0000-0000-0000-000000000000'"
            
    rbac_filter_sql = ""
    if auth_project_ids is not None:
        if len(auth_project_ids) == 0:
            rbac_filter_sql = "AND FALSE"
        else:
            pids = ",".join(f"'{pid}'" for pid in auth_project_ids)
            rbac_filter_sql = f"AND project_id IN ({pids})"

    trend_query = text(f"""
        WITH dates AS (
            SELECT generate_series(
                CURRENT_DATE - INTERVAL '6 days',
                CURRENT_DATE,
                '1 day'::interval
            )::date AS day
        )
        SELECT 
            TO_CHAR(d.day, 'YYYY-MM-DD') AS date_str,
            COUNT(t_created.id) AS created_count,
            COUNT(t_resolved.id) AS resolved_count
        FROM dates d
        LEFT JOIN tickets t_created 
            ON DATE(t_created.created_at) = d.day
            {proj_filter_sql.replace('project_id', 't_created.project_id')}
            {rbac_filter_sql.replace('project_id', 't_created.project_id')}
        LEFT JOIN tickets t_resolved 
            ON DATE(t_resolved.resolved_at) = d.day
            {proj_filter_sql.replace('project_id', 't_resolved.project_id')}
            {rbac_filter_sql.replace('project_id', 't_resolved.project_id')}
        GROUP BY d.day
        ORDER BY d.day;
    """)

    # 6. Team Workload Query
    workload_query = select(
        User.id.label("user_id"),
        User.full_name.label("name"),
        User.role.label("role"),
        func.count(Ticket.id).label("assigned"),
        func.sum(case((Ticket.status == TicketStatus.IN_PROGRESS, 1), else_=0)).label("in_progress"),
        func.sum(case((TicketSLA.status == SLAStatus.AT_RISK, 1), else_=0)).label("at_risk"),
        func.sum(case((TicketSLA.status == SLAStatus.BREACHED, 1), else_=0)).label("breached")
    ).select_from(User)\
     .join(ProjectMember, ProjectMember.user_id == User.id)\
     .outerjoin(Ticket, and_(Ticket.assignee_id == User.id, Ticket.status != TicketStatus.RESOLVED, Ticket.status != TicketStatus.CLOSED))\
     .outerjoin(TicketSLA, TicketSLA.ticket_id == Ticket.id)\
     .group_by(User.id)
    workload_query = apply_rbac(workload_query, ProjectMember.project_id)

    # 7. SLA by Priority Query
    sla_priority_query = select(
        Ticket.priority,
        func.sum(case((TicketSLA.status == SLAStatus.ON_TRACK, 1), else_=0)).label("on_track"),
        func.sum(case((TicketSLA.status == SLAStatus.AT_RISK, 1), else_=0)).label("at_risk"),
        func.sum(case((TicketSLA.status == SLAStatus.BREACHED, 1), else_=0)).label("breached"),
        func.count(TicketSLA.id).label("total")
    ).join(TicketSLA, TicketSLA.ticket_id == Ticket.id)\
     .group_by(Ticket.priority)
    sla_priority_query = apply_rbac(sla_priority_query, Ticket.project_id)

    # Execute aggregate queries
    (
        tickets_res, sla_res, esc_res, proj_res, my_tickets_res, my_esc_res, trend_res,
        workload_res, sla_priority_res
    ) = await asyncio.gather(
        session.execute(tickets_query),
        session.execute(sla_query),
        session.execute(esc_query),
        session.execute(proj_query),
        session.execute(my_tickets_query),
        session.execute(my_esc_query),
        session.execute(trend_query),
        session.execute(workload_query),
        session.execute(sla_priority_query)
    )

    t_metrics = tickets_res.one()
    s_metrics = sla_res.one()
    e_metrics = esc_res.one()
    m_tickets = my_tickets_res.one()

    sla_total = s_metrics.total or 0
    on_track_pct = (s_metrics.on_track / sla_total * 100) if sla_total > 0 else 100.0
    at_risk_pct = (s_metrics.at_risk / sla_total * 100) if sla_total > 0 else 0.0
    breached_pct = (s_metrics.breached / sla_total * 100) if sla_total > 0 else 0.0

    projects_data = []
    for row in proj_res.all():
        total_sla = row.total_sla_count or 0
        breached = row.breached_count or 0
        compliance = 100.0 if total_sla == 0 else ((total_sla - breached) / total_sla * 100.0)
        projects_data.append(DashboardProjectOverviewItem(
            id=row.id,
            name=row.name,
            ticket_count=row.ticket_count or 0,
            at_risk_count=row.at_risk_count or 0,
            breached_count=breached,
            escalated_count=row.escalated_count or 0,
            total_sla_count=total_sla,
            sla_compliance_percent=round(compliance, 1)
        ))

    # 5. Needs Attention (Top 10 max)
    # Order: BREACHED (1) > ESCALATED (2) > AT RISK (3) > CRITICAL (4)
    # Complex ORM query mapped to DashboardNeedsAttentionItem
    attention_query = select(
        Ticket.id, Ticket.ticket_key, Ticket.title, Ticket.priority, Ticket.status,
        Ticket.assignee_id, User.full_name.label("assignee_name"), Ticket.project_id,
        TicketSLA.status.label("sla_status"), Ticket.escalation_status, TicketSLA.resolution_due_at
    ).outerjoin(User, Ticket.assignee_id == User.id)\
     .outerjoin(TicketSLA, TicketSLA.ticket_id == Ticket.id)\
     .where(Ticket.status.notin_([TicketStatus.RESOLVED, TicketStatus.CLOSED]))

    attention_query = apply_rbac(attention_query, Ticket.project_id)
    
    if current_user.role == RoleEnum.SENIOR_DEVELOPER:
        attention_query = attention_query.outerjoin(Escalation, Escalation.ticket_id == Ticket.id)\
            .where(
                or_(
                    Ticket.assignee_id == current_user.id,
                    and_(Escalation.assigned_to_id == current_user.id, Escalation.status.in_([EscalationStatusEnum.OPEN, EscalationStatusEnum.ACKNOWLEDGED]))
                )
            )
    elif current_user.role == RoleEnum.DEVELOPER:
        attention_query = attention_query.where(Ticket.assignee_id == current_user.id)
    
    # Filter only those that need attention
    attention_query = attention_query.where(
        or_(
            TicketSLA.status == SLAStatus.BREACHED,
            Ticket.escalation_status.in_([EscalationStatus.ESCALATED, EscalationStatus.ACKNOWLEDGED]),
            TicketSLA.status == SLAStatus.AT_RISK,
            Ticket.priority == TicketPriority.CRITICAL
        )
    )

    attention_res = await session.execute(attention_query)
    attention_items = []
    
    for row in attention_res.all():
        reason_code = 4
        reason = "CRITICAL"
        
        if row.sla_status == SLAStatus.BREACHED:
            reason_code = 1
            reason = "SLA BREACHED"
        elif row.escalation_status in [EscalationStatus.ESCALATED, EscalationStatus.ACKNOWLEDGED]:
            reason_code = 2
            reason = "ESCALATED"
        elif row.sla_status == SLAStatus.AT_RISK:
            reason_code = 3
            reason = "AT RISK"
            
        due_in = None
        if row.resolution_due_at:
            delta = (row.resolution_due_at - now).total_seconds()
            due_in = int(delta / 60)
            
        attention_items.append(DashboardNeedsAttentionItem(
            id=row.id, ticket_key=row.ticket_key, title=row.title,
            priority=row.priority, status=row.status, assignee_name=row.assignee_name,
            assignee_id=row.assignee_id, project_id=row.project_id,
            reason=reason, reason_code=reason_code, due_in_minutes=due_in
        ))
    
    # Sort in python for simpler logic: by reason_code ASC, then due_in_minutes ASC
    attention_items.sort(key=lambda x: (x.reason_code, x.due_in_minutes if x.due_in_minutes is not None else 999999))
    attention_items = attention_items[:10]

    # 6. Upcoming Deadlines (for active tickets)
    deadlines_query = select(
        Ticket.id, Ticket.ticket_key, Ticket.project_id, Ticket.priority, TicketSLA.resolution_due_at
    ).join(TicketSLA, TicketSLA.ticket_id == Ticket.id)\
     .where(
        Ticket.status.notin_([TicketStatus.RESOLVED, TicketStatus.CLOSED]),
        TicketSLA.resolution_due_at > now,
        TicketSLA.resolution_completed_at.is_(None)
    ).order_by(TicketSLA.resolution_due_at.asc()).limit(8)
    
    # Developer/Senior Dev filter to own tickets if needed, but the prompt says "Upcoming SLA deadlines" 
    # For Dev: own tickets. For others: accessible projects.
    if current_user.role == RoleEnum.DEVELOPER:
        deadlines_query = deadlines_query.where(Ticket.assignee_id == current_user.id)
    else:
        deadlines_query = apply_rbac(deadlines_query, Ticket.project_id)
        
    deadlines_res = await session.execute(deadlines_query)
    upcoming = []
    for row in deadlines_res.all():
        delta = (row.resolution_due_at - now).total_seconds()
        upcoming.append(DashboardUpcomingDeadlineItem(
            ticket_id=row.id, ticket_key=row.ticket_key, project_id=row.project_id,
            priority=row.priority, due_in_minutes=int(delta/60)
        ))

    # 7. Recent Activity
    act_query = select(
        TicketActivity.id, Ticket.ticket_key, TicketActivity.ticket_id,
        Ticket.project_id, TicketActivity.action, TicketActivity.new_value,
        TicketActivity.created_at, User.full_name
    ).outerjoin(Ticket, Ticket.id == TicketActivity.ticket_id)\
     .outerjoin(User, User.id == TicketActivity.actor_id)
     
    act_query = apply_rbac(act_query, Ticket.project_id)
    act_query = act_query.order_by(TicketActivity.created_at.desc()).limit(15)
    
    act_res = await session.execute(act_query)
    activities = []
    for row in act_res.all():
        actor = row.full_name or 'System'
        msg = ""
        if row.action == "CREATED": msg = f"{actor} created ticket"
        elif row.action == "STATUS_CHANGED": msg = f"Status changed to {row.new_value} by {actor}"
        elif row.action == "ASSIGNED": msg = f"Assigned to {row.new_value or 'Unassigned'}"
        elif row.action == "ESCALATED": msg = row.new_value or "Ticket escalated"
        elif row.action == "ESCALATION_ACKNOWLEDGED": msg = f"Escalation acknowledged by {actor}"
        elif row.action == "ESCALATION_TAKEN_OVER": msg = f"Ticket taken over by {actor}"
        elif row.action == "ESCALATION_RESOLVED": msg = f"Escalation resolved by {actor}"
        else: msg = f"Activity by {actor}"
        
        activities.append(DashboardActivityItem(
            id=row.id, ticket_key=row.ticket_key, ticket_id=row.ticket_id,
            project_id=row.project_id, message=msg, created_at=row.created_at
        ))

    # Extract scalar sums from my_tickets_query and my_esc_query
    m_esc_row = my_esc_res.one()

    return DashboardOverviewResponse(
        role=current_user.role.value,
        ticket_metrics=DashboardTicketMetrics(
            total=t_metrics.total or 0,
            open=t_metrics.open or 0,
            in_progress=t_metrics.in_progress or 0,
            resolved=t_metrics.resolved or 0,
            escalated=t_metrics.escalated or 0,
            sla_breached=s_metrics.breached or 0,
            critical=t_metrics.critical or 0,
            high=t_metrics.high or 0,
            medium=t_metrics.medium or 0,
            low=t_metrics.low or 0
        ),
        sla_metrics=DashboardSLAMetrics(
            on_track=s_metrics.on_track or 0,
            at_risk=s_metrics.at_risk or 0,
            breached=s_metrics.breached or 0,
            on_track_percent=round(on_track_pct, 1),
            at_risk_percent=round(at_risk_pct, 1),
            breached_percent=round(breached_pct, 1)
        ),
        escalation_metrics=DashboardEscalationMetrics(
            open=e_metrics.open or 0,
            acknowledged=e_metrics.acknowledged or 0,
            resolved=e_metrics.resolved or 0
        ),
        project_metrics=projects_data,
        attention_tickets=attention_items,
        recent_activity=activities,
        personal_metrics=DashboardPersonalWorkSummary(
            assigned_to_me=m_tickets.assigned_to_me or 0,
            open=m_tickets.open or 0,
            in_progress=m_tickets.in_progress or 0,
            at_risk=m_tickets.at_risk or 0,
            sla_breached=m_tickets.sla_breached or 0,
            escalated_to_me=m_tickets.escalated_to_me or 0,
            resolved_by_me=m_tickets.resolved_by_me or 0,
            my_projects=len(projects_data) if current_user.role == RoleEnum.PROJECT_LEAD else None,
            my_projects_tickets=sum(p.ticket_count for p in projects_data) if current_user.role == RoleEnum.PROJECT_LEAD else None
        ),
        personal_escalations=DashboardPersonalEscalationSummary(
            open=m_esc_row.open or 0,
            acknowledged=m_esc_row.acknowledged or 0,
            resolved=m_esc_row.resolved or 0
        ),
        upcoming_deadlines=upcoming,
        ticket_trend=[
            DashboardTrendItem(
                date=row.date_str,
                created=row.created_count,
                resolved=row.resolved_count
            )
            for row in trend_res.all()
        ],
        team_workload=[
            DashboardTeamWorkloadItem(
                user_id=row.user_id,
                name=row.name,
                role=row.role.value,
                assigned=row.assigned or 0,
                in_progress=row.in_progress or 0,
                at_risk=row.at_risk or 0,
                breached=row.breached or 0
            ) for row in workload_res.all()
        ],
        sla_by_priority=[
            DashboardSlaByPriorityItem(
                priority=row.priority.value,
                on_track=row.on_track or 0,
                at_risk=row.at_risk or 0,
                breached=row.breached or 0,
                total=row.total or 0
            ) for row in sla_priority_res.all()
        ]
    )
