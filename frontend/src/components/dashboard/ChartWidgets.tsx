import React from 'react';
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  BarChart, Bar
} from 'recharts';
import type { DashboardOverviewResponse } from '../../services/dashboard';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Activity, BarChart2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ChartProps {
  data: DashboardOverviewResponse;
}

export const SlaHealthDonut: React.FC<ChartProps> = ({ data }) => {
  const navigate = useNavigate();
  const { on_track, at_risk, breached } = data.sla_metrics;
  const total = on_track + at_risk + breached;
  
  const chartData = [
    { name: 'On Track', value: on_track, color: '#10b981' }, // emerald-500
    { name: 'At Risk', value: at_risk, color: '#fb923c' },   // orange-400
    { name: 'Breached', value: breached, color: '#ef4444' }  // red-500
  ].filter(d => d.value > 0);

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="p-3 pb-0">
        <CardTitle className="text-[11px] font-bold uppercase text-muted tracking-wider">SLA Health</CardTitle>
      </CardHeader>
      <CardContent className="p-2 flex-1 relative flex items-center justify-center">
        {total === 0 ? (
          <div className="text-xs text-muted italic">No tracked SLAs</div>
        ) : (
          <>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold font-mono text-foreground leading-none">{total}</span>
              <span className="text-[9px] uppercase font-bold text-muted mt-0.5">Tracked</span>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius="65%"
                  outerRadius="85%"
                  stroke="none"
                  paddingAngle={2}
                  dataKey="value"
                  onClick={(entry) => {
                    const status = entry.name === 'On Track' ? 'ON_TRACK' : entry.name === 'At Risk' ? 'AT_RISK' : 'BREACHED';
                    navigate(`/tickets?sla_status=${status}`);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} className="hover:opacity-80 transition-opacity" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#161616', border: '1px solid rgba(255,255,255,0.1)', fontSize: '11px', fontWeight: 'bold' }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export const TicketActivityLineChart: React.FC<ChartProps> = ({ data }) => {
  return (
    <Card className="flex flex-col h-full overflow-hidden">
      <CardHeader className="p-3 pb-0 border-b border-border-color/50">
        <CardTitle className="text-[11px] font-bold uppercase text-muted tracking-wider flex items-center gap-1.5">
          <Activity size={12} /> Ticket Volume (7 Days)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2 flex-1 min-h-0">
        {data.ticket_trend.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-muted italic">No data available</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.ticket_trend} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'currentColor', opacity: 0.5 }} tickFormatter={(val) => val.split('-').slice(1).join('/')} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: 'currentColor', opacity: 0.5 }} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#161616', border: '1px solid rgba(255,255,255,0.1)', fontSize: '11px' }}
                labelStyle={{ fontWeight: 'bold', marginBottom: '4px', color: '#fff' }}
              />
              <Line type="monotone" dataKey="created" name="Created" stroke="#3b82f6" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />
              <Line type="monotone" dataKey="resolved" name="Resolved" stroke="#10b981" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export const ProjectSlaBarChart: React.FC<ChartProps> = ({ data }) => {
  // Sort projects worst to best SLA compliance
  const sortedProjects = [...data.project_metrics]
    .filter(p => p.total_sla_count > 0)
    .sort((a, b) => a.sla_compliance_percent - b.sla_compliance_percent)
    .slice(0, 6); // Top 6 worst performers to fit neatly

  return (
    <Card className="flex flex-col h-full overflow-hidden">
      <CardHeader className="p-3 pb-0 border-b border-border-color/50">
        <CardTitle className="text-[11px] font-bold uppercase text-muted tracking-wider flex items-center gap-1.5">
          <BarChart2 size={12} /> Project SLA Performance
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2 flex-1 min-h-0">
        {sortedProjects.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-muted italic">No tracked SLAs</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sortedProjects} layout="vertical" margin={{ top: 5, right: 15, left: 15, bottom: 0 }} barSize={12}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 9, fill: 'currentColor', opacity: 0.5 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: 'currentColor', fontWeight: 'bold' }} width={80} axisLine={false} tickLine={false} />
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                contentStyle={{ backgroundColor: '#161616', border: '1px solid rgba(255,255,255,0.1)', fontSize: '11px' }}
                formatter={(value: any) => [`${value}%`, 'SLA Compliance']}
              />
              <Bar dataKey="sla_compliance_percent" radius={[0, 2, 2, 0]}>
                {sortedProjects.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.sla_compliance_percent >= 95 ? '#10b981' : entry.sla_compliance_percent >= 80 ? '#fb923c' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export const MySlaHealthDonut: React.FC<ChartProps> = ({ data }) => {
  const navigate = useNavigate();
  const active_tickets = data.personal_metrics.open + data.personal_metrics.in_progress;
  const { at_risk, sla_breached } = data.personal_metrics;
  const on_track = Math.max(0, active_tickets - (at_risk + sla_breached));
  const total = active_tickets;
  
  const chartData = [
    { name: 'On Track', value: on_track, color: '#10b981' }, // emerald-500
    { name: 'At Risk', value: at_risk, color: '#fb923c' },   // orange-400
    { name: 'Breached', value: sla_breached, color: '#ef4444' }  // red-500
  ].filter(d => d.value > 0);

  return (
    <Card className="flex flex-col h-full overflow-hidden border-border-color">
      <CardHeader className="p-3 pb-0 border-b border-border-color/50">
        <CardTitle className="text-[11px] font-bold uppercase text-muted tracking-wider flex items-center gap-1.5">
          <Activity size={12} /> My SLA Health
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2 flex-1 relative flex items-center justify-center min-h-0">
        {total === 0 ? (
          <div className="text-[10px] text-muted italic">No active SLAs</div>
        ) : (
          <>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold font-mono text-foreground leading-none">{total}</span>
              <span className="text-[9px] uppercase font-bold text-muted mt-0.5">Active</span>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius="65%"
                  outerRadius="85%"
                  stroke="none"
                  paddingAngle={2}
                  dataKey="value"
                  onClick={(entry) => {
                    const status = entry.name === 'On Track' ? 'ON_TRACK' : entry.name === 'At Risk' ? 'AT_RISK' : 'BREACHED';
                    navigate(`/tickets?sla_status=${status}&assigned_to_me=true`);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} className="hover:opacity-80 transition-opacity" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#161616', border: '1px solid rgba(255,255,255,0.1)', fontSize: '11px', fontWeight: 'bold' }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </>
        )}
      </CardContent>
    </Card>
  );
};
