import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, Moon, Sun, Monitor } from 'lucide-react';
import { authService } from '../../services/auth';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { cn } from '../../utils/cn';

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  
  const navigate = useNavigate();
  const { isLoading, setLoading } = useAuthStore();
  const { theme, setTheme } = useThemeStore();

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setError('');
    setLoading(true);
    
    try {
      await authService.login(email, password);
      setTimeout(() => navigate('/dashboard'), 300);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Unable to sign in. Check your email and password and try again.');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col justify-center items-center w-full h-full p-6 sm:p-12 bg-background">
      
      {/* Theme Switcher - Top Right */}
      <div className="absolute top-6 right-6 z-20">
        <button 
          onClick={cycleTheme}
          className="flex items-center justify-center p-2.5 rounded-full bg-surface border border-border-color text-muted hover:text-foreground hover:bg-surface-hover transition-colors shadow-sm"
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <Sun size={18} /> : theme === 'dark' ? <Moon size={18} /> : <Monitor size={18} />}
        </button>
      </div>

      <div className={cn(
        "w-full max-w-[400px] flex flex-col space-y-8 animate-slide-up opacity-0 delay-200",
        shake && "animate-[shake_0.4s_ease-in-out]"
      )}>
        
        <div className="space-y-3">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Welcome back</h2>
          <p className="text-sm font-medium text-muted">Sign in to continue to your Escalora workspace.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          
          {error && (
            <div className="p-3 text-xs font-medium text-red-500 bg-red-500/10 border border-red-500/20 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-5">
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
                  autoComplete="email"
                  disabled={isLoading}
                  className="w-full h-12 pl-11 pr-4 text-sm font-medium bg-surface border border-border-color rounded-lg outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all duration-200 disabled:opacity-50 shadow-sm"
                />
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-muted uppercase tracking-wider" htmlFor="password">
                  Password
                </label>
                <a href="#" className="text-[11px] font-semibold text-muted hover:text-foreground transition-colors outline-none focus-visible:text-accent">
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
                  autoComplete="current-password"
                  disabled={isLoading}
                  className="w-full h-12 pl-11 pr-11 text-sm font-medium bg-surface border border-border-color rounded-lg outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all duration-200 disabled:opacity-50 shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-muted hover:text-foreground focus:outline-none focus-visible:text-accent transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            
            <div className="flex items-center">
              <input 
                type="checkbox" 
                id="remember" 
                className="w-4 h-4 rounded border-border-color text-accent focus:ring-accent/50 focus:ring-offset-0 bg-surface accent-accent"
              />
              <label htmlFor="remember" className="ml-2.5 text-xs font-semibold text-muted select-none cursor-pointer">
                Remember me
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !email || !password}
            className="group relative flex items-center justify-center w-full h-12 mt-4 text-sm font-bold tracking-wide text-primary bg-accent rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 hover:shadow-[0_4px_14px_rgba(231,254,37,0.4)] transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent focus-visible:ring-offset-background"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 size={18} className="animate-spin" />
                SIGNING IN...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                SIGN IN
                <ArrowRight size={18} className="transition-transform duration-200 group-hover:translate-x-1.5" />
              </span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
