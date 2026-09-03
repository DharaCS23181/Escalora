import React, { useEffect, useState, useRef } from 'react';
import { SearchInput } from '../ui/SearchInput';
import { Avatar } from '../ui/Avatar';
import { Bell, Moon, Sun, Monitor, LogOut, User as UserIcon, CheckCheck, Lock } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/auth';
import { notificationService, type Notification } from '../../services/notification';
import { Button } from '../ui/Button';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import lightLogo from '../../assets/light.png';
import darkLogo from '../../assets/dark.png';
import { ChangePasswordModal } from '../auth/ChangePasswordModal';

export const Header: React.FC = () => {
  const { theme, setTheme } = useThemeStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

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

  // Polling unread count
  useEffect(() => {
    if (!user) return;
    const fetchCount = async () => {
      try {
        const count = await notificationService.getUnreadCount();
        setUnreadCount(count);
      } catch (e) {
        console.error(e);
      }
    };
    fetchCount();
    const interval = setInterval(fetchCount, 15000);
    return () => clearInterval(interval);
  }, [user]);

  // Fetch notifications when panel opens
  useEffect(() => {
    if (showNotifMenu) {
      notificationService.getNotifications(0, 10).then(setNotifications).catch(console.error);
    }
  }, [showNotifMenu]);

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  const handleLogout = async () => {
    await authService.logout();
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n.charAt(0)).join('').substring(0, 2).toUpperCase();
  };

  const handleNotifClick = async (n: Notification) => {
    if (!n.is_read) {
      await notificationService.markAsRead(n.id);
      setUnreadCount(prev => Math.max(0, prev - 1));
      setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x));
    }
    setShowNotifMenu(false);
    if (n.ticket_id) {
      navigate(`/tickets?drawer=${n.ticket_id}`);
    } else if (n.project_id) {
      navigate(`/projects/${n.project_id}`);
    }
  };

  const handleMarkAllRead = async () => {
    await notificationService.markAllAsRead();
    setUnreadCount(0);
    setNotifications(prev => prev.map(x => ({ ...x, is_read: true })));
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border-color bg-background/80 backdrop-blur-md px-4 sm:px-6 w-full">
      <div className="flex items-center gap-6">
        <img src={lightLogo} alt="Escalora Logo" className="h-6 sm:h-8 w-auto dark:hidden" />
        <img src={darkLogo} alt="Escalora Logo" className="h-6 sm:h-8 w-auto hidden dark:block" />
      </div>

      <div className="flex items-center gap-4 flex-1 justify-end max-w-md relative">
        <div className="hidden sm:block flex-1">
          <SearchInput placeholder="Search tickets, projects..." />
        </div>
        
        <Button variant="ghost" size="icon" onClick={cycleTheme} aria-label="Toggle theme">
          {theme === 'light' ? <Sun size={20} /> : theme === 'dark' ? <Moon size={20} /> : <Monitor size={20} />}
        </Button>
        
        <div className="relative" ref={notifRef}>
          <Button variant="ghost" size="icon" aria-label="Notifications" onClick={() => setShowNotifMenu(!showNotifMenu)} className="relative">
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-[#013F32] animate-in zoom-in">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>
          
          {showNotifMenu && (
            <div className="absolute right-0 mt-3 w-80 rounded-xl border border-border-color bg-surface shadow-2xl overflow-hidden animate-fade z-50 flex flex-col max-h-[400px]">
              <div className="flex items-center justify-between p-3 border-b border-border-color bg-surface-hover/30">
                <h3 className="text-sm font-bold">Notifications</h3>
                {unreadCount > 0 && (
                  <button onClick={handleMarkAllRead} className="text-xs text-accent hover:underline flex items-center gap-1">
                    <CheckCheck size={12} /> Mark all read
                  </button>
                )}
              </div>
              
              <div className="overflow-y-auto flex-1 p-1">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-muted text-sm">
                    No new notifications
                  </div>
                ) : (
                  notifications.map(n => (
                    <button 
                      key={n.id} 
                      onClick={() => handleNotifClick(n)}
                      className={`w-full text-left p-3 rounded-lg flex gap-3 transition-colors ${!n.is_read ? 'bg-accent/5 hover:bg-accent/10' : 'hover:bg-surface-hover'}`}
                    >
                      <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${!n.is_read ? 'bg-accent' : 'bg-border-color'}`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${!n.is_read ? 'font-semibold text-foreground' : 'font-medium text-foreground/80'} truncate`}>
                          {n.title}
                        </p>
                        <p className="text-xs text-muted mt-0.5 line-clamp-2">
                          {n.message}
                        </p>
                        <p className="text-[10px] text-muted/60 mt-1">
                          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
              
              <div className="p-2 border-t border-border-color bg-background/50">
                <button className="w-full text-center text-xs text-muted hover:text-foreground py-1">
                  View all notifications &rarr;
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={menuRef}>
          <div onClick={() => setShowProfileMenu(!showProfileMenu)}>
            <Avatar 
              fallback={getInitials(user?.full_name)} 
              className="ml-2 cursor-pointer hover:ring-2 ring-accent transition-all select-none" 
            />
          </div>
          
          {showProfileMenu && (
            <div className="absolute right-0 mt-3 w-56 rounded-xl border border-border-color bg-surface shadow-[0_4px_30px_rgba(0,0,0,0.3)] overflow-hidden animate-fade z-50">
              <div className="p-4 border-b border-border-color bg-surface-hover/30">
                <p className="text-sm font-bold text-foreground truncate">{user?.full_name}</p>
                <p className="text-xs text-muted truncate">{user?.email}</p>
                <div className="mt-2 inline-flex text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-accent/20 text-accent border border-accent/30">
                  {user?.role.replace('_', ' ')}
                </div>
              </div>
              <div className="p-2">
                <button 
                  onClick={() => {
                    setShowProfileMenu(false);
                    setShowChangePassword(true);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-muted hover:text-foreground hover:bg-surface-hover rounded-md transition-colors"
                >
                  <Lock size={16} /> Change Password
                </button>
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 rounded-md transition-colors mt-1"
                >
                  <LogOut size={16} /> Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <ChangePasswordModal 
        isOpen={showChangePassword} 
        onClose={() => setShowChangePassword(false)} 
      />
    </header>
  );
};
