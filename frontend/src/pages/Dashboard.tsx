import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Clock, AlertTriangle, CheckCircle, TrendingUp, FolderX } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { projectService, type Project } from '../services/project';
import { slaService, type SLAOverviewResponse } from '../services/sla';
import { apiClient } from '../services/api';
import { useNavigate } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [slaMetrics, setSlaMetrics] = useState<SLAOverviewResponse | null>(null);
  const [escalationMetrics, setEscalationMetrics] = useState<{ open: number, resolved: number, today: number } | null>(null);

  useEffect(() => {
    Promise.all([
      projectService.getProjects(),
      slaService.getOverview(),
      apiClient.get('/escalations/metrics').then(res => res.data).catch(() => null)
    ]).then(([projectsData, slaData, escData]) => {
      setProjects(projectsData);
      setSlaMetrics(slaData);
      if (escData) {
         setEscalationMetrics({
             open: escData.open_count,
             resolved: escData.resolved_count,
             today: escData.today_count
         });
      }
      setLoading(false);

      if (user?.role !== 'ADMIN' && projectsData.length === 1) {
        navigate(`/projects/${projectsData[0].id}`, { replace: true });
      }
    });
  }, [user, navigate]);

  if (loading) {
    return <div className="p-8 text-center text-muted animate-pulse">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-1">Dashboard</h2>
        <p className="text-sm text-muted">Maintenance operations overview.</p>
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-1">
            <CardTitle className="text-xs font-medium text-muted">Active Tickets</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{slaMetrics?.total_active_tickets || 0}</div>
            <p className="text-[11px] text-muted mt-1">across active projects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-1">
            <CardTitle className="text-xs font-medium text-muted">SLA Breaches</CardTitle>
            <Clock className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{slaMetrics?.breached_count || 0}</div>
            <p className="text-[11px] text-muted mt-1">Requires immediate attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-1">
            <CardTitle className="text-xs font-medium text-muted">Avg Resolution Time</CardTitle>
            <TrendingUp className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{Math.round((slaMetrics?.average_resolution_minutes || 0) / 60)} hrs</div>
            <p className="text-[11px] text-muted mt-1">all time average</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-1">
            <CardTitle className="text-xs font-medium text-muted">Tickets At Risk</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{slaMetrics?.at_risk_count || 0}</div>
            <p className="text-[11px] text-muted mt-1">approaching breach</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-1 lg:col-span-4 h-full flex flex-col">
          <CardHeader>
            <CardTitle className="text-sm">Escalations</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex items-center justify-center">
            {escalationMetrics ? (
                <div className="flex w-full gap-4 items-center justify-between px-4">
                  <div className="text-center">
                     <div className="text-3xl font-bold text-red-500">{escalationMetrics.open}</div>
                     <div className="text-xs text-muted uppercase tracking-wider mt-1">Open</div>
                  </div>
                  <div className="text-center">
                     <div className="text-3xl font-bold text-accent">{escalationMetrics.today}</div>
                     <div className="text-xs text-muted uppercase tracking-wider mt-1">Today</div>
                  </div>
                  <div className="text-center">
                     <div className="text-3xl font-bold text-emerald-500">{escalationMetrics.resolved}</div>
                     <div className="text-xs text-muted uppercase tracking-wider mt-1">Resolved</div>
                  </div>
                </div>
            ) : (
                <div className="text-muted text-sm italic">Metrics unavailable</div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-1 lg:col-span-3 h-full flex flex-col">
          <CardHeader>
            <CardTitle className="text-sm">SLA Health</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center flex-1 py-4">
            <div className="relative flex items-center justify-center h-24 w-24 rounded-full border-[3px] border-surface-hover">
              <div 
                className="absolute inset-0 rounded-full border-[3px] border-accent" 
                style={{ clipPath: `polygon(50% 50%, 50% 0%, 100% 0%, 100% 100%, 0% 100%, 0% ${100 - (slaMetrics?.resolution_sla_compliance || 0)}%)` }}
              />
              <span className="text-2xl font-bold">{Math.round(slaMetrics?.resolution_sla_compliance || 0)}%</span>
            </div>
            <p className="text-xs text-muted mt-4 text-center px-2">
              Compliance rate across all SLAs. Keep it above 90%.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
