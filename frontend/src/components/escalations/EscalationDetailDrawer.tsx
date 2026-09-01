import React from 'react';
import { X, Zap, Clock, User as UserIcon, ShieldAlert } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { escalationService } from '../../services/escalation';
import type { Escalation } from '../../services/escalation';
import { useAuthStore } from '../../store/authStore';
import { formatDistanceToNow } from 'date-fns';

interface EscalationDetailDrawerProps {
  escalation: Escalation;
  onClose: () => void;
  onUpdated: () => void;
}

export const EscalationDetailDrawer: React.FC<EscalationDetailDrawerProps> = ({ escalation, onClose, onUpdated }) => {
  const { user } = useAuthStore();
  const isAssigned = escalation.assigned_to_id === user?.id;
  const isSeniorDev = user?.role === 'SENIOR_DEVELOPER';
  const isAdmin = user?.role === 'ADMIN';
  const canAct = isAssigned || isAdmin;
  const isActive = escalation.status === 'OPEN' || escalation.status === 'ACKNOWLEDGED';

  const handleAcknowledge = async () => {
    try {
      await escalationService.acknowledge(escalation.id);
      onUpdated();
    } catch (e: any) {
      alert(e.response?.data?.detail || 'Failed to acknowledge');
    }
  };

  const handleTakeOver = async () => {
    try {
      await escalationService.takeOver(escalation.id);
      onUpdated();
    } catch (e: any) {
      alert(e.response?.data?.detail || 'Failed to take over');
    }
  };

  const handleResolve = async () => {
    try {
      await escalationService.resolve(escalation.id);
      onUpdated();
    } catch (e: any) {
      alert(e.response?.data?.detail || 'Failed to resolve');
    }
  };

  const statusColor = escalation.status === 'OPEN' ? 'text-red-500' :
    escalation.status === 'ACKNOWLEDGED' ? 'text-orange-400' :
    escalation.status === 'RESOLVED' ? 'text-emerald-500' : 'text-muted';

  return (
    <>
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 animate-in fade-in" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-full sm:w-[420px] bg-surface border-l border-border-color shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-color bg-surface-hover/30">
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-accent" />
            <span className="text-sm font-bold">ESCALATION</span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}><X size={18} /></Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Ticket Info */}
          <div>
            <span className="text-xs font-mono font-bold text-muted">{escalation.ticket_key}</span>
            <h2 className="text-lg font-bold leading-tight mt-1">{escalation.ticket_title}</h2>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <Zap size={14} className="text-accent" />
            <span className={`text-xs font-bold uppercase ${statusColor}`}>{escalation.status}</span>
            <Badge variant={escalation.ticket_priority === 'CRITICAL' ? 'critical' : escalation.ticket_priority === 'HIGH' ? 'high' : 'default'} className="text-[10px] py-0 ml-auto">
              {escalation.ticket_priority}
            </Badge>
          </div>

          {/* Details Grid */}
          <div className="bg-background/50 border border-border-color/50 rounded-lg p-3 space-y-2.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted flex items-center gap-2"><ShieldAlert size={14} /> Trigger</span>
              <span className="font-medium">{escalation.trigger_type === 'SLA_BREACH' ? 'SLA Breach' : 'Manual'}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted flex items-center gap-2"><Clock size={14} /> Reason</span>
              <span className="font-medium text-right max-w-[200px] truncate">{escalation.reason}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted flex items-center gap-2"><UserIcon size={14} /> Original Assignee</span>
              <span className="font-medium">{escalation.triggered_by?.full_name || 'System'}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted flex items-center gap-2"><UserIcon size={14} /> Escalated To</span>
              <span className="font-medium text-accent">{escalation.assigned_to?.full_name || 'Unassigned'}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">Project</span>
              <span>{escalation.project_name}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">Created</span>
              <span>{formatDistanceToNow(new Date(escalation.created_at), { addSuffix: true })}</span>
            </div>
            {escalation.acknowledged_at && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">Acknowledged</span>
                <span>{formatDistanceToNow(new Date(escalation.acknowledged_at), { addSuffix: true })}</span>
              </div>
            )}
            {escalation.resolved_at && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">Resolved</span>
                <span>{formatDistanceToNow(new Date(escalation.resolved_at), { addSuffix: true })}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          {isActive && canAct && (isSeniorDev || isAdmin) && (
            <div className="space-y-2 pt-2 border-t border-border-color">
              {escalation.status === 'OPEN' && (
                <Button variant="outline" className="w-full gap-2" onClick={handleAcknowledge}>
                  Acknowledge
                </Button>
              )}
              <Button variant="default" className="w-full gap-2" onClick={handleTakeOver}>
                <Zap size={14} /> Take Over
              </Button>
              {escalation.status === 'ACKNOWLEDGED' && (
                <Button variant="outline" className="w-full gap-2 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/10" onClick={handleResolve}>
                  Resolve Escalation
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
