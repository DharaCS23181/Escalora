import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { Button } from '../ui/Button';
import { slaService } from '../../services/sla';
import type { SLAPolicy, SLAPolicyCreate, SLAPolicyUpdate } from '../../services/sla';
import type { TicketPriority } from '../../services/ticket';
import toast from 'react-hot-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  policyToEdit: SLAPolicy | null;
}

export default function CreateSlaDrawer({ isOpen, onClose, onSuccess, policyToEdit }: Props) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<{
    name: string;
    priority: TicketPriority;
    response_time_minutes: number;
    resolution_time_minutes: number;
    at_risk_threshold_percent: number;
    active: boolean;
  }>({
    name: '',
    priority: 'LOW',
    response_time_minutes: 60,
    resolution_time_minutes: 240,
    at_risk_threshold_percent: 20,
    active: true,
  });

  useEffect(() => {
    if (policyToEdit) {
      setFormData({
        name: policyToEdit.name,
        priority: policyToEdit.priority as TicketPriority,
        response_time_minutes: policyToEdit.response_time_minutes,
        resolution_time_minutes: policyToEdit.resolution_time_minutes,
        at_risk_threshold_percent: policyToEdit.at_risk_threshold_percent,
        active: policyToEdit.active,
      });
    } else {
      setFormData({
        name: '',
        priority: 'LOW',
        response_time_minutes: 60,
        resolution_time_minutes: 240,
        at_risk_threshold_percent: 20,
        active: true,
      });
    }
  }, [policyToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setLoading(true);
    try {
      if (policyToEdit) {
        await slaService.updatePolicy(policyToEdit.id, formData as SLAPolicyUpdate);
        toast.success('SLA Policy updated');
      } else {
        await slaService.createPolicy(formData as SLAPolicyCreate);
        toast.success('SLA Policy created');
      }
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to save policy');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-background/80 backdrop-blur-sm">
      <div className="w-full sm:w-[450px] bg-surface border-l border-border-color h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        <div className="flex-none p-4 border-b border-border-color flex justify-between items-center bg-surface-hover/30">
          <h2 className="text-accent font-bold uppercase tracking-wider text-sm">
            {policyToEdit ? 'Edit SLA Policy' : 'New SLA Policy'}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X size={18} /></Button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div>
              <label className="block text-xs uppercase text-muted font-bold mb-1">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-background text-foreground border border-border-color px-3 py-2 text-sm focus:outline-none focus:border-accent rounded-md transition-colors"
                placeholder="e.g. Critical Enterprise SLA"
                required
              />
            </div>

            <div>
              <label className="block text-xs uppercase text-muted font-bold mb-1">Priority Target</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as TicketPriority })}
                className="w-full bg-background text-foreground border border-border-color px-3 py-2 text-sm focus:outline-none focus:border-accent rounded-md transition-colors"
              >
                <option value="CRITICAL">CRITICAL</option>
                <option value="HIGH">HIGH</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="LOW">LOW</option>
              </select>
            </div>

            <div>
              <label className="block text-xs uppercase text-muted font-bold mb-1">Response Time (Minutes)</label>
              <input
                type="number"
                min="1"
                value={formData.response_time_minutes}
                onChange={(e) => setFormData({ ...formData, response_time_minutes: parseInt(e.target.value) || 1 })}
                className="w-full bg-background text-foreground border border-border-color px-3 py-2 text-sm focus:outline-none focus:border-accent rounded-md font-mono transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-xs uppercase text-muted font-bold mb-1">Resolution Time (Minutes)</label>
              <input
                type="number"
                min="1"
                value={formData.resolution_time_minutes}
                onChange={(e) => setFormData({ ...formData, resolution_time_minutes: parseInt(e.target.value) || 1 })}
                className="w-full bg-background text-foreground border border-border-color px-3 py-2 text-sm focus:outline-none focus:border-accent rounded-md font-mono transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-xs uppercase text-muted font-bold mb-1">At Risk Threshold (%)</label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="1"
                  max="99"
                  value={formData.at_risk_threshold_percent}
                  onChange={(e) => setFormData({ ...formData, at_risk_threshold_percent: parseInt(e.target.value) })}
                  className="flex-1 accent-accent"
                />
                <span className="text-accent font-mono text-sm font-bold w-10 text-right">
                  {formData.at_risk_threshold_percent}%
                </span>
              </div>
              <p className="text-[11px] text-muted mt-1.5 uppercase">Tickets will be marked "At Risk" when this % of time remains.</p>
            </div>
          </div>

          <div className="flex-none p-4 border-t border-border-color bg-surface flex justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="px-6"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="px-6 gap-2"
            >
              <Save size={16} /> {loading ? 'Saving...' : 'Save Policy'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
