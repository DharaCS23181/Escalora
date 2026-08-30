import React from 'react';
import { LoginBrandPanel } from '../components/auth/LoginBrandPanel';
import { LoginForm } from '../components/auth/LoginForm';

export const Login: React.FC = () => {
  return (
    <div className="h-screen w-full flex flex-col lg:flex-row bg-background overflow-hidden">
      {/* Left side takes exactly 55% on desktop */}
      <div className="hidden lg:block lg:w-[55%] h-full">
        <LoginBrandPanel />
      </div>
      
      {/* Right side takes exactly 45% on desktop */}
      <div className="w-full lg:w-[45%] h-full overflow-y-auto overflow-x-hidden">
        <LoginForm />
      </div>
    </div>
  );
};
