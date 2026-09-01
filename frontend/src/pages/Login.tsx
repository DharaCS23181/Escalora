import React from 'react';
import { LoginForm } from '../components/auth/LoginForm';
import { useThemeStore } from '../store/themeStore';
import { Moon, Sun, Monitor } from 'lucide-react';
import lightLogo from '../assets/light.png';
import darkLogo from '../assets/dark.png';

export const Login: React.FC = () => {
  const { theme, setTheme } = useThemeStore();

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background p-4 sm:p-8 relative">
      {/* Subtle Background */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage: 'linear-gradient(to right, var(--color-primary) 1px, transparent 1px), linear-gradient(to bottom, var(--color-primary) 1px, transparent 1px)',
          backgroundSize: '4rem 4rem'
        }}
      />
      
      {/* Theme Switcher */}
      <div className="absolute top-6 right-6 z-20">
        <button 
          onClick={cycleTheme}
          className="flex items-center justify-center p-2.5 rounded-full bg-surface border border-border-color text-muted hover:text-foreground hover:bg-surface-hover transition-colors shadow-sm"
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <Sun size={18} /> : theme === 'dark' ? <Moon size={18} /> : <Monitor size={18} />}
        </button>
      </div>
      
      <div className="w-full max-w-md relative z-10 flex flex-col items-center">
        {/* Logo */}
        <div className="mb-8 animate-fade flex items-center justify-center">
          <img src={lightLogo} alt="Escalora Logo" className="h-10 sm:h-12 w-auto dark:hidden" />
          <img src={darkLogo} alt="Escalora Logo" className="h-10 sm:h-12 w-auto hidden dark:block" />
        </div>
        
        {/* Card */}
        <div className="w-full bg-surface border border-border-color rounded-2xl shadow-xl overflow-hidden animate-slide-up opacity-0 delay-200" style={{ animationFillMode: 'forwards' }}>
          <LoginForm />
        </div>
        
        <p className="mt-8 text-xs text-muted font-medium animate-fade" style={{ animationFillMode: 'forwards', animationDelay: '0.4s' }}>
          © {new Date().getFullYear()} Escalora Systems
        </p>
      </div>
    </div>
  );
};
