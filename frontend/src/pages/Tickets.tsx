import React from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { SearchInput } from '../components/ui/SearchInput';
import { Button } from '../components/ui/Button';
import { Filter, LayoutList, KanbanSquare, Clock } from 'lucide-react';
import { Avatar } from '../components/ui/Avatar';

const MOCK_COLUMNS = ['OPEN', 'IN PROGRESS', 'ON HOLD', 'ESCALATED', 'RESOLVED'];

const MOCK_TICKETS = [
  { id: 'SEQA-104', title: 'Payment API Failure', severity: 'CRITICAL', assignee: 'Rahul', sla: '04:21 remaining', escLevel: 'Level 1', col: 'OPEN' },
  { id: 'SEQA-105', title: 'Webhook timeouts', severity: 'HIGH', assignee: 'Priya', sla: '12:00 remaining', escLevel: null, col: 'IN PROGRESS' },
  { id: 'SEQA-108', title: 'Database latency', severity: 'HIGH', assignee: 'Amit', sla: '01:15 remaining', escLevel: 'Level 2', col: 'ESCALATED' },
  { id: 'SEQA-102', title: 'Login page styling', severity: 'LOW', assignee: 'Neha', sla: '48:00 remaining', escLevel: null, col: 'ON HOLD' },
];

export const Tickets: React.FC = () => {
  return (
    <div className="space-y-4 h-[calc(100vh-5rem)] flex flex-col animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-1">Tickets</h2>
          <p className="text-sm text-muted">Manage and escalate maintenance issues.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="w-64">
            <SearchInput placeholder="Search tickets..." />
          </div>
          <Button variant="outline" size="icon"><Filter size={18} /></Button>
          <div className="flex items-center rounded-md border border-border-color p-1 bg-surface">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-sm bg-surface-hover"><KanbanSquare size={18} /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-sm"><LayoutList size={18} /></Button>
          </div>
          <Button variant="primary">Create Ticket</Button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex h-full gap-3 pb-4 w-max min-w-full">
          {MOCK_COLUMNS.map(col => (
            <div key={col} className="w-[280px] flex flex-col bg-surface/50 rounded-lg border border-border-color/50">
              <div className="p-2.5 border-b border-border-color/50 flex justify-between items-center">
                <h3 className="font-semibold text-xs tracking-wide">{col}</h3>
                <Badge variant="outline" className="text-[10px]">{MOCK_TICKETS.filter(t => t.col === col).length}</Badge>
              </div>
              <div className="p-2.5 flex-1 overflow-y-auto space-y-2.5">
                {MOCK_TICKETS.filter(t => t.col === col).map(ticket => (
                  <Card key={ticket.id} className="p-3 flex flex-col gap-2 cursor-grab hover:border-accent hover:shadow-[0_0_8px_rgba(231,254,37,0.1)] transition-all">
                    <div className="flex justify-between items-start">
                      <span className="text-[11px] font-mono text-muted">{ticket.id}</span>
                      {ticket.escLevel && (
                        <Badge variant="outline" className="text-[10px] py-0 border-accent/50 text-accent bg-accent/10">
                          {ticket.escLevel}
                        </Badge>
                      )}
                    </div>
                    
                    <p className="font-medium text-sm leading-snug">{ticket.title}</p>
                    
                    <div className="flex flex-wrap gap-2 mt-auto pt-2">
                      <Badge variant={ticket.severity === 'CRITICAL' ? 'critical' : ticket.severity === 'HIGH' ? 'high' : ticket.severity === 'LOW' ? 'low' : 'default'} className="text-[10px] py-0">
                        {ticket.severity}
                      </Badge>
                      <span className="text-xs text-muted flex items-center gap-1">
                        <Clock size={12} /> {ticket.sla}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center pt-2 border-t border-border-color/50 mt-1">
                      <span className="text-xs text-muted font-medium">{ticket.assignee}</span>
                      <Avatar fallback={ticket.assignee.charAt(0)} className="h-6 w-6 text-xs" />
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
