import React, { useEffect, useState } from 'react';
import { type ProjectActivity, projectService } from '../../services/project';
import { Loader2, Activity, Clock } from 'lucide-react';

interface Props {
  projectId: string;
}

export const ProjectActivityList: React.FC<Props> = ({ projectId }) => {
  const [activities, setActivities] = useState<ProjectActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const data = await projectService.getActivity(projectId);
        setActivities(data);
      } catch (err) {
        console.error("Failed to load activity", err);
      } finally {
        setLoading(false);
      }
    };
    fetchActivity();
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="animate-spin text-accent" size={24} />
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-surface rounded-2xl border border-border-color">
        <Activity className="text-muted mb-4" size={32} />
        <p className="text-foreground font-semibold">No Activity Yet</p>
        <p className="text-sm text-muted">Activities for this project will appear here.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="relative border-l border-border-color ml-4 space-y-8 py-4">
        {activities.map((activity, index) => (
          <div key={activity.id} className="relative pl-8 animate-fade" style={{ animationDelay: `${index * 50}ms` }}>
            {/* Timeline Dot */}
            <div className="absolute left-[-5px] top-1.5 w-[9px] h-[9px] rounded-full bg-accent ring-4 ring-background" />
            
            <div className="bg-surface p-4 rounded-xl border border-border-color shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-background flex items-center justify-center text-foreground font-bold text-xs border border-border-color shrink-0">
                    {activity.actor.full_name.charAt(0)}
                  </div>
                  <span className="font-semibold text-foreground text-sm">{activity.actor.full_name}</span>
                </div>
                
                <span className="text-muted text-sm">{activity.action}</span>
                
                {activity.target_user && (
                   <span className="font-semibold text-foreground text-sm">{activity.target_user.full_name}</span>
                )}
              </div>
              
              <div className="flex items-center gap-1.5 text-xs text-muted">
                <Clock size={12} />
                {new Date(activity.created_at).toLocaleString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
