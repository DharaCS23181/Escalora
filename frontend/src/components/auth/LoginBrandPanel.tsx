import React from 'react';
import { SVGWorkflow } from './SVGWorkflow';
import lightLogo from '../../assets/light.png';
import darkLogo from '../../assets/dark.png';

export const LoginBrandPanel: React.FC = () => {
  return (
    <div className="relative flex flex-col justify-between w-full h-full bg-surface-hover/20 dark:bg-surface/30 overflow-hidden border-r border-border-color p-8 sm:p-12 lg:p-16">
      
      {/* Subtle extremely faint grid background */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage: 'linear-gradient(to right, var(--color-primary) 1px, transparent 1px), linear-gradient(to bottom, var(--color-primary) 1px, transparent 1px)',
          backgroundSize: '3rem 3rem'
        }}
      />
      
      {/* Top Branding */}
      <div className="relative z-10 animate-fade opacity-0 delay-100">
        <div className="flex items-center gap-2 mb-6">
          <img src={lightLogo} alt="Escalora Logo" className="h-8 sm:h-10 w-auto dark:hidden" />
          <img src={darkLogo} alt="Escalora Logo" className="h-8 sm:h-10 w-auto hidden dark:block" />
        </div>
        
        <h2 className="text-2xl lg:text-3xl font-semibold leading-snug text-foreground max-w-md mb-8">
          Software Maintenance<br/>Operations Console
        </h2>
        
        <div className="space-y-2 text-muted text-sm lg:text-base tracking-wide font-medium">
          <p>Track issues.</p>
          <p>Monitor SLAs.</p>
          <p>Escalate automatically.</p>
          <p>Resolve faster.</p>
        </div>
      </div>

      {/* Animated Centerpiece */}
      <div className="relative z-10 flex-1 flex flex-col justify-center py-12">
        <SVGWorkflow />
      </div>

      {/* Bottom Legal / Secondary */}
      <div className="relative z-10 animate-fade opacity-0 delay-500">
        <p className="text-xs text-muted font-medium">© {new Date().getFullYear()} Escalora Systems.</p>
      </div>
    </div>
  );
};
