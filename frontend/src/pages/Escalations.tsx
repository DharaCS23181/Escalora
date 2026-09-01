import React, { useEffect, useState, useCallback } from 'react';
import { Zap, Search, Filter } from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { escalationService } from '../services/escalation';
import { projectService } from '../services/project';
import type { Escalation, EscalationMetrics } from '../services/escalation';
import type { Project } from '../services/project';
import { EscalationDetailDrawer } from '../components/escalations/EscalationDetailDrawer';
import { useAuthStore } from '../store/authStore';
import { formatDistanceToNow } from 'date-fns';

export const Escalations: React.FC = () => {
  const { user } = useAuthStore();
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [metrics, setMetrics] = useState<EscalationMetrics | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEsc, setSelectedEsc] = useState<Escalation | null>(null);

  // Filters
  const [filterProject, setFilterProject] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterTrigger, setFilterTrigger] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const params: Record<string, string> = {};
      if (filterProject) params.project_id = filterProject;
      if (filterStatus) params.status = filterStatus;
      if (filterTrigger) params.trigger_type = filterTrigger;

      const [escData, metricsData, projData] = await Promise.all([
        escalationService.getEscalations(params),
        escalationService.getMetrics(),
        projectService.getProjects(),
      ]);
      setEscalations(escData);
      setMetrics(metricsData);
      setProjects(projData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filterProject, filterStatus, filterTrigger]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = escalations.filter(e => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      e.ticket_key?.toLowerCase().includes(term) ||
      e.ticket_title?.toLowerCase().includes(term) ||
      e.assigned_to?.full_name?.toLowerCase().includes(term) ||
      e.project_name?.toLowerCase().includes(term)
    );
  });

  const priorityBadge = (p: string | null) => {
    if (!p) return null;
    const variant = p === 'CRITICAL' ? 'critical' : p === 'HIGH' ? 'high' : p === 'LOW' ? 'low' : 'default';
    return <Badge variant={variant} className="text-[10px] py-0">{p}</Badge>;
  };

  const statusColor = (s: string) =>
    s === 'OPEN' ? 'text-red-500 bg-red-500/10' :
    s === 'ACKNOWLEDGED' ? 'text-orange-400 bg-orange-400/10' :
    s === 'RESOLVED' ? 'text-emerald-500 bg-emerald-500/10' :
    'text-muted bg-surface-hover';

  if (loading) {
    return <div className="p-8 text-center text-muted animate-pulse">Loading escalations...</div>;
  }

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex-shrink-0 space-y-3 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Zap size={22} className="text-accent" /> Escalations
            </h2>
            <p className="text-sm text-muted mt-0.5">Monitor and manage ticket escalations.</p>
          </div>
        </div>

        {/* Metrics Bar */}
        {metrics && (
          <div className="flex gap-3">
            <div className="flex-1 bg-surface border border-border-color rounded-lg px-3 py-2">
              <div className="text-xs text-muted">Open</div>
              <div className="text-xl font-bold text-red-500">{metrics.open_count}</div>
            </div>
            <div className="flex-1 bg-surface border border-border-color rounded-lg px-3 py-2">
              <div className="text-xs text-muted">Acknowledged</div>
              <div className="text-xl font-bold text-orange-400">{metrics.acknowledged_count}</div>
            </div>
            <div className="flex-1 bg-surface border border-border-color rounded-lg px-3 py-2">
              <div className="text-xs text-muted">Resolved</div>
              <div className="text-xl font-bold text-emerald-500">{metrics.resolved_count}</div>
            </div>
            <div className="flex-1 bg-surface border border-border-color rounded-lg px-3 py-2">
              <div className="text-xs text-muted">Today</div>
              <div className="text-xl font-bold text-accent">{metrics.today_count}</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search tickets, assignees..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full h-9 pl-9 pr-3 bg-background border border-border-color rounded-md text-sm focus:outline-none focus:border-accent"
            />
          </div>
          <select
            value={filterProject}
            onChange={e => setFilterProject(e.target.value)}
            className="h-9 px-2 bg-background border border-border-color rounded-md text-sm focus:outline-none focus:border-accent"
          >
            <option value="">All Projects</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="h-9 px-2 bg-background border border-border-color rounded-md text-sm focus:outline-none focus:border-accent"
          >
            <option value="">All Status</option>
            <option value="OPEN">Open</option>
            <option value="ACKNOWLEDGED">Acknowledged</option>
            <option value="RESOLVED">Resolved</option>
          </select>
          <select
            value={filterTrigger}
            onChange={e => setFilterTrigger(e.target.value)}
            className="h-9 px-2 bg-background border border-border-color rounded-md text-sm focus:outline-none focus:border-accent"
          >
            <option value="">All Triggers</option>
            <option value="SLA_BREACH">SLA Breach</option>
            <option value="MANUAL">Manual</option>
          </select>
        </div>
      </div>

      {/* Dense Table */}
      <div className="flex-1 overflow-y-auto border border-border-color rounded-lg">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-surface-hover/80 backdrop-blur-sm border-b border-border-color">
            <tr>
              <th className="text-left px-3 py-2.5 text-xs font-semibold text-muted uppercase tracking-wider">Ticket</th>
              <th className="text-left px-3 py-2.5 text-xs font-semibold text-muted uppercase tracking-wider">Priority</th>
              <th className="text-left px-3 py-2.5 text-xs font-semibold text-muted uppercase tracking-wider hidden md:table-cell">Project</th>
              <th className="text-left px-3 py-2.5 text-xs font-semibold text-muted uppercase tracking-wider">Assigned To</th>
              <th className="text-left px-3 py-2.5 text-xs font-semibold text-muted uppercase tracking-wider hidden lg:table-cell">Trigger</th>
              <th className="text-left px-3 py-2.5 text-xs font-semibold text-muted uppercase tracking-wider">Status</th>
              <th className="text-left px-3 py-2.5 text-xs font-semibold text-muted uppercase tracking-wider hidden lg:table-cell">Created</th>
              <th className="text-left px-3 py-2.5 text-xs font-semibold text-muted uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(esc => (
              <tr
                key={esc.id}
                className="border-b border-border-color/30 hover:bg-surface-hover/30 cursor-pointer transition-colors"
                onClick={() => setSelectedEsc(esc)}
              >
                <td className="px-3 py-2.5">
                  <div className="font-mono text-xs font-bold text-muted">{esc.ticket_key}</div>
                  <div className="text-sm font-medium truncate max-w-[200px]">{esc.ticket_title}</div>
                </td>
                <td className="px-3 py-2.5">{priorityBadge(esc.ticket_priority)}</td>
                <td className="px-3 py-2.5 hidden md:table-cell text-xs text-muted">{esc.project_name}</td>
                <td className="px-3 py-2.5 text-sm">{esc.assigned_to?.full_name || <span className="text-muted italic">Unassigned</span>}</td>
                <td className="px-3 py-2.5 hidden lg:table-cell">
                  <span className="text-[10px] font-bold uppercase text-muted">{esc.trigger_type === 'SLA_BREACH' ? 'SLA BREACH' : 'MANUAL'}</span>
                </td>
                <td className="px-3 py-2.5">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-sm ${statusColor(esc.status)}`}>
                    {esc.status}
                  </span>
                </td>
                <td className="px-3 py-2.5 hidden lg:table-cell text-xs text-muted">
                  {formatDistanceToNow(new Date(esc.created_at), { addSuffix: true })}
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                    {esc.status === 'OPEN' && (user?.role === 'SENIOR_DEVELOPER' || user?.role === 'ADMIN') && (esc.assigned_to_id === user?.id || user?.role === 'ADMIN') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[11px] h-7 px-2"
                        onClick={async () => {
                          try { await escalationService.acknowledge(esc.id); fetchData(); } catch (e: any) { alert(e.response?.data?.detail || 'Failed'); }
                        }}
                      >
                        Acknowledge
                      </Button>
                    )}
                    {(esc.status === 'OPEN' || esc.status === 'ACKNOWLEDGED') && (user?.role === 'SENIOR_DEVELOPER' || user?.role === 'ADMIN') && (esc.assigned_to_id === user?.id || user?.role === 'ADMIN') && (
                      <Button
                        variant="default"
                        size="sm"
                        className="text-[11px] h-7 px-2 gap-1"
                        onClick={async () => {
                          try { await escalationService.takeOver(esc.id); fetchData(); } catch (e: any) { alert(e.response?.data?.detail || 'Failed'); }
                        }}
                      >
                        <Zap size={10} /> Take Over
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-12 text-muted">
                  {escalations.length === 0 ? 'No active escalations.' : 'No escalations match your filters.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Drawer */}
      {selectedEsc && (
        <EscalationDetailDrawer
          escalation={selectedEsc}
          onClose={() => setSelectedEsc(null)}
          onUpdated={() => { setSelectedEsc(null); fetchData(); }}
        />
      )}
    </div>
  );
};

export default Escalations;
