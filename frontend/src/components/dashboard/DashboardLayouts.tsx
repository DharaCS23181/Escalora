import React from 'react';
import type { DashboardOverviewResponse } from '../../services/dashboard';
import { 
  KPIStrip, 
  NeedsAttentionWidget, 
  EscalationSummaryWidget, 
  ProjectOverviewWidget, 
  ActivityWidget, 
  UpcomingDeadlinesWidget, 
  TeamWorkloadWidget,
  SlaByPriorityWidget,
  SeniorDeveloperKPIStrip,
  DeveloperKPIStrip,
  SeniorEscalationsWidget,
  DeveloperActiveTicketsWidget,
  QuickStatusWidget
} from './DashboardWidgets';

import { SlaHealthDonut, TicketActivityLineChart, ProjectSlaBarChart, MySlaHealthDonut } from './ChartWidgets';

interface LayoutProps {
  data: DashboardOverviewResponse;
  onTicketClick: (ticketId: string) => void;
}

export const AdminDashboardLayout: React.FC<LayoutProps> = ({ data, onTicketClick }) => {
  return (
    <div className="flex flex-col h-[calc(100vh-80px)] overflow-hidden">
      <div className="flex-none"><KPIStrip data={data} onTicketClick={onTicketClick} /></div>
      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12 gap-2">
        <div className="md:col-span-8 flex flex-col gap-2 min-h-0">
          <div className="flex-[0.45] min-h-0">
            <NeedsAttentionWidget data={data} onTicketClick={onTicketClick} />
          </div>
          <div className="flex-[0.3] min-h-0">
            <ProjectOverviewWidget data={data} onTicketClick={onTicketClick} />
          </div>
          <div className="flex-[0.25] min-h-0">
            <TicketActivityLineChart data={data} />
          </div>
        </div>
        <div className="md:col-span-4 flex flex-col gap-2 min-h-0">
          <div className="flex-[0.35] min-h-0 grid grid-cols-2 gap-2">
            <SlaHealthDonut data={data} />
            <ProjectSlaBarChart data={data} />
          </div>
          <div className="flex-[0.35] min-h-0">
            <EscalationSummaryWidget data={data} onTicketClick={onTicketClick} />
          </div>
          <div className="flex-[0.3] min-h-0">
            <ActivityWidget data={data} onTicketClick={onTicketClick} />
          </div>
        </div>
      </div>
    </div>
  );
};

export const ProjectLeadDashboardLayout: React.FC<LayoutProps> = ({ data, onTicketClick }) => {
  return (
    <div className="flex flex-col h-[calc(100vh-80px)] overflow-hidden">
      <div className="flex-none"><KPIStrip data={data} onTicketClick={onTicketClick} /></div>
      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12 gap-2">
        <div className="md:col-span-8 flex flex-col gap-2 min-h-0">
          <div className="flex-[0.4] min-h-0">
            <NeedsAttentionWidget data={data} onTicketClick={onTicketClick} />
          </div>
          <div className="flex-[0.35] min-h-0">
            <ProjectOverviewWidget data={data} onTicketClick={onTicketClick} />
          </div>
          <div className="flex-[0.25] min-h-0">
            <TicketActivityLineChart data={data} />
          </div>
        </div>
        <div className="md:col-span-4 flex flex-col gap-2 min-h-0">
          <div className="flex-[0.25] min-h-0 grid grid-cols-2 gap-2">
            <SlaHealthDonut data={data} />
            <EscalationSummaryWidget data={data} onTicketClick={onTicketClick} />
          </div>
          <div className="flex-[0.45] min-h-0">
            <TeamWorkloadWidget data={data} onTicketClick={onTicketClick} />
          </div>
          <div className="flex-[0.3] min-h-0">
            <SlaByPriorityWidget data={data} onTicketClick={onTicketClick} />
          </div>
        </div>
      </div>
    </div>
  );
};

export const SeniorDevDashboardLayout: React.FC<LayoutProps> = ({ data, onTicketClick }) => {
  return (
    <div className="flex flex-col h-[calc(100vh-80px)] overflow-hidden">
      <div className="flex-none"><SeniorDeveloperKPIStrip data={data} onTicketClick={onTicketClick} /></div>
      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12 gap-2">
        {/* Left Column (8 cols): Primary attention and work */}
        <div className="md:col-span-8 flex flex-col gap-2 min-h-0">
          <div className="flex-[0.4] min-h-0">
            {/* Same generic needs attention but filtered in backend for them */}
            <NeedsAttentionWidget data={data} onTicketClick={onTicketClick} />
          </div>
          <div className="flex-[0.4] min-h-0">
            <UpcomingDeadlinesWidget data={data} onTicketClick={onTicketClick} />
          </div>
          <div className="flex-[0.2] min-h-0">
            <ProjectOverviewWidget data={data} onTicketClick={onTicketClick} />
          </div>
        </div>
        {/* Right Column (4 cols): Secondary stats */}
        <div className="md:col-span-4 flex flex-col gap-2 min-h-0">
          <div className="flex-[0.25] min-h-0 grid grid-cols-2 gap-2">
            <MySlaHealthDonut data={data} />
            <SeniorEscalationsWidget data={data} onTicketClick={onTicketClick} />
          </div>
          <div className="flex-[0.75] min-h-0">
            <ActivityWidget data={data} onTicketClick={onTicketClick} />
          </div>
        </div>
      </div>
    </div>
  );
};

export const DeveloperDashboardLayout: React.FC<LayoutProps> = ({ data, onTicketClick }) => {
  return (
    <div className="flex flex-col h-[calc(100vh-80px)] overflow-hidden">
      <div className="flex-none"><DeveloperKPIStrip data={data} onTicketClick={onTicketClick} /></div>
      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12 gap-2">
        {/* Left Column (8 cols): Primary Ticket Execution Queue */}
        <div className="md:col-span-8 flex flex-col gap-2 min-h-0">
          <div className="flex-[0.6] min-h-0">
            <DeveloperActiveTicketsWidget data={data} onTicketClick={onTicketClick} />
          </div>
          <div className="flex-[0.4] min-h-0">
            <UpcomingDeadlinesWidget data={data} onTicketClick={onTicketClick} />
          </div>
        </div>
        {/* Right Column (4 cols): Health, Context, Activity */}
        <div className="md:col-span-4 flex flex-col gap-2 min-h-0">
          <div className="flex-[0.25] min-h-0 grid grid-cols-2 gap-2">
            <MySlaHealthDonut data={data} />
            <QuickStatusWidget data={data} onTicketClick={onTicketClick} />
          </div>
          <div className="flex-[0.35] min-h-0">
            <ProjectOverviewWidget data={data} onTicketClick={onTicketClick} />
          </div>
          <div className="flex-[0.4] min-h-0">
            <ActivityWidget data={data} onTicketClick={onTicketClick} />
          </div>
        </div>
      </div>
    </div>
  );
};
