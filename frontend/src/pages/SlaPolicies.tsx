import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { slaService } from '../services/sla';
import type { SLAPolicy } from '../services/sla';
import CreateSlaDrawer from '../components/sla/CreateSlaDrawer';
import { Settings, Plus, Check, X, ShieldAlert, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import toast from 'react-hot-toast';

export default function SlaPolicies() {
  const { user } = useAuthStore();
  const [policies, setPolicies] = useState<SLAPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<SLAPolicy | null>(null);

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    try {
      const data = await slaService.getPolicies();
      setPolicies(data);
    } catch (error) {
      toast.error('Failed to fetch SLA policies');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdate = () => {
    setIsDrawerOpen(false);
    setSelectedPolicy(null);
    fetchPolicies();
  };

  const toggleStatus = async (policy: SLAPolicy) => {
    try {
      if (policy.active) {
        await slaService.deactivatePolicy(policy.id);
        toast.success('Policy deactivated');
      } else {
        await slaService.updatePolicy(policy.id, { active: true });
        toast.success('Policy activated');
      }
      fetchPolicies();
    } catch (error) {
      toast.error('Failed to update policy status');
    }
  };

  const openDrawer = (policy?: SLAPolicy) => {
    setSelectedPolicy(policy || null);
    setIsDrawerOpen(true);
  };

  if (user?.role !== 'ADMIN') {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-red-500">Access Denied</h2>
        <p className="text-gray-400 mt-2">Only administrators can manage SLA policies.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-500 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-1 flex items-center gap-2">
            <ShieldAlert className="text-accent" size={24} />
            SLA Policies
          </h2>
          <p className="text-sm text-muted">Configure response and resolution thresholds based on priority.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => openDrawer()} className="gap-2">
            <Plus size={16} />
            New Policy
          </Button>
        </div>
      </div>

      <div className="bg-surface border border-border-color rounded-xl flex-1 flex flex-col overflow-hidden h-0 min-h-[400px]">
        <div className="overflow-y-auto flex-1">
          <table className="w-full text-sm text-left whitespace-nowrap relative">
            <thead className="text-xs uppercase bg-surface-hover/30 text-muted sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Priority</th>
                <th className="px-6 py-3 font-medium">Response Time</th>
                <th className="px-6 py-3 font-medium">Resolution Time</th>
                <th className="px-6 py-3 font-medium">Risk Threshold</th>
                <th className="px-6 py-3 font-medium text-center">Status</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-color">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-muted animate-pulse">
                    Loading policies...
                  </td>
                </tr>
              ) : policies.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-muted">
                    No SLA policies found.
                  </td>
                </tr>
              ) : (
                policies.map((p) => (
                  <tr key={p.id} className="transition-colors hover:bg-surface-hover/40 cursor-pointer" onClick={() => openDrawer(p)}>
                    <td className="px-6 py-3 font-medium text-foreground">{p.name}</td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                        p.priority === 'CRITICAL' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                        p.priority === 'HIGH' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' :
                        p.priority === 'MEDIUM' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' :
                        'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                      }`}>
                        {p.priority}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-muted">{p.response_time_minutes}m</td>
                    <td className="px-6 py-3 text-muted">{p.resolution_time_minutes}m</td>
                    <td className="px-6 py-3 text-muted">{p.at_risk_threshold_percent}%</td>
                    <td className="px-6 py-3 text-center">
                      <button 
                        onClick={(e) => { e.stopPropagation(); toggleStatus(p); }}
                        className={`inline-flex items-center justify-center p-1 rounded transition-colors ${p.active ? 'text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20' : 'text-muted bg-surface-hover hover:text-foreground'}`}
                        title={p.active ? 'Active' : 'Inactive'}
                      >
                        {p.active ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                      </button>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <Button 
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); openDrawer(p); }}
                        className="h-7 text-xs px-2 text-accent hover:bg-accent/10"
                      >
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CreateSlaDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedPolicy(null);
        }}
        onSuccess={handleCreateOrUpdate}
        policyToEdit={selectedPolicy}
      />
    </div>
  );
}
