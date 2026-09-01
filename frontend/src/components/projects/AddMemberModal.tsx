import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import type { User } from '../../store/authStore';
import { projectService } from '../../services/project';

interface Props {
  projectId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddMemberModal: React.FC<Props> = ({ projectId, onClose, onSuccess }) => {
  const [eligibleUsers, setEligibleUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedUserId, setSelectedUserId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEligible = async () => {
      try {
        const data = await projectService.getEligibleMembers();
        setEligibleUsers(data);
        if (data.length > 0) setSelectedUserId(data[0].id);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchEligible();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;
    
    const user = eligibleUsers.find(u => u.id === selectedUserId);
    if (!user) return;

    setError('');
    setSubmitting(true);
    try {
      await projectService.addMember(projectId, selectedUserId, user.role as any);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to add member.');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade">
      <div className="bg-surface w-full max-w-md rounded-2xl border border-border-color shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-border-color bg-surface-hover">
          <h2 className="text-lg font-bold text-foreground">Add Team Member</h2>
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
          
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">Select Developer</label>
            {loading ? (
              <div className="flex items-center gap-2 text-muted text-sm p-3 bg-background border border-border-color rounded-lg">
                <Loader2 size={16} className="animate-spin" /> Loading eligible members...
              </div>
            ) : eligibleUsers.length === 0 ? (
               <div className="text-muted text-sm p-3 bg-background border border-border-color rounded-lg">
                 No eligible developers found.
               </div>
            ) : (
              <select 
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full h-11 bg-background border border-border-color rounded-lg px-3 text-sm text-foreground focus:border-accent focus:outline-none transition-colors"
              >
                {eligibleUsers.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.full_name} ({u.role.replace('_', ' ')})
                  </option>
                ))}
              </select>
            )}
          </div>
          
          <div className="flex justify-end gap-3 mt-8 pt-5 border-t border-border-color">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
            <Button type="submit" disabled={submitting || !selectedUserId || eligibleUsers.length === 0}>
              {submitting ? (
                 <span className="flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> Adding...</span>
              ) : (
                'Add Member'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
