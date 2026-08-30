import React from 'react';

export const BackgroundAnimation: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20 dark:opacity-30">
      {/* Grid pattern */}
      <div 
        className="absolute inset-0" 
        style={{
          backgroundImage: 'linear-gradient(to right, var(--color-primary) 1px, transparent 1px), linear-gradient(to bottom, var(--color-primary) 1px, transparent 1px)',
          backgroundSize: '4rem 4rem',
          opacity: 0.15
        }}
      />
      
      {/* Subtle radial gradient to focus center */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,var(--bg-color)_100%)]" />

      {/* Moving scanline effect */}
      <div className="absolute inset-0 h-[2px] bg-accent/20 animate-scanline blur-[1px]" />
      
      {/* Decorative Nodes */}
      <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-accent rounded-full shadow-[0_0_10px_var(--color-accent)] animate-pulse" />
      <div className="absolute top-2/3 left-3/4 w-1.5 h-1.5 bg-accent rounded-full shadow-[0_0_10px_var(--color-accent)] animate-pulse delay-300" />
      <div className="absolute bottom-1/4 left-1/3 w-1 h-1 bg-primary rounded-full animate-pulse delay-500" />
      
      {/* Connecting lines - static SVGs for subtle technical feel */}
      <svg className="absolute inset-0 w-full h-full stroke-primary/30" xmlns="http://www.w3.org/2000/svg">
        <path d="M 25% 25% L 75% 66%" strokeWidth="1" fill="none" strokeDasharray="4 4" />
        <path d="M 33% 75% L 25% 25%" strokeWidth="1" fill="none" strokeDasharray="4 4" />
      </svg>
    </div>
  );
};
