import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import { authService } from '../../services/auth';
import { useAuthStore } from '../../store/authStore';
import { cn } from '../../utils/cn';

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  
  const navigate = useNavigate();
  const { isLoading, setLoading } = useAuthStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setError('');
    setLoading(true);
    
    try {
      await authService.login(email, password);
      setTimeout(() => navigate('/dashboard'), 300);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Unable to sign in. Check your credentials.');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className={cn("w-full p-6 sm:p-10", shake && "animate-[shake_0.4s_ease-in-out]")}>
      <div className="space-y-3 mb-8 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Welcome back</h2>
        <p className="text-sm font-medium text-muted">Sign in to your Escalora workspace</p>
      </div>



      <form onSubmit={handleLogin} className="space-y-5">
        {error && (
          <div className="p-3 text-xs font-medium text-red-500 bg-red-500/10 border border-red-500/20 rounded-md text-center">
            {error}
          </div>
        )}

        <div className="space-y-2.5">
          <label className="text-[11px] font-bold text-muted uppercase tracking-wider" htmlFor="email">
            Email Address
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-muted group-focus-within:text-accent transition-colors">
              <Mail size={16} />
            </div>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              disabled={isLoading}
              className="w-full h-11 pl-10 pr-4 text-sm font-medium bg-background border border-border-color rounded-lg outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all duration-200 shadow-sm"
            />
          </div>
        </div>

        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-muted uppercase tracking-wider" htmlFor="password">
              Password
            </label>
            <a href="#" className="text-[11px] font-semibold text-muted hover:text-foreground transition-colors">
              Forgot password?
            </a>
          </div>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-muted group-focus-within:text-accent transition-colors">
              <Lock size={16} />
            </div>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={isLoading}
              className="w-full h-11 pl-10 pr-10 text-sm font-medium bg-background border border-border-color rounded-lg outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all duration-200 shadow-sm"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
              className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-muted hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        
        <button
          type="submit"
          disabled={isLoading || !email || !password}
          className="group relative flex items-center justify-center w-full h-11 mt-2 text-sm font-bold tracking-wide text-primary bg-accent rounded-lg disabled:opacity-50 hover:-translate-y-0.5 hover:shadow-[0_4px_14px_rgba(231,254,37,0.4)] transition-all duration-200"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Loader2 size={16} className="animate-spin" />
              SIGNING IN...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              SIGN IN
              <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-1" />
            </span>
          )}
        </button>
      </form>
    </div>
  );
};
