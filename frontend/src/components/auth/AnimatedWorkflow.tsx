import React, { useState, useEffect } from 'react';
import { cn } from '../../utils/cn';

const WORKFLOW_STATES = [
  { id: 'track', label: 'TRACK', color: 'text-primary dark:text-muted', activeColor: 'text-foreground' },
  { id: 'monitor', label: 'MONITOR', color: 'text-primary dark:text-muted', activeColor: 'text-foreground' },
  { id: 'sla', label: 'AT RISK', color: 'text-primary dark:text-muted', activeColor: 'text-orange-500' },
  { id: 'breach', label: 'SLA BREACH', color: 'text-primary dark:text-muted', activeColor: 'text-red-500' },
  { id: 'escalate', label: 'ESCALATION', color: 'text-primary dark:text-muted', activeColor: 'text-accent' },
  { id: 'senior', label: 'SENIOR DEVELOPER', color: 'text-primary dark:text-muted', activeColor: 'text-accent' },
  { id: 'resolve', label: 'RESOLUTION', color: 'text-primary dark:text-muted', activeColor: 'text-green-500' },
];

export const AnimatedWorkflow: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const interval = setInterval(() => {
      setActiveIndex((current) => (current + 1) % WORKFLOW_STATES.length);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  const currentState = WORKFLOW_STATES[activeIndex];

  return (
    <div className="flex flex-col items-center justify-center font-mono text-sm tracking-wider w-full animate-slide-up opacity-0 delay-300">
      
      {/* SLA Timer Visualization */}
      <div className="mb-10 flex flex-col items-center">
        <div className="text-[10px] text-muted mb-2 font-semibold tracking-widest uppercase">System Status</div>
        <div className={cn(
          "text-4xl font-light transition-colors duration-500",
          activeIndex >= 2 && activeIndex <= 3 ? "text-red-500" : "text-foreground"
        )}>
          {activeIndex >= 3 ? "00:00:00" : "04:21:15"}
        </div>
        <div className={cn(
          "mt-3 text-xs font-bold transition-all duration-500 px-3 py-1.5 rounded-full uppercase tracking-widest",
          activeIndex === 2 ? "bg-orange-500/10 text-orange-500 ring-1 ring-orange-500/30" : 
          activeIndex >= 3 ? "bg-red-500/10 text-red-500 ring-1 ring-red-500/30" : 
          "bg-primary/5 text-primary dark:text-foreground ring-1 ring-primary/20 dark:ring-border-color"
        )}>
          {activeIndex < 2 ? "ON TRACK" : activeIndex === 2 ? "AT RISK" : "SLA BREACH"}
        </div>
      </div>

      {/* Compact Workflow States */}
      <div className="relative w-full max-w-sm">
        {/* Track Line */}
        <div className="absolute top-1/2 left-0 w-full h-[1px] bg-border-color -translate-y-1/2 z-0" />
        
        <div className="relative z-10 flex justify-between items-center w-full">
          {WORKFLOW_STATES.map((state, index) => {
            const isActive = index === activeIndex;
            const isPassed = index < activeIndex;
            
            // Only show nodes, not text for all of them, to keep it compact
            return (
              <div key={state.id} className="flex flex-col items-center group">
                <div 
                  className={cn(
                    "w-3 h-3 rounded-full transition-all duration-500 border-2",
                    isActive 
                      ? `border-current ${state.activeColor} bg-surface scale-150 shadow-[0_0_10px_currentColor]` 
                      : isPassed 
                        ? "border-muted bg-muted"
                        : "border-border-color bg-background"
                  )}
                />
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Active State Label */}
      <div className="h-10 mt-6 flex items-center justify-center">
        <div 
          key={currentState.id} // Re-mount to trigger animation
          className={cn(
            "animate-slide-up text-sm font-semibold tracking-widest",
            currentState.activeColor
          )}
        >
          {currentState.label}
        </div>
      </div>
    </div>
  );
};
