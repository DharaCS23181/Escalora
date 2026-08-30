import React from 'react';

interface PlaceholderPageProps {
  title: string;
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title }) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
      <div className="h-[400px] w-full rounded-xl border border-dashed border-border-color flex items-center justify-center text-muted">
        {title} module implementation pending
      </div>
    </div>
  );
};
