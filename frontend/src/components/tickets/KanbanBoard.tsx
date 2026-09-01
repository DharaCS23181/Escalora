import React, { useState } from 'react';
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import type { DragStartEvent, DragOverEvent, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { KanbanColumn } from './KanbanColumn';
import { TicketCard } from './TicketCard';
import type { Ticket, TicketStatus } from '../../services/ticket';
import { ticketService } from '../../services/ticket';
import { useAuthStore } from '../../store/authStore';

const COLUMNS: TicketStatus[] = ['OPEN', 'IN_PROGRESS', 'ON_HOLD', 'RESOLVED', 'CLOSED'];

interface KanbanBoardProps {
  tickets: Ticket[];
  onTicketMoved: () => void;
  onTicketClick: (id: string) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ tickets, onTicketMoved, onTicketClick }) => {
  const { user } = useAuthStore();
  
  // Local state for optimistic updates
  const [activeId, setActiveId] = useState<string | null>(null);
  const [optimisticTickets, setOptimisticTickets] = useState<Ticket[]>(tickets);

  // Sync prop changes to local state
  React.useEffect(() => {
    setOptimisticTickets(tickets);
  }, [tickets]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveTicket = optimisticTickets.find(t => t.id === activeId);
    const isOverColumn = COLUMNS.includes(overId as TicketStatus);
    const isOverTicket = optimisticTickets.find(t => t.id === overId);

    if (!isActiveTicket) return;

    const overStatus = isOverColumn ? (overId as TicketStatus) : isOverTicket?.status;
    if (!overStatus || isActiveTicket.status === overStatus) return;

    setOptimisticTickets(prev => {
      return prev.map(t => {
        if (t.id === activeId) return { ...t, status: overStatus };
        return t;
      });
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    
    if (!over) {
      // Revert if dropped nowhere
      setOptimisticTickets(tickets);
      return;
    }

    const activeTicket = optimisticTickets.find(t => t.id === active.id);
    const originalTicket = tickets.find(t => t.id === active.id);
    
    if (!activeTicket || !originalTicket) return;
    
    if (activeTicket.status !== originalTicket.status) {
      // Make API call
      try {
        await ticketService.updateStatus(activeTicket.id, activeTicket.status);
        onTicketMoved(); // Trigger refetch to ensure correct state
      } catch (error: any) {
        // Rollback
        setOptimisticTickets(tickets);
        alert(error.response?.data?.detail || "Failed to update ticket status. You might not have permission.");
      }
    }
  };

  const handleDelete = async (ticketId: string) => {
    try {
      await ticketService.deleteTicket(ticketId);
      onTicketMoved(); // Trigger refetch
    } catch (error: any) {
      alert(error.response?.data?.detail || "Failed to delete ticket");
    }
  };

  const activeTicket = activeId ? optimisticTickets.find(t => t.id === activeId) : null;

  return (
    <DndContext 
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full gap-3 pb-4 w-max min-w-full">
        <SortableContext items={COLUMNS} strategy={horizontalListSortingStrategy}>
          {COLUMNS.map(col => {
            const colTickets = optimisticTickets.filter(t => t.status === col);
            return (
              <KanbanColumn 
                key={col} 
                status={col} 
                tickets={colTickets} 
                onTicketClick={onTicketClick}
                onTicketDelete={handleDelete}
              />
            );
          })}
        </SortableContext>
      </div>
      
      <DragOverlay
        dropAnimation={{
          sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }),
        }}
      >
        {activeTicket ? (
          <div className="opacity-80 scale-105 rotate-2 cursor-grabbing">
            <TicketCard ticket={activeTicket} onClick={() => {}} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
