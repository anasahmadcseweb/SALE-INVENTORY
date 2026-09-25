import React from 'react';
import { useApp } from '../../context/AppContext';
import { formatDateTime } from '../../utils/inventoryCalculations';
import { ShoppingBag, PlusCircle, RefreshCw, AlertTriangle, Trash2, ArrowRight } from 'lucide-react';

export const RecentActivityFeed: React.FC = () => {
  const { state, dispatch } = useApp();

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'sale':
        return <ShoppingBag className="w-3.5 h-3.5 text-indigo-600" />;
      case 'product_added':
        return <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />;
      case 'stock_restocked':
        return <RefreshCw className="w-3.5 h-3.5 text-blue-600" />;
      case 'alert_triggered':
        return <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />;
      case 'product_deleted':
        return <Trash2 className="w-3.5 h-3.5 text-slate-500" />;
      default:
        return <RefreshCw className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  const getActivityBg = (type: string) => {
    switch (type) {
      case 'sale':
        return 'bg-indigo-50 border-indigo-100';
      case 'product_added':
        return 'bg-emerald-50 border-emerald-100';
      case 'stock_restocked':
        return 'bg-blue-50 border-blue-100';
      case 'alert_triggered':
        return 'bg-rose-50 border-rose-100';
      case 'product_deleted':
        return 'bg-slate-100 border-slate-200';
      default:
        return 'bg-slate-50 border-slate-100';
    }
  };

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-2xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Real-Time Store Activity
          </h3>
          <p className="text-xs font-semibold text-slate-800 mt-0.5">
            Audit log of sales, restocks, & automated stock triggers
          </p>
        </div>
        <span className="text-[11px] font-medium text-slate-400">
          {state.activities.length} logged
        </span>
      </div>

      <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
        {state.activities.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            No activity events recorded yet.
          </div>
        ) : (
          state.activities.slice(0, 10).map((act) => (
            <div
              key={act.id}
              className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-slate-50/80 transition-colors border border-transparent hover:border-slate-100"
            >
              <div
                className={`p-2 rounded-lg border shrink-0 mt-0.5 ${getActivityBg(act.type)}`}
              >
                {getActivityIcon(act.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-semibold text-slate-900 truncate">
                    {act.title}
                  </h4>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    {formatDateTime(act.timestamp)}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 leading-snug break-words">
                  {act.description}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
        <button
          onClick={() => dispatch({ type: 'SET_ACTIVE_PAGE', page: 'pos' })}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
        >
          Create New POS Sale
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
