import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Project } from '../../services/project';
import { Users, Calendar, ArrowRight } from 'lucide-react';

interface Props {
  project: Project;
}

export const ProjectRow: React.FC<Props> = ({ project }) => {
  const navigate = useNavigate();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-accent/10 text-accent border border-accent/20';
      case 'ON_HOLD': return 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20';
      case 'COMPLETED': return 'bg-blue-500/10 text-blue-500 border border-blue-500/20';
      case 'ARCHIVED': return 'bg-gray-500/10 text-gray-400 border border-gray-500/20';
      default: return 'bg-surface';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.replace('_', ' ');
  };

  return (
    <tr 
      onClick={() => navigate(`/projects/${project.id}`)}
      className="transition-colors group relative hover:bg-surface-hover/40 cursor-pointer"
    >
      <td className="px-6 py-3">
        <div className="flex flex-col min-w-0 pr-4">
          <div className="flex items-center gap-3 mb-1">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${getStatusColor(project.status)}`}>
              {getStatusLabel(project.status)}
            </span>
            <span className="text-muted text-xs font-mono tracking-wide">
              {project.key}
            </span>
          </div>
          
          <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-accent transition-colors">
            {project.name}
          </h3>
          
          {project.description && (
            <p className="text-xs text-muted line-clamp-1 mt-0.5">
              {project.description}
            </p>
          )}
        </div>
      </td>

      <td className="px-6 py-3">
        <div className="flex items-center gap-2">
          {project.project_lead ? (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold text-xs uppercase border border-accent/20">
                {project.project_lead.full_name.charAt(0)}
              </div>
              <span className="text-sm text-foreground/90">{project.project_lead.full_name}</span>
            </div>
          ) : (
            <span className="text-sm text-muted italic">Unassigned</span>
          )}
        </div>
      </td>

      <td className="px-6 py-3">
         <div className="flex items-center gap-1.5 text-foreground/90 text-sm font-medium">
           <Users size={14} className="text-accent/70" />
           {project.team_size} {project.team_size === 1 ? 'Member' : 'Members'}
         </div>
      </td>
      
      <td className="px-6 py-3">
         <div className="flex items-center justify-between">
           <div className="flex items-center gap-1.5 text-foreground/90 text-sm font-medium">
             <Calendar size={14} className="text-muted" />
             {new Date(project.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
           </div>
           
           <div className="opacity-0 group-hover:opacity-100 flex-shrink-0 w-7 h-7 rounded-full bg-accent flex items-center justify-center transition-all duration-300 ml-4">
             <ArrowRight size={14} className="text-background" />
           </div>
         </div>
      </td>
    </tr>
  );
};
