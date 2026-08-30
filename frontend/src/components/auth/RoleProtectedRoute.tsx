import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import type { User } from '../../store/authStore';

interface RoleProtectedRouteProps {
  allowedRoles: User['role'][];
  children: React.ReactNode;
}

export const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({ allowedRoles, children }) => {
  const { user } = useAuthStore();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    // Optionally redirect to a 403 Forbidden page or dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
