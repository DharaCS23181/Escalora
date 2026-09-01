import React, { useState } from 'react';
import { type ProjectDetailed, projectService } from '../../services/project';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../ui/Button';
import { Users, Plus, Trash2, UserPlus } from 'lucide-react';
import { AddMemberModal } from './AddMemberModal';

interface Props {
  project: ProjectDetailed;
  isManager: boolean;
  onUpdate: () => void;
}

export const ProjectTeam: React.FC<Props> = ({ project, isManager, onUpdate }) => {
  const { user } = useAuthStore();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleRemove = async (userId: string) => {
    if (!window.confirm("Remove this member from the project?")) return;
    setRemovingId(userId);
    try {
      await projectService.removeMember(project.id, userId);
      onUpdate();
    } catch (err) {
      console.error(err);
      alert("Failed to remove member.");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-surface p-6 rounded-2xl border border-border-color">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mb-1">
            <Users className="text-accent" /> Team Members
          </h2>
          <p className="text-sm text-muted">
            {project.members.length} Developer(s) assigned to this project.
          </p>
        </div>
        
        {isManager && project.status !== 'ARCHIVED' && (
          <Button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2">
            <UserPlus size={16} /> Add Member
          </Button>
        )}
      </div>

      <div className="bg-surface rounded-2xl border border-border-color overflow-hidden">
        {project.members.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mb-4 border border-border-color">
              <Users size={24} className="text-muted" />
            </div>
            <p className="text-foreground font-semibold">No team members yet</p>
            <p className="text-sm text-muted mt-1">Assign developers to start collaborating.</p>
          </div>
        ) : (
          <div className="divide-y divide-border-color">
            {project.members.map(member => (
              <div key={member.id} className="flex items-center justify-between p-5 hover:bg-surface-hover/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-foreground font-bold border border-border-color">
                    {member.user.full_name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{member.user.full_name}</p>
                    <p className="text-xs text-muted">{member.user.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    member.role === 'SENIOR_DEVELOPER' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  }`}>
                    {member.role.replace('_', ' ')}
                  </span>
                  
                  {isManager && project.status !== 'ARCHIVED' && (
                    <button 
                      onClick={() => handleRemove(member.user_id)}
                      disabled={removingId === member.user_id}
                      className="p-2 text-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                      title="Remove Member"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isAddModalOpen && (
        <AddMemberModal 
          projectId={project.id}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={() => {
            setIsAddModalOpen(false);
            onUpdate();
          }}
        />
      )}
    </div>
  );
};
