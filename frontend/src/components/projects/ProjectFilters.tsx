import React from 'react';
import { Search, Filter, SortDesc } from 'lucide-react';
import { Input } from '../ui/Input';
import { useAuthStore } from '../../store/authStore';

interface Props {
  search: string;
  setSearch: (s: string) => void;
  statusFilter: string;
  setStatusFilter: (s: string) => void;
  leadFilter: string;
  setLeadFilter: (s: string) => void;
  sortBy: string;
  setSortBy: (s: string) => void;
}

export const ProjectFilters: React.FC<Props> = ({
  search, setSearch,
  statusFilter, setStatusFilter,
  leadFilter, setLeadFilter,
  sortBy, setSortBy
}) => {
  const { user } = useAuthStore();
  
  return (
    <div className="flex flex-col md:flex-row items-center gap-4 mb-6 bg-surface p-4 rounded-xl border border-border-color">
      <div className="relative w-full md:w-1/3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
        <Input 
          type="text" 
          placeholder="Search by name or key..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 h-10 w-full"
        />
      </div>

      <div className="flex flex-wrap items-center gap-4 w-full md:w-auto flex-grow md:justify-end">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-muted" />
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 bg-background border border-border-color rounded-lg px-3 text-sm text-foreground focus:border-accent focus:outline-none transition-colors"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="ON_HOLD">On Hold</option>
            <option value="COMPLETED">Completed</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>

        {(user?.role === 'ADMIN') && (
          <div className="flex items-center gap-2">
            <select 
              value={leadFilter}
              onChange={(e) => setLeadFilter(e.target.value)}
              className="h-10 bg-background border border-border-color rounded-lg px-3 text-sm text-foreground focus:border-accent focus:outline-none transition-colors"
            >
              <option value="ALL">All Leads</option>
              {/* Could fetch leads here, or just basic filtering. Real implementation might need lead list */}
            </select>
          </div>
        )}

        <div className="flex items-center gap-2">
          <SortDesc size={16} className="text-muted" />
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="h-10 bg-background border border-border-color rounded-lg px-3 text-sm text-foreground focus:border-accent focus:outline-none transition-colors"
          >
            <option value="NEWEST">Newest First</option>
            <option value="OLDEST">Oldest First</option>
            <option value="UPDATED">Recently Updated</option>
            <option value="NAME_ASC">Name (A-Z)</option>
            <option value="NAME_DESC">Name (Z-A)</option>
          </select>
        </div>
      </div>
    </div>
  );
};
