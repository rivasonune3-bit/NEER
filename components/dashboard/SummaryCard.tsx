import React, { ReactNode } from 'react';
import { DataBadge } from '../common/DataBadge';

interface SummaryCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  iconBgColor?: string;
  trendText?: string;
  badgeLabel?: string;
  badgeVariant?: 'live' | 'offline' | 'demo' | 'simulated';
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  iconBgColor = 'bg-sky-50 text-sky-600 border-sky-100',
  trendText = 'No active records',
  badgeLabel = 'SYSTEM VERIFIED',
  badgeVariant = 'live',
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {title}
            </p>
            <h3 className="text-2xl font-black text-slate-900 mt-1 font-mono">
              {value}
            </h3>
            {subtitle && (
              <p className="text-xs text-slate-600 font-medium mt-0.5">{subtitle}</p>
            )}
          </div>
          <div className={`p-2.5 rounded-lg border ${iconBgColor}`}>
            {icon}
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs border-t border-slate-100 pt-2.5">
        <span className="text-slate-500 font-medium">{trendText}</span>
        {badgeLabel && <DataBadge label={badgeLabel} variant={badgeVariant} />}
      </div>
    </div>
  );
};
