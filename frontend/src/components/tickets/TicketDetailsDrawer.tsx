import React, { useEffect, useState } from 'react';
import { X, Clock, Activity, UserPlus, ShieldAlert, CheckCircle, ListTodo } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import { ticketService, type Ticket, type TicketActivity } from '../../services/ticket';
import { projectService } from '../../services/project';
import { useAuthStore } from '../../store/authStore';
import { formatDistanceToNow } from 'date-fns';

interface TicketDetailsDrawerProps {
  ticketId: string;
  onClose: () => void;
  onUpdated: () => void;
}

export const TicketDetailsDrawer: React.FC<TicketDetailsDrawerProps> = ({ ticketId, onClose, onUpdated }) => {
  const { user } = useAuthStore();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [activities, setActivities] = useState<TicketActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectMembers, setProjectMembers] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [tData, aData] = await Promise.all([
          ticketService.getTicket(ticketId),
          ticketService.getActivity(ticketId)
        ]);
        setTicket(tData);
        setActivities(aData);
        
        // Fetch project members for assignment
        const members = await projectService.getMembers(tData.project_id);
        setProjectMembers(members);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [ticketId]);

  const handleAssign = async (assigneeId: string | null) => {
    if (!ticket) return;
    try {
      await ticketService.assignTicket(ticket.id, assigneeId);
      const [tData, aData] = await Promise.all([
        ticketService.getTicket(ticketId),
        ticketService.getActivity(ticketId)
      ]);
      setTicket(tData);
      setActivities(aData);
      onUpdated();
    } catch (e: any) {
      alert(e.response?.data?.detail || "Failed to assign ticket");
    }
  };

  const handleStatusChange = async (status: any) => {
    if (!ticket) return;
    try {
      await ticketService.updateStatus(ticket.id, status);
      const [tData, aData] = await Promise.all([
        ticketService.getTicket(ticketId),
        ticketService.getActivity(ticketId)
      ]);
      setTicket(tData);
      setActivities(aData);
      onUpdated();
    } catch (e: any) {
      alert(e.response?.data?.detail || "Failed to update status");
    }
  };

  if (loading) {
    return (
      <>
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 animate-in fade-in" onClick={onClose} />
        <div className="fixed inset-y-0 right-0 w-full sm:w-[450px] bg-surface border-l border-border-color shadow-2xl z-50 flex items-center justify-center">
          Loading ticket...
        </div>
      </>
    );
  }

  if (!ticket) return null;

  return (
    <>
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 animate-in fade-in" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-full sm:w-[450px] md:w-[500px] bg-surface border-l border-border-color shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-color bg-surface-hover/30">
          <div className="flex items-center gap-3">
            <span className="text-sm font-mono font-bold text-muted">{ticket.ticket_key}</span>
            <Badge variant={ticket.priority === 'CRITICAL' ? 'critical' : ticket.priority === 'HIGH' ? 'high' : 'default'} className="text-[10px] py-0.5">
              {ticket.priority}
            </Badge>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}><X size={18} /></Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          <div>
            <h2 className="text-xl font-bold leading-tight mb-2">{ticket.title}</h2>
            <p className="text-sm text-muted whitespace-pre-wrap">{ticket.description || "No description provided."}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted uppercase tracking-wider">Status</label>
              <select 
                value={ticket.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="w-full h-9 px-2 bg-background border border-border-color rounded-md text-sm font-medium focus:outline-none focus:border-accent"
              >
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted uppercase tracking-wider">Assignee</label>
              <select 
                value={ticket.assignee_id || ""}
                onChange={(e) => handleAssign(e.target.value || null)}
                className="w-full h-9 px-2 bg-background border border-border-color rounded-md text-sm font-medium focus:outline-none focus:border-accent"
              >
                <option value="">Unassigned</option>
                {projectMembers.map(pm => (
                  <option key={pm.user.id} value={pm.user.id}>
                    {pm.user.full_name} ({pm.role.replace('_', ' ')})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* SLA & Details */}
          <div className="bg-background/50 border border-border-color/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted flex items-center gap-2"><Clock size={14} /> Created</span>
              <span>{formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}</span>
            </div>
            {ticket.sla_due_at && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted flex items-center gap-2"><ShieldAlert size={14} /> SLA Due</span>
                <span className={new Date(ticket.sla_due_at) < new Date() && ticket.status !== 'RESOLVED' ? 'text-red-500 font-bold' : ''}>
                  {formatDistanceToNow(new Date(ticket.sla_due_at), { addSuffix: true })}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted flex items-center gap-2"><CheckCircle size={14} /> Type</span>
              <span>{ticket.type}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted flex items-center gap-2"><ListTodo size={14} /> Escalation</span>
              <Badge variant="outline" className="text-[10px] py-0">{ticket.escalation_status}</Badge>
            </div>
          </div>

          {/* Activity Stream */}
          <div>
            <h3 className="text-sm font-bold flex items-center gap-2 mb-4">
              <Activity size={16} className="text-accent" /> Activity Log
            </h3>
            <div className="space-y-4 relative before:absolute before:inset-y-0 before:left-3.5 before:w-px before:bg-border-color/50">
              {activities.map(act => (
                <div key={act.id} className="relative pl-10">
                  <div className="absolute left-2.5 -ml-px h-3 w-3 rounded-full bg-accent border-4 border-surface" />
                  <div className="text-sm">
                    <span className="font-semibold text-foreground">{act.actor?.full_name || 'System'}</span>
                    <span className="text-muted mx-1">
                      {act.action === 'CREATED' && 'created this ticket'}
                      {act.action === 'STATUS_CHANGED' && `changed status from ${act.old_value} to ${act.new_value}`}
                      {act.action === 'ASSIGNED' && `assigned ticket to ${act.new_value === 'Unassigned' ? 'nobody' : act.new_value}`}
                    </span>
                  </div>
                  <div className="text-[11px] text-muted/60 mt-0.5">
                    {formatDistanceToNow(new Date(act.created_at), { addSuffix: true })}
                  </div>
                </div>
              ))}
              {activities.length === 0 && (
                <div className="pl-10 text-sm text-muted">No activity recorded yet.</div>
              )}
            </div>
          </div>
        </div>
        
      </div>
    </>
  );
};
