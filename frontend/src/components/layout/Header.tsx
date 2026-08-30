import React, { useEffect } from 'react';
import { SearchInput } from '../ui/SearchInput';
import { Avatar } from '../ui/Avatar';
import { Bell, Moon, Sun, Monitor } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';
import { Button } from '../ui/Button';

export const Header: React.FC = () => {
  const { theme, setTheme } = useThemeStore();

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border-color bg-background/80 backdrop-blur-md px-4 sm:px-6 w-full">
      <div className="flex items-center gap-6">
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          ESCALORA
        </h1>
      </div>

      <div className="flex items-center gap-4 flex-1 justify-end max-w-md">
        <div className="hidden sm:block flex-1">
          <SearchInput placeholder="Search tickets, projects..." />
        </div>
        
        <Button variant="ghost" size="icon" onClick={cycleTheme} aria-label="Toggle theme">
          {theme === 'light' ? <Sun size={20} /> : theme === 'dark' ? <Moon size={20} /> : <Monitor size={20} />}
        </Button>
        
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell size={20} />
        </Button>

        <Avatar fallback="US" className="ml-2 cursor-pointer hover:ring-2 ring-accent transition-all" />
      </div>
    </header>
  );
};
