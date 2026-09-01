import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Badge } from '../ui/Badge';
import { TicketCard } from './TicketCard';
import type { Ticket, TicketStatus } from '../../services/ticket';

interface KanbanColumnProps {
  status: TicketStatus;
  tickets: Ticket[];
  onTicketClick: (id: string) => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({ status, tickets, onTicketClick }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
    data: {
      type: 'Column',
      status,
    },
  });

  return (
    <div 
      ref={setNodeRef}
      className={`w-[280px] flex flex-col bg-surface/50 rounded-lg border transition-colors ${isOver ? 'border-accent bg-accent/5' : 'border-border-color/50'}`}
    >
      <div className="p-2.5 border-b border-border-color/50 flex justify-between items-center">
        <h3 className="font-semibold text-xs tracking-wide">{status.replace('_', ' ')}</h3>
        <Badge variant="outline" className="text-[10px]">{tickets.length}</Badge>
      </div>
      
      <div className="p-2.5 flex-1 overflow-y-auto space-y-2.5">
        <SortableContext items={tickets.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tickets.map(ticket => (
            <TicketCard 
              key={ticket.id} 
              ticket={ticket} 
              onClick={() => onTicketClick(ticket.id)} 
            />
          ))}
        </SortableContext>
        
        {tickets.length === 0 && (
          <div className="h-full w-full flex items-center justify-center min-h-[100px] border-2 border-dashed border-border-color/50 rounded-lg text-muted text-xs">
            Drop tickets here
          </div>
        )}
      </div>
    </div>
  );
};
