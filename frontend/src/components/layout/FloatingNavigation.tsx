import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FolderKanban,
  Layers,
  AlertTriangle,
  ShieldAlert,
  BarChart3, 
  FileText, 
  Settings,
  Users,
  Activity
} from 'lucide-react';
import { Tooltip } from '../ui/Tooltip';
import { cn } from '../../utils/cn';
import { useAuthStore } from '../../store/authStore';
import type { User } from '../../store/authStore';

type Role = User['role'];

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  roles: Role[];
}

const NAV_ITEMS: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', roles: ['ADMIN', 'PROJECT_LEAD', 'SENIOR_DEVELOPER', 'DEVELOPER'] },
  { icon: FolderKanban, label: 'Projects', path: '/projects', roles: ['ADMIN', 'PROJECT_LEAD'] },
  { icon: Layers, label: 'Tickets', path: '/tickets', roles: ['PROJECT_LEAD', 'SENIOR_DEVELOPER', 'DEVELOPER'] },
  { icon: AlertTriangle, label: 'Escalations', path: '/escalations', roles: ['PROJECT_LEAD', 'SENIOR_DEVELOPER'] },
  { icon: ShieldAlert, label: 'SLA Config', path: '/sla', roles: ['PROJECT_LEAD'] },
  { icon: Users, label: 'Users', path: '/users', roles: ['ADMIN'] },
  { icon: BarChart3, label: 'Analytics', path: '/analytics', roles: ['ADMIN', 'PROJECT_LEAD'] },
  { icon: FileText, label: 'Reports', path: '/reports', roles: ['ADMIN', 'PROJECT_LEAD'] },
  { icon: Activity, label: 'Audit Logs', path: '/audit', roles: ['ADMIN'] },
  { icon: Settings, label: 'Settings', path: '/settings', roles: ['ADMIN'] },
];

export const FloatingNavigation: React.FC = () => {
  const { user } = useAuthStore();
  
  if (!user) return null;

  const filteredNav = NAV_ITEMS.filter((item) => item.roles.includes(user.role));

  return (
    <nav className="fixed right-6 top-1/2 -translate-y-1/2 z-40 bg-surface/80 backdrop-blur-md border border-border-color rounded-full py-4 px-2 shadow-lg flex flex-col gap-4">
      {filteredNav.map((item) => {
        const Icon = item.icon;
        return (
          <Tooltip key={item.path} content={item.label} position="left">
            <NavLink
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "p-2 rounded-full transition-all duration-200 group flex items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-accent",
                  isActive 
                    ? "bg-primary text-accent shadow-[0_0_15px_rgba(231,254,37,0.2)]" 
                    : "text-muted hover:text-foreground hover:bg-surface-hover"
                )
              }
              aria-label={item.label}
            >
              {({ isActive }) => (
                <Icon 
                  size={20} 
                  className={cn("transition-transform duration-200", isActive ? "scale-110" : "group-hover:scale-110")} 
                />
              )}
            </NavLink>
          </Tooltip>
        );
      })}
    </nav>
  );
};
