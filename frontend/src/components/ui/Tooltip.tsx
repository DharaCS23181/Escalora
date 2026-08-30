import React, { useState } from 'react';
import { cn } from '../../utils/cn';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  position?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children, position = 'top', className }) => {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div 
          className={cn(
            'absolute z-50 px-2 py-1 text-xs font-medium text-primary bg-accent rounded shadow-lg whitespace-nowrap pointer-events-none animate-in fade-in zoom-in-95 duration-100',
            positionClasses[position],
            className
          )}
          role="tooltip"
        >
          {content}
        </div>
      )}
    </div>
  );
};
