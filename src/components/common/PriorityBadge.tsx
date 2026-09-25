import React from 'react';
import { ReorderPriority } from '../../types';

interface PriorityBadgeProps {
  priority: ReorderPriority;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority }) => {
  switch (priority) {
    case 'URGENT':
      return (
        <span className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded bg-rose-900 text-white shadow-xs">
          URGENT
        </span>
      );
    case 'HIGH':
      return (
        <span className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
          HIGH
        </span>
      );
    case 'MEDIUM':
      return (
        <span className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
          MEDIUM
        </span>
      );
    case 'LOW':
      return (
        <span className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
          LOW
        </span>
      );
    case 'NO_ACTION':
    default:
      return (
        <span className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
          NO ACTION
        </span>
      );
  }
};
