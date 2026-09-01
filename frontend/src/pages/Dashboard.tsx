import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useDashboard } from '../hooks/useDashboard';
import { 
  AdminDashboardLayout, 
  ProjectLeadDashboardLayout, 
  SeniorDevDashboardLayout, 
  DeveloperDashboardLayout 
} from '../components/dashboard/DashboardLayouts';
import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { TicketDetailsDrawer } from '../components/tickets/TicketDetailsDrawer';
import { projectService, type Project } from '../services/project';

export const Dashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [globalProjectId, setGlobalProjectId] = useState<string | null>(null);
  const { data, loading, error, refresh } = useDashboard(30000, globalProjectId); // 30s polling
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    if (user?.role === 'ADMIN' || user?.role === 'PROJECT_LEAD') {
      projectService.getProjects().then(setProjects).catch(console.error);
    }
  }, [user]);

  if (loading && !data) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-[calc(100vh-var(--header-height))] bg-background">
        <Loader2 className="animate-spin text-accent mb-4" size={32} />
        <p className="text-muted text-sm font-mono uppercase tracking-widest">Loading Command Center...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-[calc(100vh-var(--header-height))] bg-background">
        <div className="text-red-500 mb-2 font-bold font-mono">CONNECTION_ERROR</div>
        <p className="text-muted text-sm mb-4">{error || 'Failed to load dashboard data.'}</p>
        <Button onClick={refresh} className="gap-2">
          <RefreshCw size={16} /> Retry Connection
        </Button>
      </div>
    );
  }

  // Determine layout based on role
  let DashboardLayout = AdminDashboardLayout;
  if (user?.role === 'PROJECT_LEAD') DashboardLayout = ProjectLeadDashboardLayout;
  else if (user?.role === 'SENIOR_DEVELOPER') DashboardLayout = SeniorDevDashboardLayout;
  else if (user?.role === 'DEVELOPER') DashboardLayout = DeveloperDashboardLayout;

  const canFilterProjects = user?.role === 'ADMIN' || user?.role === 'PROJECT_LEAD';

  return (
    // The strict no-scroll constraints are applied here.
    // Assuming header is roughly 64px, and page padding. 
    // We use overflow-hidden to prevent page scroll.
    <div className="h-[calc(100vh-64px)] w-full flex flex-col p-3 overflow-hidden bg-background">
      {canFilterProjects && (
        <div className="flex-none flex justify-end mb-2">
          <select 
            value={globalProjectId || ''} 
            onChange={(e) => setGlobalProjectId(e.target.value || null)}
            className="bg-surface border border-border-color text-xs font-bold uppercase text-foreground py-1 px-2 rounded focus:outline-none focus:border-accent"
          >
            <option value="">{user?.role === 'PROJECT_LEAD' ? 'ALL MY PROJECTS' : 'ALL PROJECTS'}</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      )}

      <DashboardLayout data={data} onTicketClick={(id) => setSelectedTicketId(id)} />

      {/* Existing Ticket Drawer Integration */}
      <TicketDetailsDrawer 
        ticketId={selectedTicketId} 
        isOpen={!!selectedTicketId} 
        onClose={() => setSelectedTicketId(null)} 
      />
    </div>
  );
};
