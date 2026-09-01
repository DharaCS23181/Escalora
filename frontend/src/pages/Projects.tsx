import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { projectService, type Project } from '../services/project';
import { ProjectRow } from '../components/projects/ProjectRow';
import { ProjectFilters } from '../components/projects/ProjectFilters';
import { CreateProjectModal } from '../components/projects/CreateProjectModal';
import { Loader2, FolderKanban, Plus } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const Projects: React.FC = () => {
  const { user } = useAuthStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [leadFilter, setLeadFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('NEWEST');
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fetchProjects = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await projectService.getProjects();
      setProjects(data);
    } catch (err: any) {
      setError('Unable to load projects.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false);
    fetchProjects();
  };

  const filteredProjects = projects.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                        p.key.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || p.status === statusFilter;
    const matchLead = leadFilter === 'ALL' || p.project_lead_id === leadFilter;
    return matchSearch && matchStatus && matchLead;
  });

  const sortedProjects = [...filteredProjects].sort((a, b) => {
    switch (sortBy) {
      case 'NEWEST': return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'OLDEST': return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case 'NAME_ASC': return a.name.localeCompare(b.name);
      case 'NAME_DESC': return b.name.localeCompare(a.name);
      case 'UPDATED': return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      default: return 0;
    }
  });

  return (
    <div className="w-full h-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 animate-fade">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FolderKanban className="text-accent" />
            Projects
          </h1>
          <p className="text-sm text-muted mt-1">Manage and monitor your software maintenance projects.</p>
        </div>
        
        {user?.role === 'ADMIN' && (
          <Button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2 font-bold tracking-wide">
            <Plus size={16} />
            NEW PROJECT
          </Button>
        )}
      </div>

      <ProjectFilters 
        search={search} setSearch={setSearch}
        statusFilter={statusFilter} setStatusFilter={setStatusFilter}
        leadFilter={leadFilter} setLeadFilter={setLeadFilter}
        sortBy={sortBy} setSortBy={setSortBy}
      />

      {error ? (
        <div className="flex flex-col items-center justify-center py-20 bg-surface/50 border border-border-color rounded-xl">
          <p className="text-red-500 mb-4 font-medium">{error}</p>
          <Button variant="outline" onClick={fetchProjects}>Retry</Button>
        </div>
      ) : (
        <div className="bg-surface border border-border-color rounded-xl flex-1 flex flex-col overflow-hidden h-0 min-h-[400px] mt-4">
          <div className="overflow-y-auto flex-1">
            <table className="w-full text-sm text-left whitespace-nowrap relative">
              <thead className="text-xs uppercase bg-surface-hover/30 text-muted sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-6 py-3 font-medium">Project</th>
                  <th className="px-6 py-3 font-medium">Project Lead</th>
                  <th className="px-6 py-3 font-medium">Team Size</th>
                  <th className="px-6 py-3 font-medium">Last Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-color">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-muted animate-pulse">
                      Loading projects...
                    </td>
                  </tr>
                ) : sortedProjects.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-muted">
                      {search || statusFilter !== 'ALL' || leadFilter !== 'ALL' 
                        ? 'No projects found matching filters.' 
                        : 'No projects available.'}
                    </td>
                  </tr>
                ) : (
                  sortedProjects.map(project => (
                    <ProjectRow key={project.id} project={project} />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isCreateModalOpen && (
        <CreateProjectModal 
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleCreateSuccess}
        />
      )}
    </div>
  );
};
