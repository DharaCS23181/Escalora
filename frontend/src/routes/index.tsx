import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { RoleProtectedRoute } from '../components/auth/RoleProtectedRoute';
import { AppLayout } from '../layouts/AppLayout';
import { Login } from '../pages/Login';
import { Dashboard } from '../pages/Dashboard';
import { Tickets } from '../pages/Tickets';
import { Projects } from '../pages/Projects';
import { ProjectDetails } from '../pages/ProjectDetails';
import { Users } from '../pages/Users';
import SlaPolicies from '../pages/SlaPolicies';
import { Escalations } from '../pages/Escalations';

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
                <Users />
              </RoleProtectedRoute>
            ),
          },
          { path: 'projects', element: <Projects /> },
          { path: 'projects/:id', element: <ProjectDetails /> },
          {
            path: 'escalations',
            element: (
              <RoleProtectedRoute allowedRoles={['ADMIN', 'PROJECT_LEAD', 'SENIOR_DEVELOPER']}>
                <Escalations />
              </RoleProtectedRoute>
            ),
          },
          { path: 'sla', element: (
            <RoleProtectedRoute allowedRoles={['ADMIN']}>
              <SlaPolicies />
            </RoleProtectedRoute>
          )},
        ],
      },
    ],
  },
]);
