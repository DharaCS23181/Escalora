import React from 'react';
import { cn } from '../../utils/cn';
import { Search } from 'lucide-react';
import { Input, type InputProps } from './Input';

export const SearchInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <div className={cn("relative flex items-center w-full", className)}>
        <Search className="absolute left-3 h-4 w-4 text-muted pointer-events-none" />
        <Input 
          ref={ref}
          className="pl-9 bg-surface/50 border-transparent focus:border-accent focus:bg-surface transition-all" 
          type="search" 
          {...props} 
        />
      </div>
    );
  }
);
SearchInput.displayName = 'SearchInput';
