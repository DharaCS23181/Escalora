import React, { useState } from 'react';
import { type ProjectDetailed, projectService } from '../../services/project';
import type { User } from '../../store/authStore';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../ui/Button';
import { UserCircle, Calendar, Hash, Tag, Archive, Edit3, Loader2 } from 'lucide-react';

interface Props {
  project: ProjectDetailed;
  isManager: boolean;
  onUpdate: () => void;
}

export const ProjectOverview: React.FC<Props> = ({ project, isManager, onUpdate }) => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';
  
  const [archiving, setArchiving] = useState(false);

  const handleArchive = async () => {
    if (!window.confirm("Are you sure you want to archive this project?")) return;
    setArchiving(true);
    try {
      await projectService.archiveProject(project.id);
      onUpdate();
    } catch (err) {
      console.error(err);
      alert("Failed to archive project.");
    } finally {
      setArchiving(false);
    }
  };

  return (
    <div className="max-w-5xl flex flex-col md:flex-row gap-8 lg:gap-12 animate-in fade-in duration-300">
      {/* Main Details */}
      <div className="flex-1 space-y-8">
        <section>
          <h3 className="text-xs font-bold text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
            <Tag size={14} /> Description
          </h3>
          <div className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
            {project.description ? project.description : <span className="text-muted italic">No description provided.</span>}
          </div>
        </section>
        
        {isAdmin && project.status !== 'ARCHIVED' && (
           <section className="pt-6 border-t border-border-color">
             <div className="flex items-center justify-between">
               <div>
                 <h4 className="text-sm text-red-500 font-bold flex items-center gap-2 mb-0.5">
                   <Archive size={14} /> Danger Zone
                 </h4>
                 <p className="text-xs text-muted">Archiving this project freezes all activity.</p>
               </div>
               <Button variant="outline" size="sm" onClick={handleArchive} disabled={archiving} className="h-8 text-xs text-red-500 border-red-500/30 hover:bg-red-500/10">
                 {archiving ? <Loader2 size={14} className="animate-spin" /> : 'Archive'}
               </Button>
             </div>
           </section>
        )}
      </div>

      {/* Sidebar Details - Dense List */}
      <div className="w-full md:w-72 lg:w-80 shrink-0 space-y-0 divide-y divide-border-color border border-border-color rounded-lg overflow-hidden bg-surface-hover/20">
        <div className="p-3 flex justify-between items-center bg-surface-hover/40">
           <span className="text-xs text-muted font-bold uppercase tracking-wider">Project Key</span>
           <span className="text-sm text-foreground font-mono font-medium flex items-center gap-1"><Hash size={12} className="text-accent" /> {project.key}</span>
        </div>

        <div className="p-3 flex justify-between items-center">
           <span className="text-xs text-muted font-bold uppercase tracking-wider">Project Lead</span>
           <div className="flex items-center gap-2">
             {project.project_lead ? (
               <>
                 <div className="w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold text-[10px] border border-accent/30">
                   {project.project_lead.full_name.charAt(0)}
                 </div>
                 <span className="text-sm font-medium text-foreground">{project.project_lead.full_name}</span>
               </>
             ) : (
               <span className="flex items-center gap-1 text-muted text-xs italic"><UserCircle size={12} /> Unassigned</span>
             )}
           </div>
        </div>

        <div className="p-3 flex justify-between items-center">
           <span className="text-xs text-muted font-bold uppercase tracking-wider">Created By</span>
           <span className="text-sm font-medium text-foreground">{project.creator?.full_name || 'System'}</span>
        </div>

        <div className="p-3 flex justify-between items-center">
           <span className="text-xs text-muted font-bold uppercase tracking-wider">Created At</span>
           <span className="text-sm font-medium text-foreground flex items-center gap-1.5">
             <Calendar size={12} className="text-muted" />
             {new Date(project.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
           </span>
        </div>
      </div>
    </div>
  );
};
