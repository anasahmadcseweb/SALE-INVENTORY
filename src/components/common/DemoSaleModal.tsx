import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  getStockStatus,
  getStockCoverageDays,
  formatCoverageDays,
  getStockOutRisk,
  formatCurrency,
} from '../../utils/inventoryCalculations';
import { RiskBadge } from './RiskBadge';
import {
  Sparkles,
  X,
  ArrowRight,
  Zap,
  ShoppingBag,
  TrendingDown,
  CheckCircle2,
  Package,
} from 'lucide-react';

export const DemoSaleModal: React.FC = () => {
  const { state, dispatch } = useApp();

  // Find in-stock products
  const availableProducts = useMemo(() => {
    return state.products.filter((p) => p.stock > 0);
  }, [state.products]);

  // Default to Wireless Mouse if in stock, or first available product
  const defaultProduct =
    availableProducts.find((p) => p.name.toLowerCase().includes('wireless mouse')) ||
    availableProducts[0];

  const [selectedProductId, setSelectedProductId] = useState<string>(
    defaultProduct?.id || ''
  );
  const [quantity, setQuantity] = useState<number>(2);

  const selectedProduct = useMemo(() => {
    return (
      state.products.find((p) => p.id === selectedProductId) ||
      defaultProduct ||
      state.products[0]
    );
  }, [state.products, selectedProductId, defaultProduct]);

  // Calculations before and after
  const beforeAfter = useMemo(() => {
    if (!selectedProduct) return null;

    const currentStock = selectedProduct.stock;
    const currentCov = getStockCoverageDays(currentStock, selectedProduct.avgDailySales);
    const currentRisk = getStockOutRisk(currentCov, selectedProduct.leadTime, currentStock);

    const safeQty = Math.min(Math.max(1, quantity), Math.max(1, currentStock));
    const projectedStock = Math.max(0, currentStock - safeQty);
    const projectedCov = getStockCoverageDays(projectedStock, selectedProduct.avgDailySales);
    const projectedRisk = getStockOutRisk(projectedCov, selectedProduct.leadTime, projectedStock);

    const subtotal = selectedProduct.price * safeQty;
    const tax = Math.round(subtotal * (state.settings.taxRate / 100));
    const total = subtotal + tax;

    return {
      safeQty,
      currentStock,
      currentCov,
      currentRisk,
      projectedStock,
      projectedCov,
      projectedRisk,
      subtotal,
      tax,
      total,
    };
  }, [selectedProduct, quantity, state.settings.taxRate]);

  if (!state.demoModalOpen) return null;

  const handleExecute = () => {
    if (!selectedProduct || !beforeAfter) return;
    dispatch({
      type: 'EXECUTE_SIMULATED_SALE',
      productId: selectedProduct.id,
      quantity: beforeAfter.safeQty,
    });
  };

  const handleQuickWirelessMouse = () => {
    const mouse = state.products.find((p) => p.name.toLowerCase().includes('wireless mouse'));
    if (mouse && mouse.stock >= 2) {
      dispatch({
        type: 'EXECUTE_SIMULATED_SALE',
        productId: mouse.id,
        quantity: 2,
      });
    } else {
      dispatch({ type: 'RUN_LIVE_DEMO' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-2xs">
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-linear-to-r from-indigo-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-white/10 border border-white/20 text-indigo-300">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">
                Live POS Sale Simulation Mode
              </h3>
              <p className="text-[11px] text-indigo-200">
                Executes genuine transaction logic across all application systems
              </p>
            </div>
          </div>
          <button
            onClick={() => dispatch({ type: 'TOGGLE_DEMO_MODAL', open: false })}
            className="text-slate-400 hover:text-white transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {/* Quick Benchmark Preset */}
          <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-lg flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-indigo-600" />
                Critical Acceptance Test 1 Benchmark
              </div>
              <p className="text-[11px] text-indigo-900 mt-0.5">
                Sell 2x Wireless Mouse (Deducts stock 10 → 8, updates revenue, coverage, and reorders)
              </p>
            </div>
            <button
              onClick={handleQuickWirelessMouse}
              className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors shrink-0 shadow-xs"
            >
              Run 1-Click
            </button>
          </div>

          <div className="pt-1">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Or Select Any Product to Simulate:
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => {
                setSelectedProductId(e.target.value);
                setQuantity(1);
              }}
              className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            >
              {availableProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (Stock: {p.stock} units | {formatCurrency(p.price)})
                </option>
              ))}
            </select>
          </div>

          {selectedProduct && beforeAfter && (
            <>
              {/* Quantity Selector */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Units to Sell in Transaction:
                  </label>
                  <span className="text-xs text-slate-500">
                    Max available: <strong>{selectedProduct.stock}</strong> units
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="1"
                    max={Math.max(1, selectedProduct.stock)}
                    value={beforeAfter.safeQty}
                    onChange={(e) => setQuantity(parseInt(e.target.value, 10))}
                    className="flex-1 accent-indigo-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                  />
                  <div className="w-16 text-center font-extrabold text-sm py-1 bg-white border border-slate-300 rounded-md text-slate-900">
                    {beforeAfter.safeQty}
                  </div>
                </div>
              </div>

              {/* Before & After Cascade Matrix */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Real-time Cascade Impact
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded-lg bg-white border border-slate-200">
                    <span className="text-slate-500 block">Inventory Stock</span>
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 mt-0.5">
                      <span>{beforeAfter.currentStock}</span>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                      <span className="text-rose-600 font-extrabold">
                        {beforeAfter.projectedStock} units
                      </span>
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-white border border-slate-200">
                    <span className="text-slate-500 block">Stock Coverage</span>
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 mt-0.5">
                      <span>{beforeAfter.currentCov ?? 'N/A'}d</span>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                      <span className="text-indigo-600 font-extrabold">
                        {beforeAfter.projectedCov ?? 'N/A'} days
                      </span>
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-white border border-slate-200">
                    <span className="text-slate-500 block">Stock-out Risk</span>
                    <div className="mt-0.5">
                      <RiskBadge level={beforeAfter.projectedRisk.level} size="sm" />
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-white border border-slate-200">
                    <span className="text-slate-500 block">Revenue Addition</span>
                    <span className="font-extrabold text-emerald-600 mt-0.5 block">
                      +{formatCurrency(beforeAfter.total)}{' '}
                      <span className="font-normal text-[10px] text-slate-400">(incl. GST)</span>
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={() => dispatch({ type: 'TOGGLE_DEMO_MODAL', open: false })}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleExecute}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs"
            >
              <CheckCircle2 className="w-4 h-4" />
              Confirm &amp; Execute Transaction
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
