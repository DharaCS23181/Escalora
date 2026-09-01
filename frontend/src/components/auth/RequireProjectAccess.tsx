import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { projectService } from '../../services/project';
import { FolderX } from 'lucide-react';

interface RequireProjectAccessProps {
  children: React.ReactNode;
}

export const RequireProjectAccess: React.FC<RequireProjectAccessProps> = ({ children }) => {
  const { user } = useAuthStore();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [hasProjects, setHasProjects] = useState(true);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      setLoading(false);
      return;
    }

    const checkProjects = async () => {
      try {
        const projects = await projectService.getProjects();
        setHasProjects(projects.length > 0);
      } catch (e) {
        console.error("Failed to fetch projects", e);
      } finally {
        setLoading(false);
      }
    };

    checkProjects();
  }, [user]);

  if (loading) {
    return <div className="p-8 text-center text-muted animate-pulse">Verifying access...</div>;
  }

  // Allow admin everywhere
  if (user?.role === 'ADMIN') {
    return <>{children}</>;
  }

  // If no projects, intercept ALL routes EXCEPT profile/settings if we wanted to (but user said "not other pages")
  if (!hasProjects) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4 animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center border border-accent/20">
          <FolderX className="w-10 h-10 text-accent" />
        </div>
        <h2 className="text-3xl font-bold tracking-tight">No Projects Assigned</h2>
        <p className="text-muted max-w-md">
          You haven't been assigned to any projects yet. Please wait for an administrator or project lead to add you to a team.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};
