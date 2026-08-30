import React, { useState, useEffect } from 'react';
import { cn } from '../../utils/cn';

const POINTS = {
  TRACK: { x: 50, y: 50 },
  MONITOR: { x: 170, y: 50 },
  SLA: { x: 290, y: 50 },
  ESCALATE: { x: 410, y: 50 },
  SENIOR: { x: 410, y: 170 },
  RESOLVE: { x: 410, y: 290 },
};

// Map the 8 states to a coordinate for the traveling signal
const SIGNAL_POSITIONS = [
  POINTS.TRACK,    // 0: TRACK
  POINTS.MONITOR,  // 1: MONITOR
  POINTS.SLA,      // 2: SLA ON TRACK
  POINTS.SLA,      // 3: SLA AT RISK
  POINTS.SLA,      // 4: SLA BREACHED
  POINTS.ESCALATE, // 5: ESCALATION
  POINTS.SENIOR,   // 6: SENIOR DEVELOPER
  POINTS.RESOLVE,  // 7: RESOLUTION
];

export const SVGWorkflow: React.FC = () => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const interval = setInterval(() => {
      setStep((current) => (current + 1) % 8);
    }, 2000); // 2s per state

    return () => clearInterval(interval);
  }, []);

  const currentPos = SIGNAL_POSITIONS[step];
  const isSlaActive = step >= 2 && step <= 4;
  
  return (
    <div className="relative w-full max-w-[500px] h-[350px] mx-auto animate-fade opacity-0 delay-400 select-none">
      <svg 
        width="100%" 
        height="100%" 
        viewBox="0 0 500 350" 
        className="overflow-visible"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Base connecting lines */}
        <path 
          d={`M ${POINTS.TRACK.x} ${POINTS.TRACK.y} 
              L ${POINTS.MONITOR.x} ${POINTS.MONITOR.y} 
              L ${POINTS.SLA.x} ${POINTS.SLA.y} 
              L ${POINTS.ESCALATE.x} ${POINTS.ESCALATE.y} 
              L ${POINTS.SENIOR.x} ${POINTS.SENIOR.y} 
              L ${POINTS.RESOLVE.x} ${POINTS.RESOLVE.y}`} 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
          className="text-border-color opacity-50"
        />

        {/* Nodes */}
        {Object.entries(POINTS).map(([key, pos], index) => {
          // Node becomes active when the signal reaches it or has passed it
          const isActive = index <= step || (index === 2 && step >= 2) || (index === 3 && step >= 5) || (index === 4 && step >= 6) || (index === 5 && step >= 7);
          
          return (
            <g key={key}>
              <circle 
                cx={pos.x} 
                cy={pos.y} 
                r="6" 
                className={cn(
                  "transition-all duration-700",
                  isActive ? "fill-primary dark:fill-foreground" : "fill-background stroke-border-color stroke-2"
                )}
              />
              <text 
                x={pos.x} 
                y={pos.y + 24} 
                textAnchor="middle" 
                className={cn(
                  "text-[10px] font-bold tracking-widest transition-colors duration-700",
                  isActive ? "fill-foreground" : "fill-muted"
                )}
              >
                {key === 'SENIOR' ? (
                  <>
                    <tspan x={pos.x} dy="0">SENIOR</tspan>
                    <tspan x={pos.x} dy="12">DEVELOPER</tspan>
                  </>
                ) : (
                  key
                )}
              </text>
            </g>
          );
        })}

        {/* SLA Circular Indicator (Rendered at SLA Node) */}
        <g transform={`translate(${POINTS.SLA.x}, ${POINTS.SLA.y + 60})`} className={cn("transition-opacity duration-500", isSlaActive ? "opacity-100" : "opacity-0")}>
          <circle cx="0" cy="0" r="35" className="fill-none stroke-border-color opacity-30" strokeWidth="2" />
          <circle 
            cx="0" 
            cy="0" 
            r="35" 
            className={cn(
              "fill-none stroke-2 transition-all duration-1000",
              step === 2 ? "stroke-primary dark:stroke-foreground" : step === 3 ? "stroke-orange-500" : "stroke-red-500"
            )} 
            strokeDasharray="220" 
            strokeDashoffset={step === 2 ? 110 : step === 3 ? 50 : 0} 
            strokeLinecap="round"
            transform="rotate(-90)"
          />
          <text textAnchor="middle" y="4" className={cn(
            "text-[12px] font-mono tracking-wider transition-colors duration-500",
            step >= 4 ? "fill-red-500" : "fill-foreground"
          )}>
            {step >= 4 ? "00:00:00" : "04:21:15"}
          </text>
          <text textAnchor="middle" y="60" className={cn(
            "text-[9px] font-bold tracking-widest uppercase transition-colors duration-500",
            step === 2 ? "fill-primary dark:fill-foreground" : step === 3 ? "fill-orange-500" : "fill-red-500"
          )}>
            {step === 2 ? "ON TRACK" : step === 3 ? "AT RISK" : "SLA BREACHED"}
          </text>
        </g>

        {/* The Neon Signal */}
        <circle 
          cx={currentPos.x} 
          cy={currentPos.y} 
          r="8" 
          className="fill-accent transition-all duration-1000 ease-in-out drop-shadow-[0_0_12px_rgba(231,254,37,0.8)]"
        />
        {/* Pulse effect on current node */}
        <circle 
          cx={currentPos.x} 
          cy={currentPos.y} 
          r="8" 
          className="fill-none stroke-accent stroke-2 animate-[pulse-ring_2s_cubic-bezier(0.4,0,0.6,1)_infinite] transition-all duration-1000 ease-in-out"
        />
      </svg>
    </div>
  );
};
