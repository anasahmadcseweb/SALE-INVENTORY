import React from 'react';
import { StockOutRiskLevel } from '../../types';
import { AlertCircle, AlertTriangle, Eye, ShieldCheck } from 'lucide-react';

interface RiskBadgeProps {
  level: StockOutRiskLevel;
  size?: 'sm' | 'md';
  showIcon?: boolean;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  level,
  size = 'md',
  showIcon = true,
}) => {
  const isSmall = size === 'sm';
  const sizeClasses = isSmall ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  switch (level) {
    case 'OUT_OF_STOCK':
      return (
        <span
          className={`inline-flex items-center font-bold rounded-md bg-rose-900 text-white shadow-2xs ${sizeClasses}`}
        >
          {showIcon && <AlertCircle className="w-3 h-3 mr-1 shrink-0" />}
          OUT OF STOCK
        </span>
      );
    case 'AT_RISK':
      return (
        <span
          className={`inline-flex items-center font-bold rounded-md bg-rose-100 text-rose-800 border border-rose-300 ${sizeClasses}`}
        >
          {showIcon && <AlertTriangle className="w-3 h-3 mr-1 text-rose-600 shrink-0" />}
          AT RISK
        </span>
      );
    case 'WATCH':
      return (
        <span
          className={`inline-flex items-center font-bold rounded-md bg-amber-100 text-amber-800 border border-amber-300 ${sizeClasses}`}
        >
          {showIcon && <Eye className="w-3 h-3 mr-1 text-amber-600 shrink-0" />}
          WATCH
        </span>
      );
    case 'SAFE':
    default:
      return (
        <span
          className={`inline-flex items-center font-semibold rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 ${sizeClasses}`}
        >
          {showIcon && <ShieldCheck className="w-3 h-3 mr-1 text-emerald-600 shrink-0" />}
          SAFE
        </span>
      );
  }
};
