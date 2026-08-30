import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { RoleProtectedRoute } from '../components/auth/RoleProtectedRoute';
import { AppLayout } from '../layouts/AppLayout';
import { Login } from '../pages/Login';
import { Dashboard } from '../pages/Dashboard';
import { Tickets } from '../pages/Tickets';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            index: true,
            element: <Navigate to="/dashboard" replace />,
          },
          {
            path: 'dashboard',
            element: <Dashboard />,
          },
          {
            path: 'tickets',
            element: <Tickets />,
          },
          {
            path: 'users',
            element: (
              <RoleProtectedRoute allowedRoles={['ADMIN']}>
                <div className="p-8">Users Management Placeholder</div>
              </RoleProtectedRoute>
            ),
          },
          { path: 'projects', element: <div className="p-8">Projects Placeholder</div> },
          { path: 'escalations', element: <div className="p-8">Escalations Placeholder</div> },
          { path: 'sla', element: <div className="p-8">SLA Configuration Placeholder</div> },
          { path: 'analytics', element: <div className="p-8">Analytics Placeholder</div> },
          { path: 'reports', element: <div className="p-8">Reports Placeholder</div> },
          { path: 'notifications', element: <div className="p-8">Notifications Placeholder</div> },
          { path: 'settings', element: <div className="p-8">Settings Placeholder</div> },
          { path: 'profile', element: <div className="p-8">Profile Placeholder</div> },
        ],
      },
    ],
  },
]);
