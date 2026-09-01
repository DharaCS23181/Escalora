import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { KanbanBoard } from '../components/tickets/KanbanBoard';
import { TicketToolbar } from '../components/tickets/TicketToolbar';
import { TicketDetailsDrawer } from '../components/tickets/TicketDetailsDrawer';
import { CreateTicketDrawer } from '../components/tickets/CreateTicketDrawer';
import { ticketService, type Ticket } from '../services/ticket';
import { useAuthStore } from '../store/authStore';

export const Tickets: React.FC = () => {
  const { user } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  
  // Detail drawer controlled by URL search param `drawer`
  const drawerTicketId = searchParams.get('drawer');

  const fetchTickets = async () => {
    setLoading(true);
    try {
      // Add 'My Tickets' logic if assigneeFilter is 'ME'
      const actualAssigneeFilter = assigneeFilter === 'ME' ? user?.id : (assigneeFilter || undefined);
      
      const data = await ticketService.getTickets({
        project_id: projectFilter || undefined,
        priority: priorityFilter || undefined,
        assignee_id: actualAssigneeFilter
      });
      
      setTickets(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [projectFilter, priorityFilter, assigneeFilter]);

  // Client-side search filtering
  const displayTickets = tickets.filter(t => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      t.title.toLowerCase().includes(query) ||
      t.ticket_key.toLowerCase().includes(query) ||
      t.assignee?.full_name.toLowerCase().includes(query)
    );
  });

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] w-full animate-in fade-in duration-500 overflow-hidden">
      <TicketToolbar 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        projectFilter={projectFilter}
        setProjectFilter={setProjectFilter}
        priorityFilter={priorityFilter}
        setPriorityFilter={setPriorityFilter}
        assigneeFilter={assigneeFilter}
        setAssigneeFilter={setAssigneeFilter}
        onCreateClick={() => setIsCreateOpen(true)}
      />
      
      <div className="flex-1 mt-3 w-full overflow-x-auto overflow-y-hidden">
        {loading ? (
          <div className="h-full w-full flex items-center justify-center text-muted animate-pulse">
            Loading board...
          </div>
        ) : (
          <KanbanBoard 
            tickets={displayTickets} 
            onTicketMoved={fetchTickets}
            onTicketClick={(id) => setSearchParams({ drawer: id })}
          />
        )}
      </div>

      {drawerTicketId && (
        <TicketDetailsDrawer 
          ticketId={drawerTicketId} 
          onClose={() => setSearchParams({})} 
          onUpdated={fetchTickets}
        />
      )}

      {isCreateOpen && (
        <CreateTicketDrawer 
          onClose={() => setIsCreateOpen(false)}
          onCreated={fetchTickets}
        />
      )}
    </div>
  );
};
