import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { AppPage } from '../../types';
import { getStockStatus } from '../../utils/inventoryCalculations';
import {
  LayoutDashboard,
  Boxes,
  ShoppingCart,
  RefreshCw,
  SlidersHorizontal,
  BarChart3,
  Settings,
  ShieldCheck,
  Zap,
  LogOut,
} from 'lucide-react';

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const { state, dispatch } = useApp();
  const { currentUser, userProfile, signOutUser } = useAuth();

  const navItems: { id: AppPage; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'inventory',
      label: 'Inventory',
      icon: <Boxes className="w-4 h-4" />,
    },
    {
      id: 'pos',
      label: 'POS / Sales',
      icon: <ShoppingCart className="w-4 h-4" />,
      badge: state.cart.length > 0 ? state.cart.length : undefined,
    },
    {
      id: 'reorder',
      label: 'Smart Reorder',
      icon: <RefreshCw className="w-4 h-4" />,
    },
    {
      id: 'simulator',
      label: 'Risk Simulator',
      icon: <SlidersHorizontal className="w-4 h-4" />,
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: <BarChart3 className="w-4 h-4" />,
    },
  ];

  // Calculate critical products count
  const criticalCount = useMemo(() => {
    return state.products.filter((p) => {
      const s = getStockStatus(p.stock);
      return s === 'critical' || s === 'out_of_stock';
    }).length;
  }, [state.products]);

  const handleNavigate = (page: AppPage) => {
    dispatch({ type: 'SET_ACTIVE_PAGE', page });
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/50 md:hidden backdrop-blur-xs"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200/90 flex flex-col transition-transform duration-200 ease-in-out md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex flex-col justify-center px-6 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <span className="text-base font-extrabold tracking-tight text-slate-900 font-mono">
                STOCKFLOW
              </span>
            </div>
          </div>
          <span className="text-[10px] text-slate-400 font-medium tracking-tight mt-0.5">
            Smart Inventory. Smarter Decisions.
          </span>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Main Menu
          </div>
          {navItems.map((item) => {
            const isActive = state.activePage === item.id;
            const isReorder = item.id === 'reorder';

            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-bold border-l-3 border-indigo-600 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`${isActive ? 'text-indigo-600' : 'text-slate-400'}`}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>

                {isReorder && criticalCount > 0 ? (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-100 text-rose-700 animate-pulse">
                    {criticalCount}
                  </span>
                ) : item.badge !== undefined ? (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-indigo-100 text-indigo-700">
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>

        {/* System & Settings Footer */}
        <div className="p-3 border-t border-slate-100 space-y-1">
          <button
            onClick={() => handleNavigate('settings')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
              state.activePage === 'settings'
                ? 'bg-indigo-50 text-indigo-700 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Settings
              className={`w-4 h-4 ${
                state.activePage === 'settings' ? 'text-indigo-600' : 'text-slate-400'
              }`}
            />
            <span>Settings</span>
          </button>

          {/* User / Store badge */}
          {currentUser && (
            <div className="pt-2 px-2 flex items-center justify-between border-t border-slate-100">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                  {(userProfile?.displayName || currentUser.email || 'SM')
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-slate-800 leading-tight truncate">
                    {userProfile?.displayName || 'Store Manager'}
                  </span>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1 truncate">
                    <ShieldCheck className="w-3 h-3 text-emerald-500 shrink-0" />
                    Store Manager
                  </span>
                </div>
              </div>

              <button
                onClick={() => signOutUser()}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
                title="Sign Out Session"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
