import React from 'react';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  trend?: {
    value: string;
    positive: boolean;
  };
  variant?: 'default' | 'danger' | 'warning' | 'success';
  onClick?: () => void;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  variant = 'default',
  onClick,
}) => {
  const borderVariants = {
    default: 'border-slate-200/90',
    danger: 'border-rose-200 bg-rose-50/20',
    warning: 'border-amber-200 bg-amber-50/20',
    success: 'border-emerald-200 bg-emerald-50/20',
  };

  const iconVariants = {
    default: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    danger: 'text-rose-600 bg-rose-50 border-rose-100',
    warning: 'text-amber-600 bg-amber-50 border-amber-100',
    success: 'text-emerald-600 bg-emerald-50 border-emerald-100',
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl p-4 sm:p-5 border ${borderVariants[variant]} shadow-2xs transition-all duration-150 ${
        onClick ? 'cursor-pointer hover:shadow-xs hover:border-slate-300' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {title}
        </span>
        <div className={`p-2 rounded-lg border ${iconVariants[variant]}`}>
          {icon}
        </div>
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          {value}
        </h3>
        {trend && (
          <span
            className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${
              trend.positive ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>

      <p className="mt-1 text-xs text-slate-500 truncate">{subtitle}</p>
    </div>
  );
};
