import React, { useEffect, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { ticketService, type TicketCreate } from '../../services/ticket';
import { projectService, type Project } from '../../services/project';

interface CreateTicketDrawerProps {
  onClose: () => void;
  onCreated: () => void;
}

export const CreateTicketDrawer: React.FC<CreateTicketDrawerProps> = ({ onClose, onCreated }) => {
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectMembers, setProjectMembers] = useState<any[]>([]);
  
  const [formData, setFormData] = useState<TicketCreate>({
    title: '',
    description: '',
    type: 'TASK',
    priority: 'MEDIUM',
    project_id: '',
    assignee_id: ''
  });

  useEffect(() => {
    projectService.getProjects().then(data => {
      setProjects(data);
      if (data.length === 1) {
        setFormData(prev => ({ ...prev, project_id: data[0].id }));
      }
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (formData.project_id) {
      projectService.getMembers(formData.project_id).then(setProjectMembers).catch(console.error);
    } else {
      setProjectMembers([]);
    }
  }, [formData.project_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await ticketService.createTicket({
        ...formData,
        assignee_id: formData.assignee_id || undefined,
        description: formData.description || undefined,
      });
      onCreated();
      onClose();
    } catch (e: any) {
      alert(e.response?.data?.detail || "Failed to create ticket");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 animate-in fade-in" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-full sm:w-[450px] md:w-[500px] bg-surface border-l border-border-color shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
        
        <div className="flex items-center justify-between p-4 border-b border-border-color bg-surface-hover/30">
          <h2 className="text-lg font-bold">Create New Ticket</h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X size={18} /></Button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted uppercase tracking-wider">Project *</label>
            <select 
              required
              value={formData.project_id}
              onChange={(e) => setFormData({ ...formData, project_id: e.target.value, assignee_id: '' })}
              className="w-full h-10 px-3 bg-background border border-border-color rounded-md text-sm focus:outline-none focus:border-accent transition-colors"
            >
              <option value="">Select a project...</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.key} - {p.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted uppercase tracking-wider">Summary *</label>
            <input 
              required
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full h-10 px-3 bg-background border border-border-color rounded-md text-sm focus:outline-none focus:border-accent transition-colors"
              placeholder="E.g. Fix database latency in production"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted uppercase tracking-wider">Description</label>
            <textarea 
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full min-h-[120px] p-3 bg-background border border-border-color rounded-md text-sm focus:outline-none focus:border-accent transition-colors resize-y"
              placeholder="Provide detailed steps to reproduce, expected behavior, etc."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted uppercase tracking-wider">Type *</label>
              <select 
                required
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full h-10 px-3 bg-background border border-border-color rounded-md text-sm focus:outline-none focus:border-accent transition-colors"
              >
                <option value="BUG">Bug</option>
                <option value="INCIDENT">Incident</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="TASK">Task</option>
                <option value="CHANGE_REQUEST">Change Request</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted uppercase tracking-wider">Priority *</label>
              <select 
                required
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                className="w-full h-10 px-3 bg-background border border-border-color rounded-md text-sm focus:outline-none focus:border-accent transition-colors"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted uppercase tracking-wider">Assignee</label>
            <select 
              value={formData.assignee_id}
              onChange={(e) => setFormData({ ...formData, assignee_id: e.target.value })}
              disabled={!formData.project_id}
              className="w-full h-10 px-3 bg-background border border-border-color rounded-md text-sm focus:outline-none focus:border-accent transition-colors disabled:opacity-50"
            >
              <option value="">Unassigned</option>
              {projectMembers.map(pm => (
                <option key={pm.user.id} value={pm.user.id}>
                  {pm.user.full_name} ({pm.role.replace('_', ' ')})
                </option>
              ))}
            </select>
          </div>

          <div className="mt-auto pt-4 flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="flex-1" disabled={loading}>
              {loading ? <Loader2 className="animate-spin w-4 h-4" /> : 'Create'}
            </Button>
          </div>
        </form>
        
      </div>
    </>
  );
};
