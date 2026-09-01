import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import type { User } from '../../store/authStore';
import { projectService } from '../../services/project';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateProjectModal: React.FC<Props> = ({ onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');
  const [leadId, setLeadId] = useState('');
  
  const [leads, setLeads] = useState<User[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(true);
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const data = await projectService.getEligibleLeads();
        setLeads(data);
        if (data.length > 0) setLeadId(data[0].id);
      } catch (err) {
        console.error('Failed to load leads', err);
      } finally {
        setLoadingLeads(false);
      }
    };
    fetchLeads();
  }, []);

  const autoGenerateKey = (val: string) => {
    return val
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, '')
      .split(' ')
      .map(w => w.charAt(0))
      .join('')
      .substring(0, 4) || val.substring(0, 4).toUpperCase();
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);
    if (!key || autoGenerateKey(name) === key) {
        setKey(autoGenerateKey(newName));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!name || !key || !leadId) {
      setError('Name, Key, and Project Lead are required.');
      return;
    }
    
    setSubmitting(true);
    try {
      await projectService.createProject({
        name,
        key,
        description,
        project_lead_id: leadId
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create project. Key might already exist.');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade">
      <div className="bg-surface w-full max-w-md rounded-2xl border border-border-color shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-border-color bg-surface-hover">
          <h2 className="text-lg font-bold text-foreground">Create New Project</h2>
          <button onClick={onClose} className="text-muted hover:text-accent transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-sm">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">Project Name</label>
              <Input 
                value={name} 
                onChange={handleNameChange} 
                placeholder="e.g. Nexus API Gateway" 
                autoFocus 
              />
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">Project Key</label>
              <Input 
                value={key} 
                onChange={(e) => setKey(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} 
                placeholder="NAG" 
                maxLength={10}
              />
              <p className="text-[10px] text-muted mt-1">Alphanumeric only, max 10 characters. Used for ticketing prefix.</p>
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">Description (Optional)</label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full h-24 bg-background border border-border-color rounded-lg p-3 text-sm text-foreground focus:border-accent focus:outline-none transition-colors resize-none"
                placeholder="Briefly describe the purpose of this project..."
              />
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">Project Lead</label>
              {loadingLeads ? (
                <div className="flex items-center gap-2 text-muted text-sm p-3 bg-background border border-border-color rounded-lg">
                  <Loader2 size={16} className="animate-spin" /> Loading eligible leads...
                </div>
              ) : (
                <select 
                  value={leadId}
                  onChange={(e) => setLeadId(e.target.value)}
                  className="w-full h-11 bg-background border border-border-color rounded-lg px-3 text-sm text-foreground focus:border-accent focus:outline-none transition-colors"
                >
                  <option value="" disabled>Select a Lead</option>
                  {leads.map(l => (
                    <option key={l.id} value={l.id}>{l.full_name} ({l.email})</option>
                  ))}
                </select>
              )}
            </div>
          </div>
          
          <div className="flex justify-end gap-3 mt-8 pt-5 border-t border-border-color">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
            <Button type="submit" disabled={submitting || !name || !key || !leadId}>
              {submitting ? (
                 <span className="flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> Creating...</span>
              ) : (
                'Create Project'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
