import React from 'react';
import { Clock, AlertTriangle, ShieldAlert, CheckCircle, TrendingUp, Zap, FileText, Activity, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useNavigate } from 'react-router-dom';
import type { DashboardOverviewResponse } from '../../services/dashboard';
import { formatDistanceToNow } from 'date-fns';

interface WidgetProps {
  data: DashboardOverviewResponse;
  onTicketClick: (ticketId: string) => void;
}

export const KPIStrip: React.FC<WidgetProps> = ({ data }) => {
  const navigate = useNavigate();
  return (
    <div className="grid gap-2 grid-cols-2 lg:grid-cols-6 mb-2">
      <Card className="hover:border-accent cursor-pointer transition-colors" onClick={() => navigate('/tickets')}>
        <CardContent className="p-3">
          <div className="text-xs text-muted uppercase font-bold mb-1 flex justify-between">Total <FileText size={12}/></div>
          <div className="text-xl font-bold leading-none">{data.ticket_metrics.total}</div>
        </CardContent>
      </Card>
      <Card className="hover:border-accent cursor-pointer transition-colors" onClick={() => navigate('/tickets?status=OPEN')}>
        <CardContent className="p-3">
          <div className="text-xs text-muted uppercase font-bold mb-1 flex justify-between">Open <AlertTriangle size={12}/></div>
          <div className="text-xl font-bold leading-none text-red-400">{data.ticket_metrics.open}</div>
        </CardContent>
      </Card>
      <Card className="hover:border-accent cursor-pointer transition-colors" onClick={() => navigate('/tickets?status=IN_PROGRESS')}>
        <CardContent className="p-3">
          <div className="text-xs text-muted uppercase font-bold mb-1 flex justify-between">In Progress <TrendingUp size={12}/></div>
          <div className="text-xl font-bold leading-none text-blue-400">{data.ticket_metrics.in_progress}</div>
        </CardContent>
      </Card>
      <Card className="hover:border-accent cursor-pointer transition-colors" onClick={() => navigate('/tickets?status=RESOLVED')}>
        <CardContent className="p-3">
          <div className="text-xs text-muted uppercase font-bold mb-1 flex justify-between">Resolved <CheckCircle size={12}/></div>
          <div className="text-xl font-bold leading-none text-emerald-500">{data.ticket_metrics.resolved}</div>
        </CardContent>
      </Card>
      <Card className="border-red-500/20 bg-red-500/5 hover:border-red-500/50 cursor-pointer transition-colors" onClick={() => navigate('/tickets?sla_status=BREACHED')}>
        <CardContent className="p-3">
          <div className="text-xs text-red-500/70 uppercase font-bold mb-1 flex justify-between">SLA Breached <ShieldAlert size={12}/></div>
          <div className="text-xl font-bold leading-none text-red-500">{data.ticket_metrics.sla_breached}</div>
        </CardContent>
      </Card>
      <Card className="border-accent/20 bg-accent/5 hover:border-accent/50 cursor-pointer transition-colors" onClick={() => navigate('/escalations')}>
        <CardContent className="p-3">
          <div className="text-xs text-accent/70 uppercase font-bold mb-1 flex justify-between">Escalated <Zap size={12}/></div>
          <div className="text-xl font-bold leading-none text-accent">{data.ticket_metrics.escalated}</div>
        </CardContent>
      </Card>
    </div>
  );
};

