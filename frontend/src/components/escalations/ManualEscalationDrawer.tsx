import React, { useEffect, useState } from 'react';
import { X, Zap } from 'lucide-react';
import { Button } from '../ui/Button';
import { escalationService } from '../../services/escalation';
import { projectService } from '../../services/project';
import type { ProjectMember } from '../../services/project';

interface ManualEscalationDrawerProps {
  ticketId: string;
  projectId: string;
  ticketKey: string;
  onClose: () => void;
  onCreated: () => void;
}

const REASONS = [
  'SLA Risk',
  'Technical Complexity',
  'Customer Impact',
  'Operational Risk',
  'Other',
];

export const ManualEscalationDrawer: React.FC<ManualEscalationDrawerProps> = ({ ticketId, projectId, ticketKey, onClose, onCreated }) => {
  const [reason, setReason] = useState(REASONS[0]);
  const [assignedToId, setAssignedToId] = useState('');
  const [seniorDevs, setSeniorDevs] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    projectService.getMembers(projectId).then(members => {
      const seniors = members.filter(m => m.role === 'SENIOR_DEVELOPER');
      setSeniorDevs(seniors);
      if (seniors.length > 0) setAssignedToId(seniors[0].user.id);
    });
  }, [projectId]);

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      await escalationService.createEscalation({
        ticket_id: ticketId,
        reason,
        assigned_to_id: assignedToId || null,
      });
      onCreated();
      onClose();
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Failed to escalate ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 animate-in fade-in" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-full sm:w-[380px] bg-surface border-l border-border-color shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-color bg-surface-hover/30">
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-accent" />
            <span className="text-sm font-bold">ESCALATE TICKET</span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}><X size={18} /></Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <p className="text-sm text-muted">
            Escalate <span className="font-bold text-foreground">{ticketKey}</span> to a Senior Developer.
          </p>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted uppercase tracking-wider">Reason</label>
            <select
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full h-10 px-3 bg-background border border-border-color rounded-md text-sm focus:outline-none focus:border-accent"
            >
              {REASONS.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted uppercase tracking-wider">Escalate To</label>
            {seniorDevs.length > 0 ? (
              <select
                value={assignedToId}
                onChange={e => setAssignedToId(e.target.value)}
                className="w-full h-10 px-3 bg-background border border-border-color rounded-md text-sm focus:outline-none focus:border-accent"
              >
                {seniorDevs.map(sd => (
                  <option key={sd.user.id} value={sd.user.id}>{sd.user.full_name}</option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-red-500 bg-red-500/10 p-2 rounded-md">
                No eligible Senior Developer available for this project.
              </p>
            )}
          </div>

          {error && (
            <div className="text-sm text-red-500 bg-red-500/10 p-2 rounded-md">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border-color flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button
            variant="default"
            className="flex-1 gap-2"
            onClick={handleSubmit}
            disabled={loading || !assignedToId}
          >
            <Zap size={14} /> {loading ? 'Escalating...' : 'Escalate'}
          </Button>
        </div>
      </div>
    </>
  );
};
