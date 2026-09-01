import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectService, type ProjectDetailed } from '../services/project';
import { useAuthStore } from '../store/authStore';
import { Loader2, ArrowLeft, ShieldAlert } from 'lucide-react';
import { ProjectTeam } from '../components/projects/ProjectTeam';
import { ProjectActivityList } from '../components/projects/ProjectActivityList';
import { ProjectOverview } from '../components/projects/ProjectOverview';

export const ProjectDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [project, setProject] = useState<ProjectDetailed | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'TEAM' | 'ACTIVITY'>('OVERVIEW');

  const fetchProject = async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const data = await projectService.getProject(id);
      setProject(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Unable to load project details. You may not have access.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
  }, [id]);

  if (loading) {
    return (
      <div className="w-full h-full flex justify-center items-center">
        <Loader2 className="animate-spin text-accent" size={32} />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="w-full max-w-3xl mx-auto mt-20 p-8 bg-surface border border-border-color rounded-2xl flex flex-col items-center text-center animate-fade">
        <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-6">
          <ShieldAlert size={32} />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Access Denied</h2>
        <p className="text-muted mb-8">{error}</p>
        <button onClick={() => navigate('/projects')} className="text-accent hover:underline flex items-center gap-2 font-medium">
          <ArrowLeft size={16} /> Back to Projects
        </button>
      </div>
    );
  }

  const isManager = user?.role === 'ADMIN' || (user?.role === 'PROJECT_LEAD' && project.project_lead_id === user?.id);

  const tabs = [
    { id: 'OVERVIEW', label: 'Overview' },
    { id: 'TEAM', label: 'Team' },
    { id: 'ACTIVITY', label: 'Activity' }
  ];

  return (
    <div className="w-full h-full max-w-7xl mx-auto flex flex-col animate-fade">
      {/* Header */}
      <div className="flex-shrink-0 p-4 sm:p-6 lg:p-8 border-b border-border-color bg-surface-hover/30">
        <button 
          onClick={() => navigate('/projects')} 
          className="text-muted hover:text-foreground transition-colors flex items-center gap-2 text-sm font-medium mb-6"
        >
          <ArrowLeft size={16} /> Back to Projects
        </button>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-accent/20 text-accent border border-accent/30">
                {project.status.replace('_', ' ')}
              </span>
              <span className="text-sm font-mono text-muted tracking-widest">{project.key}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">{project.name}</h1>
          </div>
          
          {/* Navigation Tabs */}
          <div className="flex space-x-1 bg-background p-1 rounded-lg border border-border-color w-full md:w-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 md:flex-none px-6 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${
                  activeTab === tab.id 
                    ? 'bg-surface text-accent shadow-sm border border-border-color' 
                    : 'text-muted hover:text-foreground hover:bg-surface/50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-grow p-4 sm:p-6 lg:p-8 overflow-y-auto">
        {activeTab === 'OVERVIEW' && (
          <ProjectOverview project={project} isManager={isManager} onUpdate={fetchProject} />
        )}
        {activeTab === 'TEAM' && (
          <ProjectTeam project={project} isManager={isManager} onUpdate={fetchProject} />
        )}
        {activeTab === 'ACTIVITY' && (
          <ProjectActivityList projectId={project.id} />
        )}
      </div>
    </div>
  );
};
