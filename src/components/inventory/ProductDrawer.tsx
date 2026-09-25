import React, { useMemo } from 'react';
import { Product } from '../../types';
import {
  getStockStatus,
  getStockCoverageDays,
  formatCoverageDays,
  getStockOutRisk,
  getRequiredStock,
  getRecommendedReorder,
  formatCurrency,
  formatDateTime,
} from '../../utils/inventoryCalculations';
import { StatusBadge } from '../common/StatusBadge';
import { RiskBadge } from '../common/RiskBadge';
import { useApp } from '../../context/AppContext';
import {
  X,
  ShoppingCart,
  Edit,
  RefreshCw,
  SlidersHorizontal,
  Clock,
  Package,
  Sparkles,
  TrendingDown,
  Receipt,
  ShoppingBag,
} from 'lucide-react';

interface ProductDrawerProps {
  product: Product | null;
  onClose: () => void;
  onEdit: (product: Product) => void;
}

export const ProductDrawer: React.FC<ProductDrawerProps> = ({ product, onClose, onEdit }) => {
  const { state, dispatch } = useApp();

  // Find recent sales for this specific product
  const recentSalesForProduct = useMemo(() => {
    if (!product) return [];
    const salesList: {
      receiptNumber: string;
      timestamp: string;
      quantity: number;
      subtotal: number;
    }[] = [];

    state.sales.forEach((s) => {
      const match = s.items.find((item) => item.productId === product.id);
      if (match) {
        salesList.push({
          receiptNumber: s.receiptNumber,
          timestamp: s.timestamp,
          quantity: match.quantity,
          subtotal: match.subtotal,
        });
      }
    });

    return salesList;
  }, [product, state.sales]);

  if (!product) return null;

  const status = getStockStatus(product.stock);
  const coverageDays = getStockCoverageDays(product.stock, product.avgDailySales);
  const requiredStock = getRequiredStock(product.avgDailySales, product.leadTime, product.safetyStock);
  const recommendedReorder = getRecommendedReorder(requiredStock, product.stock);
  const riskAnalysis = getStockOutRisk(coverageDays, product.leadTime, product.stock);

  const totalUnitsSold = recentSalesForProduct.reduce((sum, s) => sum + s.quantity, 0);
  const totalRevenueGenerated = recentSalesForProduct.reduce((sum, s) => sum + s.subtotal, 0);

  const handleSellInPOS = () => {
    dispatch({ type: 'ADD_TO_CART', product, quantity: 1 });
    dispatch({ type: 'SET_ACTIVE_PAGE', page: 'pos' });
    onClose();
  };

  const handleViewReorder = () => {
    dispatch({ type: 'SET_ACTIVE_PAGE', page: 'reorder' });
    onClose();
  };

  const handleSimulateRisk = () => {
    dispatch({ type: 'OPEN_SIMULATOR_FOR_PRODUCT', product });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-2xs">
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="px-6 py-5 bg-slate-50 border-b border-slate-200 flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
                {product.category}
              </span>
              <h3 className="text-base font-extrabold text-slate-900 mt-0.5 leading-snug">
                {product.name}
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                SKU: {product.sku || 'N/A'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            {/* Top Stat Row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-[11px] font-semibold text-slate-500 uppercase">
                  Selling Price
                </span>
                <p className="text-lg font-bold text-slate-900 mt-1">
                  {formatCurrency(product.price)}
                </p>
                <span className="text-[11px] text-slate-400">
                  Cost: {formatCurrency(product.costPrice)}
                </span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-[11px] font-semibold text-slate-500 uppercase">
                  Current Stock
                </span>
                <p className="text-lg font-bold text-slate-900 mt-1">
                  {product.stock} <span className="text-xs font-normal text-slate-500">units</span>
                </p>
                <div className="mt-1">
                  <StatusBadge status={status} size="sm" />
                </div>
              </div>
            </div>

            {/* Stock-out Risk Assessment Box */}
            <div
              className={`p-4 rounded-xl border ${
                riskAnalysis.level === 'OUT_OF_STOCK' || riskAnalysis.level === 'AT_RISK'
                  ? 'bg-rose-50/70 border-rose-200'
                  : riskAnalysis.level === 'WATCH'
                  ? 'bg-amber-50/70 border-amber-200'
                  : 'bg-emerald-50/70 border-emerald-200'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5">
                  <Sparkles
                    className={`w-4 h-4 ${
                      riskAnalysis.isAtRisk ? 'text-rose-600' : 'text-slate-600'
                    }`}
                  />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Stock-Out Risk Analysis
                  </h4>
                </div>
                <RiskBadge level={riskAnalysis.level} size="sm" />
              </div>
              <p className="text-xs leading-relaxed text-slate-800 font-medium">
                {riskAnalysis.explanation}
              </p>
            </div>

            {/* Replenishment Intelligence Matrix */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Replenishment Metrics
              </h4>
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-600">Average Daily Sales</span>
                  <span className="font-semibold text-slate-900">
                    {product.avgDailySales > 0 ? `${product.avgDailySales} units / day` : '0 units (No sales)'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-600">Stock Coverage</span>
                  <span
                    className={`font-bold ${
                      riskAnalysis.isAtRisk ? 'text-rose-600' : 'text-slate-900'
                    }`}
                  >
                    {formatCoverageDays(coverageDays)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-600">Supplier Lead Time</span>
                  <span className="font-semibold text-slate-900">{product.leadTime} days</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-600">Safety Buffer Stock</span>
                  <span className="font-semibold text-slate-900">{product.safetyStock} units</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-indigo-50/50 border border-indigo-100">
                  <span className="text-indigo-900 font-medium">Required Stock Buffer</span>
                  <span className="font-bold text-indigo-900">{requiredStock} units</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-indigo-50 border border-indigo-200">
                  <span className="text-indigo-950 font-semibold">Recommended Reorder</span>
                  <span className="font-black text-indigo-700 text-sm">
                    {recommendedReorder} units
                  </span>
                </div>
              </div>
            </div>

            {/* Recent Sales Information Section */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Recent Sales History
                </h4>
                <span className="text-[11px] font-semibold text-slate-500">
                  {totalUnitsSold} units sold ({formatCurrency(totalRevenueGenerated)})
                </span>
              </div>

              {recentSalesForProduct.length === 0 ? (
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg text-center text-xs text-slate-400">
                  No sales recorded yet for this product.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                  {recentSalesForProduct.slice(0, 5).map((sale, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100/80 border border-slate-100 text-xs transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Receipt className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <div>
                          <div className="font-semibold text-slate-800">
                            Receipt #{sale.receiptNumber}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {formatDateTime(sale.timestamp)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-900">
                          {sale.quantity} units
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {formatCurrency(sale.subtotal)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 grid grid-cols-2 gap-2">
            <button
              onClick={handleSellInPOS}
              disabled={product.stock <= 0}
              className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-40 transition-colors shadow-xs"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              Open POS
            </button>

            <button
              onClick={() => onEdit(product)}
              className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <Edit className="w-3.5 h-3.5" />
              Edit Product
            </button>

            <button
              onClick={handleViewReorder}
              className="inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              View Reorder
            </button>

            <button
              onClick={handleSimulateRisk}
              className="inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Simulate Risk
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
