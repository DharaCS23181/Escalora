import React, { useEffect, useState } from 'react';
import { SearchInput } from '../ui/SearchInput';
import { Button } from '../ui/Button';
import { Filter, Plus } from 'lucide-react';
import { projectService, type Project } from '../../services/project';
import { useAuthStore } from '../../store/authStore';

interface TicketToolbarProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  projectFilter: string;
  setProjectFilter: (val: string) => void;
  priorityFilter: string;
  setPriorityFilter: (val: string) => void;
  assigneeFilter: string;
  setAssigneeFilter: (val: string) => void;
  onCreateClick: () => void;
}

export const TicketToolbar: React.FC<TicketToolbarProps> = ({
  searchQuery, setSearchQuery,
  projectFilter, setProjectFilter,
  priorityFilter, setPriorityFilter,
  assigneeFilter, setAssigneeFilter,
  onCreateClick
}) => {
  const { user } = useAuthStore();
  const [projects, setProjects] = useState<Project[]>([]);
  
  useEffect(() => {
    projectService.getProjects().then(setProjects).catch(console.error);
  }, []);

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-1">Tickets</h2>
        <p className="text-sm text-muted">Manage and track project maintenance tickets.</p>
      </div>
      
      <div className="flex flex-wrap items-center gap-2">
        <div className="w-56">
          <SearchInput 
            placeholder="Search tickets..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <select 
          className="h-9 px-3 bg-surface border border-border-color rounded-lg text-sm text-foreground focus:outline-none focus:border-accent"
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
        >
          <option value="">All Projects</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.key} - {p.name}</option>
          ))}
        </select>
        
        <select 
          className="h-9 px-3 bg-surface border border-border-color rounded-lg text-sm text-foreground focus:outline-none focus:border-accent"
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
        >
          <option value="">All Priorities</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>

        <select 
          className="h-9 px-3 bg-surface border border-border-color rounded-lg text-sm text-foreground focus:outline-none focus:border-accent"
          value={assigneeFilter}
          onChange={(e) => setAssigneeFilter(e.target.value)}
        >
          <option value="">Everyone</option>
          <option value="ME">My Tickets</option>
        </select>

        <Button variant="outline" size="icon" className="h-9 w-9"><Filter size={16} /></Button>
        
        {user?.role === 'PROJECT_LEAD' && (
          <Button variant="primary" className="h-9 gap-1.5" onClick={onCreateClick}>
            <Plus size={16} /> Create Ticket
          </Button>
        )}
      </div>
    </div>
  );
};
