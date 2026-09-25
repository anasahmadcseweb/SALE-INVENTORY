import React from 'react';
import { StockStatus } from '../../types';

interface StatusBadgeProps {
  status: StockStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const isSmall = size === 'sm';
  const sizeClasses = isSmall ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  switch (status) {
    case 'out_of_stock':
      return (
        <span
          className={`inline-flex items-center font-medium rounded-full bg-rose-100 text-rose-900 border border-rose-300 ${sizeClasses}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-rose-800 mr-1.5 animate-pulse" />
          Out of Stock
        </span>
      );
    case 'critical':
      return (
        <span
          className={`inline-flex items-center font-medium rounded-full bg-rose-50 text-rose-700 border border-rose-200 ${sizeClasses}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-rose-600 mr-1.5" />
          Critical
        </span>
      );
    case 'low':
      return (
        <span
          className={`inline-flex items-center font-medium rounded-full bg-amber-50 text-amber-700 border border-amber-200 ${sizeClasses}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5" />
          Low Stock
        </span>
      );
    case 'healthy':
    default:
      return (
        <span
          className={`inline-flex items-center font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 ${sizeClasses}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
          Healthy
        </span>
      );
  }
};
