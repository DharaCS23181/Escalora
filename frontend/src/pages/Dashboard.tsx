import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Clock, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';

export const Dashboard: React.FC = () => {
  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-1">Dashboard</h2>
        <p className="text-sm text-muted">Maintenance operations overview.</p>
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-1">
            <CardTitle className="text-xs font-medium text-muted">Open Tickets</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">24</div>
            <p className="text-[11px] text-muted mt-1">+4 from last week</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-1">
            <CardTitle className="text-xs font-medium text-muted">SLA Breaches</CardTitle>
            <Clock className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">3</div>
            <p className="text-[11px] text-muted mt-1">Requires immediate attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-1">
            <CardTitle className="text-xs font-medium text-muted">Avg Resolution Time</CardTitle>
            <TrendingUp className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">4.2 hrs</div>
            <p className="text-[11px] text-muted mt-1">-12% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-1">
            <CardTitle className="text-xs font-medium text-muted">Resolved Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">12</div>
            <p className="text-[11px] text-muted mt-1">Great job team</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-1 lg:col-span-4 h-full flex flex-col">
          <CardHeader>
            <CardTitle className="text-sm">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center p-2 rounded bg-surface-hover/50">
                  <div className="h-2 w-2 rounded-full bg-accent mr-3 flex-shrink-0" />
                  <div className="flex-1 space-y-0.5 min-w-0">
                    <p className="text-xs font-medium leading-none truncate">Ticket SEQA-10{i} escalated</p>
                    <p className="text-[11px] text-muted truncate">Level {i} escalation triggered automatically.</p>
                  </div>
                  <div className="text-[11px] text-muted whitespace-nowrap ml-2">{i * 10}m ago</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 lg:col-span-3 h-full flex flex-col">
          <CardHeader>
            <CardTitle className="text-sm">SLA Health</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center flex-1 py-4">
            <div className="relative flex items-center justify-center h-24 w-24 rounded-full border-[3px] border-surface-hover">
              <div className="absolute inset-0 rounded-full border-[3px] border-accent border-r-transparent rotate-45" />
              <span className="text-2xl font-bold">85%</span>
            </div>
            <p className="text-xs text-muted mt-4 text-center px-2">
              15% of active tickets are at risk of breaching SLA within 2 hours.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
