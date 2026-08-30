import React from 'react';
import { cn } from '../../utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'neon';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    const variants = {
      primary: 'bg-primary text-white hover:bg-primary/90',
      secondary: 'bg-surface hover:bg-surface-hover text-foreground',
      outline: 'border border-border-color bg-transparent hover:bg-surface-hover text-foreground',
      ghost: 'bg-transparent hover:bg-surface-hover text-foreground',
      neon: 'bg-accent text-primary font-bold hover:brightness-110 shadow-[0_0_10px_rgba(231,254,37,0.3)] hover:shadow-[0_0_15px_rgba(231,254,37,0.5)]',
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs',
      md: 'h-10 px-4 py-2 text-sm',
      lg: 'h-12 px-8 text-base',
      icon: 'h-10 w-10 flex items-center justify-center p-2 rounded-full',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center rounded-md font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:pointer-events-none disabled:opacity-50',
          variants[variant],
          sizes[size],
          size === 'icon' && 'rounded-full',
          className
        )}
        {...props}
      >
        {isLoading ? (
          <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : null}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
