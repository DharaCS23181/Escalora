import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { FloatingNavigation } from '../components/layout/FloatingNavigation';
import { RequireProjectAccess } from '../components/auth/RequireProjectAccess';
import { Toaster } from 'react-hot-toast';

export const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <Header />
      <FloatingNavigation />
      <main className="flex-1 w-full max-w-full overflow-x-hidden p-4 sm:p-5 lg:p-6 pr-16 sm:pr-20 lg:pr-24">
        {/* pr ensures content doesn't hide behind floating nav */}
        <div className="mx-auto w-full max-w-[1920px]">
          <RequireProjectAccess>
            <Outlet />
          </RequireProjectAccess>
        </div>
      </main>
      <Toaster 
        position="top-right" 
        toastOptions={{
          style: {
            background: '#2A2A2A',
            color: '#FDFDFD',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 'bold',
            textTransform: 'uppercase'
          },
          success: {
            iconTheme: {
              primary: '#E7FE25',
              secondary: '#161616',
            },
          },
        }} 
      />
    </div>
  );
};