export const SlaHealthWidget: React.FC<WidgetProps> = ({ data }) => {
  const navigate = useNavigate();
  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="p-3 pb-0">
        <CardTitle className="text-xs font-bold uppercase text-muted tracking-wider">SLA Health</CardTitle>
      </CardHeader>
      <CardContent className="p-3 flex-1 flex flex-col justify-center">
        <div className="flex items-end justify-between mb-1 cursor-pointer hover:opacity-80" onClick={() => navigate('/tickets?sla_status=ON_TRACK')}>
          <span className="text-xs text-emerald-500 font-bold uppercase">On Track</span>
          <span className="text-lg font-bold leading-none">{data.sla_metrics.on_track_percent}%</span>
        </div>
        <div className="w-full h-1.5 bg-surface-hover rounded-full overflow-hidden mb-3">
          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${data.sla_metrics.on_track_percent}%` }} />
        </div>

        <div className="flex items-end justify-between mb-1 cursor-pointer hover:opacity-80" onClick={() => navigate('/tickets?sla_status=AT_RISK')}>
          <span className="text-xs text-orange-400 font-bold uppercase">At Risk ({data.sla_metrics.at_risk})</span>
          <span className="text-sm font-bold leading-none">{data.sla_metrics.at_risk_percent}%</span>
        </div>
        <div className="w-full h-1.5 bg-surface-hover rounded-full overflow-hidden mb-3">
          <div className="h-full bg-orange-400 rounded-full" style={{ width: `${data.sla_metrics.at_risk_percent}%` }} />
        </div>

        <div className="flex items-end justify-between mb-1 cursor-pointer hover:opacity-80" onClick={() => navigate('/tickets?sla_status=BREACHED')}>
          <span className="text-xs text-red-500 font-bold uppercase">Breached ({data.sla_metrics.breached})</span>
          <span className="text-sm font-bold leading-none">{data.sla_metrics.breached_percent}%</span>
        </div>
        <div className="w-full h-1.5 bg-surface-hover rounded-full overflow-hidden">
          <div className="h-full bg-red-500 rounded-full" style={{ width: `${data.sla_metrics.breached_percent}%` }} />
        </div>
      </CardContent>
    </Card>
  );
};

export const NeedsAttentionWidget: React.FC<WidgetProps> = ({ data, onTicketClick }) => {
  return (
    <Card className="flex flex-col h-full overflow-hidden border-orange-500/30">
      <CardHeader className="p-3 pb-2 bg-orange-500/5 border-b border-orange-500/10">
        <CardTitle className="text-xs font-bold uppercase text-orange-500 tracking-wider flex items-center gap-2">
          <AlertTriangle size={14} /> Needs Attention
        </CardTitle>
      </CardHeader>
      <div className="flex-1 overflow-y-auto p-0 m-0 custom-scrollbar">
        {data.attention_tickets.length === 0 ? (
          <div className="p-4 text-center text-xs text-muted italic">All clear. No tickets require immediate attention.</div>
        ) : (
          <table className="w-full text-[11px] text-left">
            <thead className="bg-surface sticky top-0 border-b border-border-color shadow-sm">
              <tr>
                <th className="px-2 py-1.5 font-semibold text-muted uppercase">Ticket</th>
                <th className="px-2 py-1.5 font-semibold text-muted uppercase hidden sm:table-cell">Assignee</th>
                <th className="px-2 py-1.5 font-semibold text-muted uppercase">Reason</th>
                <th className="px-2 py-1.5 font-semibold text-muted uppercase text-right">Due</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-color/50">
              {data.attention_tickets.map(t => (
                <tr key={t.id} className="hover:bg-surface-hover cursor-pointer transition-colors" onClick={() => onTicketClick(t.id)}>
                  <td className="px-2 py-2">
                    <div className="font-mono font-bold text-foreground">{t.ticket_key}</div>
                    <div className="truncate max-w-[120px] text-muted">{t.title}</div>
                  </td>
                  <td className="px-2 py-2 hidden sm:table-cell text-muted truncate max-w-[100px]">
                    {t.assignee_name || 'Unassigned'}
                  </td>
                  <td className="px-2 py-2">
                    <Badge variant={t.reason_code === 1 ? 'critical' : t.reason_code === 2 ? 'default' : t.reason_code === 3 ? 'high' : 'low'} className="text-[9px] py-0 px-1 border-none font-bold">
                      {t.reason}
                    </Badge>
                  </td>
                  <td className="px-2 py-2 text-right font-mono font-bold text-muted">
                    {t.due_in_minutes !== null ? (t.due_in_minutes < 0 ? <span className="text-red-500">OVERDUE</span> : `${t.due_in_minutes}m`) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Card>
  );
};

export const ProjectOverviewWidget: React.FC<WidgetProps> = ({ data }) => {
  const navigate = useNavigate();
  return (
    <Card className="flex flex-col h-full overflow-hidden">
      <CardHeader className="p-3 pb-2 border-b border-border-color">
        <CardTitle className="text-xs font-bold uppercase text-muted tracking-wider">Project Overview</CardTitle>
      </CardHeader>
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {data.project_metrics.length === 0 ? (
          <div className="p-4 text-center text-xs text-muted italic">No active projects available.</div>
        ) : (
          <table className="w-full text-[11px] text-left">
            <thead className="bg-surface sticky top-0 border-b border-border-color">
              <tr>
                <th className="px-3 py-1.5 font-semibold text-muted uppercase">Project</th>
                <th className="px-2 py-1.5 font-semibold text-muted uppercase text-right">Tickets</th>
                <th className="px-2 py-1.5 font-semibold text-orange-400/80 uppercase text-right" title="At Risk">Risk</th>
                <th className="px-2 py-1.5 font-semibold text-red-500/80 uppercase text-right" title="Breached">Brch</th>
                <th className="px-2 py-1.5 font-semibold text-accent/80 uppercase text-right" title="Escalated">Esc</th>
                <th className="px-3 py-1.5 font-semibold text-muted uppercase text-right">SLA %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-color/50">
              {data.project_metrics.map(p => (
                <tr key={p.id} className="hover:bg-surface-hover cursor-pointer transition-colors" onClick={() => navigate(`/projects/${p.id}`)}>
                  <td className="px-3 py-2 font-bold text-foreground truncate max-w-[150px]">{p.name}</td>
                  <td className="px-2 py-2 text-right text-muted">{p.ticket_count}</td>
                  <td className="px-2 py-2 text-right font-bold text-orange-400">{p.at_risk_count || '-'}</td>
                  <td className="px-2 py-2 text-right font-bold text-red-500">{p.breached_count || '-'}</td>
                  <td className="px-2 py-2 text-right font-bold text-accent">{p.escalated_count || '-'}</td>
                  <td className="px-3 py-2 text-right">
                    <span className={`font-bold ${p.sla_compliance_percent >= 95 ? 'text-emerald-500' : p.sla_compliance_percent >= 80 ? 'text-orange-400' : 'text-red-500'}`}>
                      {p.sla_compliance_percent}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Card>
  );
};

export const EscalationSummaryWidget: React.FC<WidgetProps> = ({ data }) => {
  const navigate = useNavigate();
  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="p-3 pb-0">
        <CardTitle className="text-xs font-bold uppercase text-muted tracking-wider">Escalation Summary</CardTitle>
      </CardHeader>
      <CardContent className="p-3 flex-1 flex flex-col justify-around">
        <div className="flex justify-between items-center cursor-pointer hover:opacity-80" onClick={() => navigate('/escalations?status=OPEN')}>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-bold uppercase text-muted">OPEN</span>
          </div>
          <span className="text-lg font-bold text-foreground">{data.escalation_metrics.open}</span>
        </div>
        <div className="flex justify-between items-center cursor-pointer hover:opacity-80" onClick={() => navigate('/escalations?status=ACKNOWLEDGED')}>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-orange-400" />
            <span className="text-xs font-bold uppercase text-muted">ACKNOWLEDGED</span>
          </div>
          <span className="text-lg font-bold text-foreground">{data.escalation_metrics.acknowledged}</span>
        </div>
        <div className="flex justify-between items-center cursor-pointer hover:opacity-80" onClick={() => navigate('/escalations?status=RESOLVED')}>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-bold uppercase text-muted">RESOLVED</span>
          </div>
          <span className="text-lg font-bold text-foreground">{data.escalation_metrics.resolved}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export const ActivityWidget: React.FC<WidgetProps> = ({ data, onTicketClick }) => {
  return (
    <Card className="flex flex-col h-full overflow-hidden">
      <CardHeader className="p-3 pb-2 border-b border-border-color">
        <CardTitle className="text-xs font-bold uppercase text-muted tracking-wider flex items-center gap-2">
          <Activity size={14} /> Recent Activity
        </CardTitle>
      </CardHeader>
      <div className="flex-1 overflow-y-auto p-3 custom-scrollbar space-y-3 relative before:absolute before:inset-y-0 before:left-[17px] before:w-px before:bg-border-color/50">
        {data.recent_activity.length === 0 ? (
          <div className="text-center text-xs text-muted italic">No recent activity.</div>
        ) : (
          data.recent_activity.map(act => (
            <div key={act.id} className="relative pl-7 text-[11px] hover:bg-surface-hover/50 p-1 rounded transition-colors cursor-pointer" onClick={() => act.ticket_id ? onTicketClick(act.ticket_id) : null}>
              <div className="absolute left-1 top-1.5 -ml-px h-2 w-2 rounded-full bg-accent border-2 border-surface" />
              <div className="flex justify-between items-start">
                <span className="font-bold text-foreground mr-2 whitespace-nowrap">{act.ticket_key}</span>
                <span className="text-muted/70 whitespace-nowrap">{formatDistanceToNow(new Date(act.created_at), { addSuffix: true })}</span>
              </div>
              <div className="text-muted leading-tight mt-0.5 line-clamp-2">{act.message}</div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};

export const UpcomingDeadlinesWidget: React.FC<WidgetProps> = ({ data, onTicketClick }) => {
  return (
    <Card className="flex flex-col h-full overflow-hidden">
      <CardHeader className="p-3 pb-2 border-b border-border-color">
        <CardTitle className="text-xs font-bold uppercase text-muted tracking-wider flex items-center gap-2">
          <Clock size={14} /> Upcoming SLA Deadlines
        </CardTitle>
      </CardHeader>
      <div className="flex-1 overflow-y-auto p-0 custom-scrollbar">
        {data.upcoming_deadlines.length === 0 ? (
          <div className="p-4 text-center text-xs text-muted italic">No upcoming deadlines.</div>
        ) : (
          <table className="w-full text-[11px] text-left">
            <tbody className="divide-y divide-border-color/50">
              {data.upcoming_deadlines.map(d => (
                <tr key={d.ticket_id} className="hover:bg-surface-hover cursor-pointer transition-colors" onClick={() => onTicketClick(d.ticket_id)}>
                  <td className="px-3 py-2 font-mono font-bold text-foreground">{d.ticket_key}</td>
                  <td className="px-2 py-2">
                    <Badge variant={d.priority === 'CRITICAL' ? 'critical' : d.priority === 'HIGH' ? 'high' : 'default'} className="text-[9px] py-0 px-1 border-none">
                      {d.priority}
                    </Badge>
                  </td>
                  <td className="px-3 py-2 text-right font-mono font-bold text-orange-400">
                    in {d.due_in_minutes}m
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Card>
  );
};

export const PersonalWorkWidget: React.FC<WidgetProps> = ({ data }) => {
  const navigate = useNavigate();
  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="p-3 pb-0">
        <CardTitle className="text-xs font-bold uppercase text-muted tracking-wider">My Work Summary</CardTitle>
      </CardHeader>
      <CardContent className="p-3 flex-1 grid grid-cols-2 gap-2">
        <div className="bg-surface-hover/50 p-2 rounded flex flex-col justify-center items-center cursor-pointer hover:border hover:border-border-color" onClick={() => navigate('/tickets')}>
          <div className="text-2xl font-bold text-foreground leading-none mb-1">{data.personal_metrics.assigned_to_me}</div>
          <div className="text-[10px] text-muted uppercase font-bold text-center">Assigned Tickets</div>
        </div>
        <div className="bg-surface-hover/50 p-2 rounded flex flex-col justify-center items-center cursor-pointer hover:border hover:border-orange-500/30" onClick={() => navigate('/tickets?sla_status=AT_RISK')}>
          <div className="text-2xl font-bold text-orange-400 leading-none mb-1">{data.personal_metrics.at_risk}</div>
          <div className="text-[10px] text-muted uppercase font-bold text-center">At Risk</div>
        </div>
        <div className="bg-surface-hover/50 p-2 rounded flex flex-col justify-center items-center cursor-pointer hover:border hover:border-accent/30" onClick={() => navigate('/escalations')}>
          <div className="text-2xl font-bold text-accent leading-none mb-1">{data.personal_metrics.escalated_to_me}</div>
          <div className="text-[10px] text-muted uppercase font-bold text-center">Escalated To Me</div>
        </div>
        <div className="bg-surface-hover/50 p-2 rounded flex flex-col justify-center items-center cursor-pointer hover:border hover:border-emerald-500/30" onClick={() => navigate('/tickets?status=RESOLVED')}>
          <div className="text-2xl font-bold text-emerald-500 leading-none mb-1">{data.personal_metrics.resolved_by_me}</div>
          <div className="text-[10px] text-muted uppercase font-bold text-center">Resolved By Me</div>
        </div>
      </CardContent>
    </Card>
  );
};

export const TeamWorkloadWidget: React.FC<WidgetProps> = ({ data }) => {
  return (
    <Card className="flex flex-col h-full overflow-hidden border-border-color">
      <CardHeader className="p-3 pb-0 border-b border-border-color/50">
        <CardTitle className="text-[11px] font-bold uppercase text-muted tracking-wider flex items-center gap-1.5">
          <Users size={12} /> Team Workload
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-y-auto custom-scrollbar min-h-0">
        <table className="w-full text-left border-collapse relative">
          <thead className="sticky top-0 bg-surface/95 backdrop-blur-sm z-10 border-b border-border-color/50 text-[10px] uppercase text-muted">
            <tr>
              <th className="font-bold p-2">Member</th>
              <th className="font-bold p-2 hidden xl:table-cell">Role</th>
              <th className="font-bold p-2 text-right">Assign</th>
              <th className="font-bold p-2 text-right">Active</th>
              <th className="font-bold p-2 text-right text-orange-400">Risk</th>
              <th className="font-bold p-2 text-right text-red-500">Breach</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-color/20">
            {data.team_workload.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center p-4 text-xs text-muted italic">No team members found.</td>
              </tr>
            )}
            {data.team_workload.map(u => (
              <tr key={u.user_id} className="hover:bg-white/5 transition-colors text-[11px] group">
                <td className="p-2 font-medium truncate max-w-[100px] text-foreground">{u.name}</td>
                <td className="p-2 text-muted hidden xl:table-cell truncate max-w-[80px]">{u.role.replace('_', ' ')}</td>
                <td className="p-2 text-right font-mono text-muted group-hover:text-foreground transition-colors">{u.assigned}</td>
                <td className="p-2 text-right font-mono text-foreground font-bold">{u.in_progress}</td>
                <td className={`p-2 text-right font-mono font-bold ${u.at_risk > 0 ? 'text-orange-400' : 'text-muted/30'}`}>{u.at_risk}</td>
                <td className={`p-2 text-right font-mono font-bold ${u.breached > 0 ? 'text-red-500' : 'text-muted/30'}`}>{u.breached}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
};

export const SlaByPriorityWidget: React.FC<WidgetProps> = ({ data }) => {
  return (
    <Card className="flex flex-col h-full overflow-hidden border-border-color">
      <CardHeader className="p-3 pb-0 border-b border-border-color/50">
        <CardTitle className="text-[11px] font-bold uppercase text-muted tracking-wider flex items-center gap-1.5">
          <AlertTriangle size={12} /> SLA By Priority
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-y-auto custom-scrollbar min-h-0">
        <table className="w-full text-left border-collapse relative">
          <thead className="sticky top-0 bg-surface/95 backdrop-blur-sm z-10 border-b border-border-color/50 text-[10px] uppercase text-muted">
            <tr>
              <th className="font-bold p-2">Priority</th>
              <th className="font-bold p-2 text-right text-emerald-500">Track</th>
              <th className="font-bold p-2 text-right text-orange-400">Risk</th>
              <th className="font-bold p-2 text-right text-red-500">Breach</th>
              <th className="font-bold p-2 text-right text-foreground">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-color/20">
            {data.sla_by_priority.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center p-4 text-xs text-muted italic">No SLAs tracked.</td>
              </tr>
            )}
            {data.sla_by_priority.map(s => (
              <tr key={s.priority} className="hover:bg-white/5 transition-colors text-[11px]">
                <td className="p-2">
                  <Badge variant={s.priority === 'CRITICAL' ? 'critical' : s.priority === 'HIGH' ? 'high' : 'default'} className="text-[9px] py-0 px-1 border-none">
                    {s.priority}
                  </Badge>
                </td>
                <td className={`p-2 text-right font-mono font-bold ${s.on_track > 0 ? 'text-emerald-500' : 'text-muted/30'}`}>{s.on_track}</td>
                <td className={`p-2 text-right font-mono font-bold ${s.at_risk > 0 ? 'text-orange-400' : 'text-muted/30'}`}>{s.at_risk}</td>
                <td className={`p-2 text-right font-mono font-bold ${s.breached > 0 ? 'text-red-500' : 'text-muted/30'}`}>{s.breached}</td>
                <td className="p-2 text-right font-mono font-bold text-foreground">{s.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
};

export const SeniorDeveloperKPIStrip: React.FC<WidgetProps> = ({ data }) => {
  const navigate = useNavigate();
  return (
    <div className="grid gap-2 grid-cols-2 lg:grid-cols-6 mb-2">
      <Card className="hover:border-accent cursor-pointer transition-colors" onClick={() => navigate('/tickets?assigned_to_me=true')}>
        <CardContent className="p-3">
          <div className="text-[10px] text-muted uppercase font-bold mb-1 flex justify-between">My Tickets <FileText size={12}/></div>
          <div className="text-2xl font-bold text-foreground leading-none">{data.personal_metrics.assigned_to_me}</div>
        </CardContent>
      </Card>
      <Card className="hover:border-accent cursor-pointer transition-colors" onClick={() => navigate('/tickets?assigned_to_me=true&status=IN_PROGRESS')}>
        <CardContent className="p-3">
          <div className="text-[10px] text-muted uppercase font-bold mb-1 flex justify-between">In Progress <Activity size={12}/></div>
          <div className="text-2xl font-bold text-blue-400 leading-none">{data.personal_metrics.in_progress}</div>
        </CardContent>
      </Card>
      <Card className="hover:border-accent cursor-pointer transition-colors" onClick={() => navigate('/tickets?assigned_to_me=true&sla_status=AT_RISK')}>
        <CardContent className="p-3">
          <div className="text-[10px] text-orange-400 uppercase font-bold mb-1 flex justify-between">At Risk <AlertTriangle size={12}/></div>
          <div className="text-2xl font-bold text-orange-400 leading-none">{data.personal_metrics.at_risk}</div>
        </CardContent>
      </Card>
      <Card className="hover:border-accent cursor-pointer transition-colors border-red-500/20 bg-red-500/5" onClick={() => navigate('/tickets?assigned_to_me=true&sla_status=BREACHED')}>
        <CardContent className="p-3">
          <div className="text-[10px] text-red-500 uppercase font-bold mb-1 flex justify-between">SLA Breached <ShieldAlert size={12}/></div>
          <div className="text-2xl font-bold text-red-500 leading-none">{data.personal_metrics.sla_breached}</div>
        </CardContent>
      </Card>
      <Card className="hover:border-accent cursor-pointer transition-colors" onClick={() => navigate('/escalations?assigned_to_me=true')}>
        <CardContent className="p-3">
          <div className="text-[10px] text-accent uppercase font-bold mb-1 flex justify-between">Escalated To Me <Zap size={12}/></div>
          <div className="text-2xl font-bold text-accent leading-none">{data.personal_metrics.escalated_to_me}</div>
        </CardContent>
      </Card>
      <Card className="hover:border-accent cursor-pointer transition-colors" onClick={() => navigate('/tickets?assigned_to_me=true&status=RESOLVED')}>
        <CardContent className="p-3">
          <div className="text-[10px] text-emerald-500 uppercase font-bold mb-1 flex justify-between">Resolved <CheckCircle size={12}/></div>
          <div className="text-2xl font-bold text-emerald-500 leading-none">{data.personal_metrics.resolved_by_me}</div>
        </CardContent>
      </Card>
    </div>
  );
};

export const DeveloperKPIStrip: React.FC<WidgetProps> = ({ data }) => {
  const navigate = useNavigate();
  return (
    <div className="grid gap-2 grid-cols-2 lg:grid-cols-6 mb-2">
      <Card className="hover:border-accent cursor-pointer transition-colors" onClick={() => navigate('/tickets?assigned_to_me=true')}>
        <CardContent className="p-3">
          <div className="text-[10px] text-muted uppercase font-bold mb-1 flex justify-between">My Tickets <FileText size={12}/></div>
          <div className="text-2xl font-bold text-foreground leading-none">{data.personal_metrics.assigned_to_me}</div>
        </CardContent>
      </Card>
      <Card className="hover:border-accent cursor-pointer transition-colors" onClick={() => navigate('/tickets?assigned_to_me=true&status=OPEN')}>
        <CardContent className="p-3">
          <div className="text-[10px] text-muted uppercase font-bold mb-1 flex justify-between">Open <Activity size={12}/></div>
          <div className="text-2xl font-bold text-foreground leading-none">{data.personal_metrics.open}</div>
        </CardContent>
      </Card>
      <Card className="hover:border-accent cursor-pointer transition-colors" onClick={() => navigate('/tickets?assigned_to_me=true&status=IN_PROGRESS')}>
        <CardContent className="p-3">
          <div className="text-[10px] text-blue-400 uppercase font-bold mb-1 flex justify-between">In Progress <Activity size={12}/></div>
          <div className="text-2xl font-bold text-blue-400 leading-none">{data.personal_metrics.in_progress}</div>
        </CardContent>
      </Card>
      <Card className="hover:border-accent cursor-pointer transition-colors" onClick={() => navigate('/tickets?assigned_to_me=true&sla_status=AT_RISK')}>
        <CardContent className="p-3">
          <div className="text-[10px] text-orange-400 uppercase font-bold mb-1 flex justify-between">At Risk <AlertTriangle size={12}/></div>
          <div className="text-2xl font-bold text-orange-400 leading-none">{data.personal_metrics.at_risk}</div>
        </CardContent>
      </Card>
      <Card className="hover:border-accent cursor-pointer transition-colors border-red-500/20 bg-red-500/5" onClick={() => navigate('/tickets?assigned_to_me=true&sla_status=BREACHED')}>
        <CardContent className="p-3">
          <div className="text-[10px] text-red-500 uppercase font-bold mb-1 flex justify-between">SLA Breached <ShieldAlert size={12}/></div>
          <div className="text-2xl font-bold text-red-500 leading-none">{data.personal_metrics.sla_breached}</div>
        </CardContent>
      </Card>
      <Card className="hover:border-accent cursor-pointer transition-colors" onClick={() => navigate('/tickets?assigned_to_me=true&status=RESOLVED')}>
        <CardContent className="p-3">
          <div className="text-[10px] text-emerald-500 uppercase font-bold mb-1 flex justify-between">Resolved <CheckCircle size={12}/></div>
          <div className="text-2xl font-bold text-emerald-500 leading-none">{data.personal_metrics.resolved_by_me}</div>
        </CardContent>
      </Card>
    </div>
  );
};

export const SeniorEscalationsWidget: React.FC<WidgetProps> = ({ data }) => {
  const navigate = useNavigate();
  return (
    <Card className="flex flex-col h-full border-border-color">
      <CardHeader className="p-3 pb-0 border-b border-border-color/50">
        <CardTitle className="text-[11px] font-bold uppercase text-muted tracking-wider flex justify-between items-center">
          <span className="flex items-center gap-1.5"><Zap size={12} className="text-accent" /> Escalations To Me</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 flex-1 flex flex-col justify-center gap-3">
        <div className="flex justify-between items-center cursor-pointer hover:opacity-80" onClick={() => navigate('/escalations?assigned_to_me=true&status=OPEN')}>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-xs font-bold uppercase text-muted">OPEN</span>
          </div>
          <span className="text-lg font-bold text-foreground">{data.personal_escalations.open}</span>
        </div>
        <div className="flex justify-between items-center cursor-pointer hover:opacity-80" onClick={() => navigate('/escalations?assigned_to_me=true&status=ACKNOWLEDGED')}>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-orange-400" />
            <span className="text-xs font-bold uppercase text-muted">ACKNOWLEDGED</span>
          </div>
          <span className="text-lg font-bold text-foreground">{data.personal_escalations.acknowledged}</span>
        </div>
        <div className="flex justify-between items-center cursor-pointer hover:opacity-80" onClick={() => navigate('/escalations?assigned_to_me=true&status=RESOLVED')}>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-bold uppercase text-muted">RESOLVED</span>
          </div>
          <span className="text-lg font-bold text-foreground">{data.personal_escalations.resolved}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export const DeveloperActiveTicketsWidget: React.FC<WidgetProps> = ({ data, onTicketClick }) => {
  // Use attention_tickets which for developers has already been filtered to their open tickets
  return (
    <Card className="flex flex-col h-full overflow-hidden border-border-color">
      <CardHeader className="p-3 pb-0 border-b border-border-color/50">
        <CardTitle className="text-[11px] font-bold uppercase text-muted tracking-wider flex items-center gap-1.5">
          <FileText size={12} /> My Active Tickets
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-y-auto custom-scrollbar min-h-0">
        <table className="w-full text-left border-collapse relative">
          <thead className="sticky top-0 bg-surface/95 backdrop-blur-sm z-10 border-b border-border-color/50 text-[10px] uppercase text-muted">
            <tr>
              <th className="font-bold p-2 pl-3">ID</th>
              <th className="font-bold p-2">Title</th>
              <th className="font-bold p-2 hidden sm:table-cell">Priority</th>
              <th className="font-bold p-2 hidden md:table-cell">Status</th>
              <th className="font-bold p-2 text-right">SLA</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-color/20">
            {data.attention_tickets.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center p-6 text-xs text-muted italic">No tickets are currently assigned to you.</td>
              </tr>
            )}
            {data.attention_tickets.map(t => (
              <tr key={t.id} className="hover:bg-white/5 transition-colors cursor-pointer text-[11px] group" onClick={() => onTicketClick(t.id)}>
                <td className="p-2 pl-3 font-mono font-bold text-foreground group-hover:text-accent transition-colors">
                  {t.ticket_key}
                </td>
                <td className="p-2">
                  <div className="font-bold text-foreground truncate max-w-[250px]">{t.title}</div>
                </td>
                <td className="p-2 hidden sm:table-cell">
                  <Badge variant={t.priority === 'CRITICAL' ? 'critical' : t.priority === 'HIGH' ? 'high' : 'default'} className="text-[9px] py-0 px-1 border-none">
                    {t.priority}
                  </Badge>
                </td>
                <td className="p-2 hidden md:table-cell">
                  <Badge variant="outline" className="text-[9px] py-0 px-1 border-border-color/50">
                    {t.status.replace('_', ' ')}
                  </Badge>
                </td>
                <td className="p-2 text-right font-mono font-bold">
                  {t.reason_code === 1 ? (
                    <span className="text-red-500">BREACHED</span>
                  ) : t.due_in_minutes !== null ? (
                    <span className={t.due_in_minutes < 60 ? 'text-orange-400' : 'text-emerald-500'}>
                      {t.due_in_minutes}m
                    </span>
                  ) : (
                    <span className="text-muted/50">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
};

export const QuickStatusWidget: React.FC<WidgetProps> = ({ data }) => {
  return (
    <Card className="flex flex-col h-full border-border-color">
      <CardHeader className="p-3 pb-0 border-b border-border-color/50">
        <CardTitle className="text-[11px] font-bold uppercase text-muted tracking-wider flex items-center gap-1.5">
          <Activity size={12} /> Quick Status
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 flex-1 grid grid-cols-2 gap-2">
        <div className="bg-surface-hover/50 p-2 rounded flex flex-col justify-center items-center">
          <div className="text-2xl font-bold text-foreground leading-none mb-1">{data.personal_metrics.open}</div>
          <div className="text-[10px] text-muted uppercase font-bold text-center">Open</div>
        </div>
        <div className="bg-surface-hover/50 p-2 rounded flex flex-col justify-center items-center">
          <div className="text-2xl font-bold text-blue-400 leading-none mb-1">{data.personal_metrics.in_progress}</div>
          <div className="text-[10px] text-muted uppercase font-bold text-center">In Progress</div>
        </div>
        <div className="bg-surface-hover/50 p-2 rounded flex flex-col justify-center items-center border border-red-500/20">
          <div className="text-2xl font-bold text-red-500 leading-none mb-1">{data.personal_metrics.sla_breached}</div>
          <div className="text-[10px] text-red-500 uppercase font-bold text-center">SLA Breached</div>
        </div>
        <div className="bg-surface-hover/50 p-2 rounded flex flex-col justify-center items-center">
          <div className="text-2xl font-bold text-emerald-500 leading-none mb-1">{data.personal_metrics.resolved_by_me}</div>
          <div className="text-[10px] text-muted uppercase font-bold text-center">Resolved</div>
        </div>
      </CardContent>
    </Card>
  );
};
