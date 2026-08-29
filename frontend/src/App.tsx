import { useEffect, useState } from 'react';
import { checkHealth } from './services/api';
import './index.css';

interface HealthStatus {
  status: string;
  database: string;
  redis: string;
}

function App() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const data = await checkHealth();
        setHealth(data);
        setError(null);
      } catch (err) {
        setError('Failed to connect to backend.');
      } finally {
        setLoading(false);
      }
    };

    fetchHealth();
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans text-slate-100">
      <div className="bg-slate-800 p-8 rounded-xl shadow-2xl max-w-md w-full border border-slate-700">
        <h1 className="text-3xl font-bold text-center mb-6 text-indigo-400">Escalora</h1>
        <h2 className="text-xl text-center mb-8 text-slate-300">Development Foundation</h2>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center p-3 rounded bg-slate-700">
            <span className="font-semibold text-slate-300">Backend:</span>
            {loading ? (
              <span className="text-yellow-400">Checking...</span>
            ) : error ? (
              <span className="text-red-400 font-bold">Disconnected</span>
            ) : (
              <span className="text-emerald-400 font-bold">Connected</span>
            )}
          </div>
          
          <div className="flex justify-between items-center p-3 rounded bg-slate-700">
            <span className="font-semibold text-slate-300">Database:</span>
            {loading ? (
              <span className="text-yellow-400">Checking...</span>
            ) : health?.database === 'connected' ? (
              <span className="text-emerald-400 font-bold">Connected</span>
            ) : (
              <span className="text-red-400 font-bold">Disconnected</span>
            )}
          </div>
          
          <div className="flex justify-between items-center p-3 rounded bg-slate-700">
            <span className="font-semibold text-slate-300">Redis:</span>
            {loading ? (
              <span className="text-yellow-400">Checking...</span>
            ) : health?.redis === 'connected' ? (
              <span className="text-emerald-400 font-bold">Connected</span>
            ) : (
              <span className="text-red-400 font-bold">Disconnected</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
