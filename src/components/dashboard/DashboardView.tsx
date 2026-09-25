import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { KpiCard } from './KpiCard';
import { BusinessCommandCenter } from './BusinessCommandCenter';
import { InventoryHealthCard } from './InventoryHealthCard';
import { RevenueChart } from './RevenueChart';
import { RecentActivityFeed } from './RecentActivityFeed';
import { formatCurrency, getStockStatus } from '../../utils/inventoryCalculations';
import { IndianRupee, ShoppingBag, Package, AlertTriangle, ArrowUpRight, Zap } from 'lucide-react';

export const DashboardView: React.FC = () => {
  const { state, dispatch } = useApp();

  // Dynamically calculated KPIs
  const kpis = useMemo(() => {
    const totalRevenue = state.sales.reduce((acc, s) => acc + s.total, 0);
    const totalOrders = state.sales.length;
    const totalProducts = state.products.length;

    // Low stock count (Low + Critical + Out of stock)
    const lowStockCount = state.products.filter((p) => {
      const s = getStockStatus(p.stock);
      return s !== 'healthy';
    }).length;

    const criticalCount = state.products.filter((p) => {
      const s = getStockStatus(p.stock);
      return s === 'critical' || s === 'out_of_stock';
    }).length;

    // Average order value
    const aov = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    return {
      totalRevenue,
      totalOrders,
      totalProducts,
      lowStockCount,
      criticalCount,
      aov,
    };
  }, [state.sales, state.products]);

  return (
    <div className="space-y-6">
      {/* Top Banner with Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white rounded-xl border border-slate-200/90 shadow-2xs">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
            Store Performance Overview
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time synchronization active across Inventory, POS, and Reorder engines
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => dispatch({ type: 'TOGGLE_DEMO_MODAL', open: true })}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors shadow-2xs cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-indigo-600" />
            Simulate POS Sale
          </button>
          <button
            onClick={() => dispatch({ type: 'SET_ACTIVE_PAGE', page: 'pos' })}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-xs"
          >
            Open POS Register
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 4 Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Revenue"
          value={formatCurrency(kpis.totalRevenue)}
          subtitle={`Avg Order Value: ${formatCurrency(kpis.aov)}`}
          icon={<IndianRupee className="w-5 h-5" />}
          trend={{ value: `${state.sales.length} orders completed`, positive: true }}
          onClick={() => dispatch({ type: 'SET_ACTIVE_PAGE', page: 'analytics' })}
        />

        <KpiCard
          title="Total Orders"
          value={kpis.totalOrders}
          subtitle="Processed via POS register"
          icon={<ShoppingBag className="w-5 h-5" />}
          trend={{ value: 'Real-time billing', positive: true }}
          onClick={() => dispatch({ type: 'SET_ACTIVE_PAGE', page: 'pos' })}
        />

        <KpiCard
          title="Total Products"
          value={kpis.totalProducts}
          subtitle="Active SKUs in inventory"
          icon={<Package className="w-5 h-5" />}
          onClick={() => dispatch({ type: 'SET_ACTIVE_PAGE', page: 'inventory' })}
        />

        <KpiCard
          title="Low Stock Products"
          value={kpis.lowStockCount}
          subtitle={`${kpis.criticalCount} critical or zero stock`}
          icon={<AlertTriangle className="w-5 h-5" />}
          variant={kpis.lowStockCount > 0 ? 'danger' : 'success'}
          trend={{
            value: kpis.criticalCount > 0 ? 'Urgent action required' : 'Stock levels monitored',
            positive: kpis.lowStockCount === 0,
          }}
          onClick={() => dispatch({ type: 'SET_ACTIVE_PAGE', page: 'reorder' })}
        />
      </div>

      {/* Business Command Center */}
      <BusinessCommandCenter />

      {/* Revenue Trend & Inventory Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueChart />
        </div>
        <div>
          <InventoryHealthCard />
        </div>
      </div>

      {/* Real-time Activity Feed */}
      <RecentActivityFeed />
    </div>
  );
};
