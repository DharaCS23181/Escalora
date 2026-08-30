import React from 'react';
import { cn } from '../../utils/cn';

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  fallback: string;
}

export const Avatar: React.FC<AvatarProps> = ({ src, alt, fallback, className, ...props }) => {
  return (
    <div 
      className={cn(
        "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-surface border border-border-color", 
        className
      )}
      {...props}
    >
      {src ? (
        <img 
          src={src} 
          alt={alt || "Avatar"} 
          className="aspect-square h-full w-full object-cover" 
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-sm font-medium text-muted">
          {fallback}
        </span>
      )}
    </div>
  );
};
