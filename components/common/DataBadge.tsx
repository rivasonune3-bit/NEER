import React from 'react';

interface DataBadgeProps {
  label?: string;
  variant?: 'demo' | 'simulated' | 'offline' | 'live';
  className?: string;
}

export const DataBadge: React.FC<DataBadgeProps> = ({
  label = 'UNAVAILABLE',
  variant = 'offline',
  className = '',
}) => {
  const styles = {
    demo: 'bg-slate-100 text-slate-700 border-slate-300',
    simulated: 'bg-blue-100 text-blue-800 border-blue-300',
    offline: 'bg-slate-100 text-slate-700 border-slate-300',
    live: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border uppercase tracking-wider ${styles[variant]} ${className}`}
      title="Verified system status badge."
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1 animate-pulse" />
      {label}
    </span>
  );
};
