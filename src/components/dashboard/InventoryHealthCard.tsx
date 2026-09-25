import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { getStockStatus } from '../../utils/inventoryCalculations';
import { ShieldAlert, CheckCircle2, AlertTriangle, AlertOctagon } from 'lucide-react';

export const InventoryHealthCard: React.FC = () => {
  const { state, dispatch } = useApp();

  const health = useMemo(() => {
    let healthy = 0;
    let low = 0;
    let critical = 0;
    let outOfStock = 0;

    state.products.forEach((p) => {
      const status = getStockStatus(p.stock);
      if (status === 'out_of_stock') outOfStock++;
      else if (status === 'critical') critical++;
      else if (status === 'low') low++;
      else healthy++;
    });

    const total = state.products.length || 1;
    const healthyPct = Math.round((healthy / total) * 100);
    const lowPct = Math.round((low / total) * 100);
    const criticalPct = Math.round((critical / total) * 100);
    const oosPct = 100 - healthyPct - lowPct - criticalPct;

    return {
      total: state.products.length,
      healthy,
      low,
      critical,
      outOfStock,
      healthyPct,
      lowPct,
      criticalPct,
      oosPct: Math.max(0, oosPct),
    };
  }, [state.products]);

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Inventory Health Distribution
            </h3>
            <p className="text-xs text-slate-800 font-semibold mt-0.5">
              {health.total} total catalog items monitored
            </p>
          </div>
          <button
            onClick={() => dispatch({ type: 'SET_ACTIVE_PAGE', page: 'inventory' })}
            className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            Manage All
          </button>
        </div>

        {/* Visual Multi-Segment Bar */}
        <div className="mt-4 h-3.5 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
          <div
            style={{ width: `${health.healthyPct}%` }}
            className="bg-emerald-500 transition-all duration-300"
            title={`Healthy: ${health.healthy} (${health.healthyPct}%)`}
          />
          <div
            style={{ width: `${health.lowPct}%` }}
            className="bg-amber-500 transition-all duration-300"
            title={`Low Stock: ${health.low} (${health.lowPct}%)`}
          />
          <div
            style={{ width: `${health.criticalPct}%` }}
            className="bg-rose-500 transition-all duration-300"
            title={`Critical: ${health.critical} (${health.criticalPct}%)`}
          />
          <div
            style={{ width: `${health.oosPct}%` }}
            className="bg-rose-900 transition-all duration-300"
            title={`Out of Stock: ${health.outOfStock} (${health.oosPct}%)`}
          />
        </div>

        {/* Health status legend grid */}
        <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
          <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/60 border border-emerald-100">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="font-medium text-emerald-900">Healthy (&gt;20)</span>
            </div>
            <span className="font-bold text-emerald-800">{health.healthy}</span>
          </div>

          <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50/60 border border-amber-100">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="font-medium text-amber-900">Low (5 - 20)</span>
            </div>
            <span className="font-bold text-amber-800">{health.low}</span>
          </div>

          <div className="flex items-center justify-between p-2 rounded-lg bg-rose-50/60 border border-rose-100">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span className="font-medium text-rose-900">Critical (1 - 4)</span>
            </div>
            <span className="font-bold text-rose-800">{health.critical}</span>
          </div>

          <div className="flex items-center justify-between p-2 rounded-lg bg-rose-100/60 border border-rose-200">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-900" />
              <span className="font-medium text-rose-950">Out of Stock (0)</span>
            </div>
            <span className="font-bold text-rose-950">{health.outOfStock}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <span>Dynamic Stock Threshold Engine</span>
        <span className="font-semibold text-slate-700">
          {health.healthyPct}% Catalog In Stock
        </span>
      </div>
    </div>
  );
};
