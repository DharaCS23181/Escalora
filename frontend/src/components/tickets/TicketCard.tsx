import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import { Clock } from 'lucide-react';
import type { Ticket } from '../../services/ticket';
import { formatDistanceToNow, isPast } from 'date-fns';

interface TicketCardProps {
  ticket: Ticket;
  onClick: () => void;
}

export const TicketCard: React.FC<TicketCardProps> = ({ ticket, onClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: ticket.id,
    data: {
      type: 'Ticket',
      ticket,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getSlaBadge = () => {
    if (!ticket.sla_due_at || ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') return null;
    
    const dueDate = new Date(ticket.sla_due_at);
    const breached = isPast(dueDate);
    
    return (
      <span className={`text-xs flex items-center gap-1 ${breached ? 'text-red-500 font-bold' : 'text-muted'}`}>
        <Clock size={12} />
        {breached ? 'Breached' : formatDistanceToNow(dueDate, { addSuffix: true })}
      </span>
    );
  };

  if (isDragging) {
    return (
      <div 
        ref={setNodeRef} 
        style={style} 
        className="opacity-30 border-2 border-accent border-dashed rounded-lg min-h-[100px]" 
      />
    );
  }

  return (
    <Card 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      className="p-3 flex flex-col gap-2 cursor-grab hover:border-accent hover:shadow-[0_0_12px_rgba(231,254,37,0.2)] transition-all bg-accent/10 border border-accent/30 select-none"
      onClick={onClick}
    >
      <div className="flex justify-between items-start">
        <span className="text-[11px] font-mono text-muted font-bold">{ticket.ticket_key}</span>
        {ticket.escalation_status !== 'NONE' && (
          <Badge variant="outline" className="text-[10px] py-0 border-accent/50 text-accent bg-accent/10">
            ESCALATED
          </Badge>
        )}
      </div>
      
      <p className="font-medium text-sm leading-snug">{ticket.title}</p>
      
      <div className="flex flex-wrap items-center justify-between gap-2 mt-auto pt-2">
        <Badge variant={ticket.priority === 'CRITICAL' ? 'critical' : ticket.priority === 'HIGH' ? 'high' : ticket.priority === 'LOW' ? 'low' : 'default'} className="text-[10px] py-0">
          {ticket.priority}
        </Badge>
        {getSlaBadge()}
      </div>
      
      <div className="flex justify-between items-center pt-2 border-t border-border-color/50 mt-1">
        <span className="text-xs text-muted font-medium truncate pr-2">
          {ticket.assignee ? ticket.assignee.full_name : 'Unassigned'}
        </span>
        {ticket.assignee && (
          <Avatar 
            fallback={ticket.assignee.full_name.charAt(0)} 
            className="h-6 w-6 text-xs flex-shrink-0" 
          />
        )}
      </div>
    </Card>
  );
};
