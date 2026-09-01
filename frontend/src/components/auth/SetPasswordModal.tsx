import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/auth';
import { Button } from '../ui/Button';
import { Lock, Loader2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const SetPasswordModal: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (user?.status !== 'PENDING') return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await authService.setPassword(password);
      setSuccess(true);
      
      // Need to force logout and let them log back in with the new password
      // or we can just fetch the user again. But standard flow is to log out.
      setTimeout(async () => {
        await authService.logout();
        navigate('/login');
      }, 2000);
      
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to set password");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-surface border border-border-color shadow-2xl rounded-2xl w-full max-w-md overflow-hidden">
        <div className="p-6 border-b border-border-color bg-surface-hover/30">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center border border-accent/20">
              <Lock className="text-accent" size={24} />
            </div>
          </div>
          <h2 className="text-xl font-bold text-center text-foreground">Set Your Password</h2>
          <p className="text-sm text-center text-muted mt-2">
            Welcome to Escalora, {user?.full_name}! Please set a permanent password to secure your account.
          </p>
        </div>
        
        <div className="p-6">
          {success ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className="w-12 h-12 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-foreground">Password Set!</h3>
              <p className="text-sm text-muted mt-2">Redirecting you to login...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm p-3 rounded-lg flex items-start gap-2">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              
              <div>
                <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 px-4 bg-background border border-border-color rounded-lg text-foreground focus:outline-none focus:border-accent transition-colors"
                  placeholder="At least 8 characters"
                  required
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full h-11 px-4 bg-background border border-border-color rounded-lg text-foreground focus:outline-none focus:border-accent transition-colors"
                  placeholder="Repeat new password"
                  required
                />
              </div>
              
              <Button type="submit" className="w-full h-11 mt-4" disabled={loading}>
                {loading ? <Loader2 size={18} className="animate-spin" /> : "Set Password & Continue"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
