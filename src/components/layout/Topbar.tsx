import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { NotificationDropdown } from './NotificationDropdown';
import { UserProfileDropdown } from './UserProfileDropdown';
import {
  getStockStatus,
  getStockCoverageDays,
  hasStockOutRisk,
  getRequiredStock,
  getRecommendedReorder,
} from '../../utils/inventoryCalculations';
import {
  Bell,
  Bot,
  Menu,
  Sparkles,
  ShoppingCart,
  Store,
} from 'lucide-react';

interface TopbarProps {
  onOpenMobile: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onOpenMobile }) => {
  const { state, dispatch } = useApp();

  // Compute active alert count
  const alertCount = useMemo(() => {
    let count = 0;
    state.products.forEach((p) => {
      const status = getStockStatus(p.stock);
      const coverage = getStockCoverageDays(p.stock, p.avgDailySales);
      const atRisk = hasStockOutRisk(coverage, p.leadTime, p.stock);
      const req = getRequiredStock(p.avgDailySales, p.leadTime, p.safetyStock);
      const reorderQty = getRecommendedReorder(req, p.stock);

      if (status === 'out_of_stock' || status === 'critical') {
        count++;
      } else if (atRisk && reorderQty > 0) {
        count++;
      }
    });
    return count;
  }, [state.products]);

  const pageTitles: Record<string, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Good morning, Admin',
      subtitle: "Here's what's happening with your store today.",
    },
    inventory: {
      title: 'Inventory Management',
      subtitle: 'Track on-hand units, lead times, safety stocks, and replenishment coverage.',
    },
    pos: {
      title: 'Point of Sale (POS)',
      subtitle: 'Fast billing, instant inventory deduction, and GST tax invoice generation.',
    },
    reorder: {
      title: 'Smart Reorder Intelligence',
      subtitle: 'Data-driven replenishment based on daily sales velocity, lead times & buffers.',
    },
    simulator: {
      title: 'Inventory Risk Simulator',
      subtitle: 'Model stock-out probabilities and test reorder quantities in sandbox mode.',
    },
    analytics: {
      title: 'Business Analytics & Reports',
      subtitle: 'Revenue curves, top velocity products, and category margins.',
    },
    settings: {
      title: 'System Settings',
      subtitle: 'Configure store profile, currency, GST tax rates, and database state.',
    },
  };

  const current = pageTitles[state.activePage] || {
    title: 'STOCKFLOW',
    subtitle: 'Store Operations',
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200/90 flex items-center justify-between px-4 sm:px-6">
      {/* Left: Mobile hamburger & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobile}
          className="p-1.5 -ml-1 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 md:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
            {current.title}
          </h1>
          <p className="text-[11px] text-slate-500 hidden sm:block leading-none mt-0.5">
            {current.subtitle}
          </p>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Live Demo Trigger */}
        <button
          onClick={() => dispatch({ type: 'TOGGLE_DEMO_MODAL', open: true })}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors shadow-2xs group cursor-pointer"
          title="Open Live POS Sale Simulation (Demonstrates real transaction logic across systems)"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-600 group-hover:rotate-12 transition-transform" />
          <span className="hidden xs:inline">Simulate POS Sale</span>
        </button>

        {/* Quick POS Cart Pill (if items in cart) */}
        {state.cart.length > 0 && state.activePage !== 'pos' && (
          <button
            onClick={() => dispatch({ type: 'SET_ACTIVE_PAGE', page: 'pos' })}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Cart ({state.cart.length})</span>
          </button>
        )}

        {/* Copilot Toggle */}
        <button
          onClick={() => dispatch({ type: 'TOGGLE_COPILOT' })}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-all ${
            state.copilotOpen
              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
          title="Open StockFlow AI Copilot"
        >
          <Bot className="w-3.5 h-3.5 text-indigo-500" />
          <span className="hidden sm:inline">Copilot</span>
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => dispatch({ type: 'TOGGLE_NOTIFICATIONS' })}
            className={`p-2 rounded-lg border transition-colors relative ${
              state.notificationsOpen
                ? 'bg-slate-100 text-slate-900 border-slate-300'
                : 'text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
            title="Real-time stock alerts"
          >
            <Bell className="w-4 h-4" />
            {alertCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[9px] font-bold text-white shadow-2xs">
                {alertCount}
              </span>
            )}
          </button>

          {state.notificationsOpen && <NotificationDropdown />}
        </div>

        <div className="h-6 w-px bg-slate-200 hidden sm:block" />

        {/* User Profile and Store Manager Identity */}
        <UserProfileDropdown />
      </div>
    </header>
  );
};
