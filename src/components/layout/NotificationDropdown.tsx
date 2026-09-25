import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  getStockStatus,
  getStockCoverageDays,
  getStockOutRisk,
  getRequiredStock,
  getRecommendedReorder,
  formatCurrency,
  formatDateTime,
} from '../../utils/inventoryCalculations';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCheck,
  RefreshCw,
  ShoppingBag,
  Bell,
  Eye,
} from 'lucide-react';

interface NotificationAlert {
  id: string;
  type: 'out_of_stock' | 'critical' | 'low' | 'risk' | 'reorder' | 'recent_sale';
  title: string;
  description: string;
  timestamp?: string;
  actionLabel: string;
  targetPage?: 'reorder' | 'simulator' | 'inventory' | 'pos' | 'analytics';
  productId?: string;
  saleReceipt?: string;
}

export const NotificationDropdown: React.FC = () => {
  const { state, dispatch } = useApp();
  const [filterTab, setFilterTab] = useState<'all' | 'risks' | 'sales'>('all');

  const alerts = useMemo(() => {
    const list: NotificationAlert[] = [];

    // 1. Scan products for stock health, stock-out risk, and reorders
    state.products.forEach((p) => {
      const status = getStockStatus(p.stock);
      const coverage = getStockCoverageDays(p.stock, p.avgDailySales);
      const risk = getStockOutRisk(coverage, p.leadTime, p.stock);
      const req = getRequiredStock(p.avgDailySales, p.leadTime, p.safetyStock);
      const reorderQty = getRecommendedReorder(req, p.stock);

      if (status === 'out_of_stock') {
        list.push({
          id: `oos-${p.id}`,
          type: 'out_of_stock',
          title: `${p.name} is Out of Stock`,
          description: `Stock is 0 units. Lost sales occurring. Immediate reorder of ${reorderQty} units required.`,
          actionLabel: 'Reorder Now',
          targetPage: 'reorder',
          productId: p.id,
        });
      } else if (status === 'critical') {
        list.push({
          id: `crit-${p.id}`,
          type: 'critical',
          title: `Critical Stock: ${p.name}`,
          description: `Only ${p.stock} units left. Lead time is ${p.leadTime} days.`,
          actionLabel: 'Simulate Risk',
          targetPage: 'simulator',
          productId: p.id,
        });
      } else if (risk.level === 'AT_RISK') {
        list.push({
          id: `risk-${p.id}`,
          type: 'risk',
          title: `Stock-Out Risk: ${p.name}`,
          description: `Coverage (${coverage}d) is less than lead time (${p.leadTime}d). Stockout probable.`,
          actionLabel: 'View Reorder Plan',
          targetPage: 'reorder',
          productId: p.id,
        });
      } else if (status === 'low' && reorderQty > 0) {
        list.push({
          id: `low-${p.id}`,
          type: 'low',
          title: `Low Stock Warning: ${p.name}`,
          description: `Current stock (${p.stock} units) approaching buffer. Recommended reorder: ${reorderQty} units.`,
          actionLabel: 'Inspect Product',
          targetPage: 'inventory',
          productId: p.id,
        });
      }
    });

    // 2. Scan recent sales
    state.sales.slice(0, 3).forEach((sale) => {
      const units = sale.items.reduce((sum, it) => sum + it.quantity, 0);
      list.push({
        id: `sale-${sale.id}`,
        type: 'recent_sale',
        title: `Sale #${sale.receiptNumber} Completed`,
        description: `Sold ${units} items for ${formatCurrency(sale.total)} via ${sale.paymentMethod} to ${sale.customerName || 'Walk-in'}.`,
        timestamp: sale.timestamp,
        actionLabel: 'View Receipt',
        targetPage: 'pos',
        saleReceipt: sale.receiptNumber,
      });
    });

    return list;
  }, [state.products, state.sales]);

  const filteredAlerts = useMemo(() => {
    if (filterTab === 'risks') {
      return alerts.filter(
        (a) => a.type === 'out_of_stock' || a.type === 'critical' || a.type === 'risk' || a.type === 'low'
      );
    }
    if (filterTab === 'sales') {
      return alerts.filter((a) => a.type === 'recent_sale');
    }
    return alerts;
  }, [alerts, filterTab]);

  const handleAction = (alert: NotificationAlert) => {
    dispatch({ type: 'TOGGLE_NOTIFICATIONS', open: false });

    if (alert.type === 'recent_sale' && alert.saleReceipt) {
      const targetSale = state.sales.find((s) => s.receiptNumber === alert.saleReceipt);
      if (targetSale) {
        dispatch({ type: 'SET_RECEIPT_MODAL', sale: targetSale });
        return;
      }
    }

    if (alert.targetPage) {
      dispatch({ type: 'SET_ACTIVE_PAGE', page: alert.targetPage });
    }

    if (alert.productId) {
      const prod = state.products.find((p) => p.id === alert.productId);
      if (prod) {
        if (alert.targetPage === 'simulator') {
          dispatch({ type: 'OPEN_SIMULATOR_FOR_PRODUCT', product: prod });
        } else {
          dispatch({ type: 'OPEN_PRODUCT_DRAWER', product: prod });
        }
      }
    }
  };

  return (
    <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
      {/* Alert Header */}
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-3.5 h-3.5 text-indigo-600" />
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
            Smart Alert Center
          </span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
            {alerts.length}
          </span>
        </div>
        <button
          onClick={() => dispatch({ type: 'TOGGLE_NOTIFICATIONS', open: false })}
          className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
        >
          Close
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-100 bg-white text-xs font-semibold px-2 pt-1 gap-1">
        <button
          onClick={() => setFilterTab('all')}
          className={`py-1.5 px-3 border-b-2 transition-colors ${
            filterTab === 'all'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          All ({alerts.length})
        </button>
        <button
          onClick={() => setFilterTab('risks')}
          className={`py-1.5 px-3 border-b-2 transition-colors ${
            filterTab === 'risks'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Stock Alerts
        </button>
        <button
          onClick={() => setFilterTab('sales')}
          className={`py-1.5 px-3 border-b-2 transition-colors ${
            filterTab === 'sales'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Recent Sales
        </button>
      </div>

      {/* Notification Items */}
      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
        {filteredAlerts.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <CheckCheck className="w-8 h-8 mx-auto text-emerald-500 mb-2 stroke-[1.5]" />
            <p className="text-xs font-semibold text-slate-700">No alerts in this category</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Everything is operating smoothly.</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className="p-3.5 hover:bg-slate-50 transition-colors flex items-start gap-3"
            >
              <div className="mt-0.5 shrink-0">
                {alert.type === 'out_of_stock' ? (
                  <AlertCircle className="w-4 h-4 text-rose-700" />
                ) : alert.type === 'critical' ? (
                  <AlertCircle className="w-4 h-4 text-rose-500" />
                ) : alert.type === 'risk' ? (
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                ) : alert.type === 'low' ? (
                  <Eye className="w-4 h-4 text-amber-600" />
                ) : (
                  <ShoppingBag className="w-4 h-4 text-emerald-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 truncate">{alert.title}</h4>
                  {alert.timestamp && (
                    <span className="text-[9px] text-slate-400 font-mono">
                      {formatDateTime(alert.timestamp)}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{alert.description}</p>
                <button
                  onClick={() => handleAction(alert)}
                  className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  {alert.actionLabel}
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
        <button
          onClick={() => {
            dispatch({ type: 'TOGGLE_NOTIFICATIONS', open: false });
            dispatch({ type: 'SET_ACTIVE_PAGE', page: 'reorder' });
          }}
          className="text-xs font-medium text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1"
        >
          <RefreshCw className="w-3 h-3" />
          Reorder Workbench
        </button>
        <button
          onClick={() => {
            dispatch({ type: 'TOGGLE_NOTIFICATIONS', open: false });
            dispatch({ type: 'TOGGLE_DEMO_MODAL', open: true });
          }}
          className="text-xs font-medium text-slate-500 hover:text-slate-800 inline-flex items-center gap-1"
        >
          Simulate POS Sale
        </button>
      </div>
    </div>
  );
};
