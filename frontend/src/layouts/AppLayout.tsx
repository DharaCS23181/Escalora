import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { FloatingNavigation } from '../components/layout/FloatingNavigation';

export const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <Header />
      <FloatingNavigation />
      <main className="flex-1 w-full max-w-full overflow-x-hidden p-4 sm:p-5 lg:p-6 pr-16 sm:pr-20 lg:pr-24">
        {/* pr ensures content doesn't hide behind floating nav */}
        <div className="mx-auto w-full max-w-[1920px]">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
