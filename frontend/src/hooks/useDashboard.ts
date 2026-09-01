import { useState, useEffect, useCallback } from 'react';
import { dashboardService, type DashboardOverviewResponse } from '../services/dashboard';

interface DashboardState {
  data: DashboardOverviewResponse | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useDashboard = (pollIntervalMs = 30000, projectId: string | null = null): DashboardState => {
  const [data, setData] = useState<DashboardOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async (showLoadingState = true) => {
    if (showLoadingState) setLoading(true);
    setError(null);
    
    try {
      const response = await dashboardService.getOverview(projectId);
      setData(response);
    } catch (err: any) {
      console.error('Failed to fetch dashboard:', err);
      setError(err.message || 'Failed to fetch dashboard overview');
    } finally {
      if (showLoadingState) setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchDashboard();
    
    if (pollIntervalMs > 0) {
      const intervalId = setInterval(() => {
        fetchDashboard(false);
      }, pollIntervalMs);
      
      return () => clearInterval(intervalId);
    }
  }, [fetchDashboard, pollIntervalMs]);

  return { data, loading, error, refresh: fetchDashboard };
};
