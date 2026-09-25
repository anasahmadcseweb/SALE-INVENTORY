import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';
import {
  getStockStatus,
  getStockCoverageDays,
  formatCoverageDays,
  getRequiredStock,
  getRecommendedReorder,
  getStockOutRisk,
  hasStockOutRisk,
  formatCurrency,
} from '../../utils/inventoryCalculations';
import { StatusBadge } from '../common/StatusBadge';
import { RiskBadge } from '../common/RiskBadge';
import { ConfirmationModal } from '../common/ConfirmationModal';
import {
  SlidersHorizontal,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
  ArrowRight,
  Package,
  Layers,
  Sparkles,
} from 'lucide-react';

export const RiskSimulatorView: React.FC = () => {
  const { state, dispatch } = useApp();

  // If a product was selected from drawer or notification, preselect it
  const initialProduct =
    state.selectedProductForSimulator ||
    state.products.find((p) => p.stock < 5) ||
    state.products[0];

  const [selectedProductId, setSelectedProductId] = useState<string>(
    initialProduct?.id || ''
  );

  useEffect(() => {
    if (state.selectedProductForSimulator) {
      setSelectedProductId(state.selectedProductForSimulator.id);
    }
  }, [state.selectedProductForSimulator]);

  const selectedProduct = useMemo(() => {
    return state.products.find((p) => p.id === selectedProductId) || state.products[0];
  }, [state.products, selectedProductId]);

  // Baseline calculations
  const baseline = useMemo(() => {
    if (!selectedProduct) return null;

    const status = getStockStatus(selectedProduct.stock);
    const coverage = getStockCoverageDays(selectedProduct.stock, selectedProduct.avgDailySales);
    const required = getRequiredStock(
      selectedProduct.avgDailySales,
      selectedProduct.leadTime,
      selectedProduct.safetyStock
    );
    const recommendedReorder = getRecommendedReorder(required, selectedProduct.stock);
    const risk = getStockOutRisk(coverage, selectedProduct.leadTime, selectedProduct.stock);

    return {
      status,
      coverage,
      required,
      recommendedReorder,
      risk,
    };
  }, [selectedProduct]);

  // Simulated reorder input state
  const [simulatedReorder, setSimulatedReorder] = useState<number>(
    baseline ? baseline.recommendedReorder : 10
  );

  // Update default simulated reorder when product changes
  useEffect(() => {
    if (baseline) {
      setSimulatedReorder(baseline.recommendedReorder > 0 ? baseline.recommendedReorder : 15);
    }
  }, [selectedProductId, baseline?.recommendedReorder]);

  // Projected calculations (Simulation sandbox only)
  const projection = useMemo(() => {
    if (!selectedProduct || !baseline) return null;

    const safeSimQty = Math.max(0, simulatedReorder || 0);
    const projectedStock = selectedProduct.stock + safeSimQty;
    const projectedCoverage = getStockCoverageDays(projectedStock, selectedProduct.avgDailySales);
    const projectedRisk = getStockOutRisk(
      projectedCoverage,
      selectedProduct.leadTime,
      projectedStock
    );
    const projectedStatus = getStockStatus(projectedStock);
    const estimatedCost = safeSimQty * selectedProduct.costPrice;

    return {
      safeSimQty,
      projectedStock,
      projectedCoverage,
      projectedRisk,
      projectedStatus,
      estimatedCost,
    };
  }, [selectedProduct, baseline, simulatedReorder]);

  // Confirmation modal state for safe live application
  const [applyModalOpen, setApplyModalOpen] = useState(false);

  const handleConfirmApply = () => {
    if (!selectedProduct || !projection) return;
    dispatch({
      type: 'APPLY_SIMULATED_REORDER',
      productId: selectedProduct.id,
      quantity: projection.safeSimQty,
    });
    setApplyModalOpen(false);
  };

  if (!selectedProduct || !baseline || !projection) {
    return (
      <div className="p-8 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
        No product available to simulate.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Simulation Sandbox Notice Banner */}
      <div className="bg-amber-500/10 border border-amber-300/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-amber-500 text-white shadow-2xs">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                Simulation Sandbox Mode
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-200 text-amber-900">
                SIMULATION ONLY
              </span>
            </div>
            <p className="text-xs text-amber-900 mt-0.5">
              Adjust reorder quantities in sandbox without altering live inventory. Apply to live
              state when ready.
            </p>
          </div>
        </div>

        {/* Product selector dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">
            Selected SKU:
          </span>
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="text-xs font-bold bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
          >
            {state.products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} (Stock: {p.stock})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Comparison Grid: Current Live Reality VS Projected Simulation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Box 1: Current Live State */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-slate-500" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Current Live State
                </h4>
              </div>
              <StatusBadge status={baseline.status} size="sm" />
            </div>

            <div className="mt-4">
              <h3 className="text-base font-extrabold text-slate-900">{selectedProduct.name}</h3>
              <p className="text-xs text-slate-400 mt-0.5">{selectedProduct.category}</p>
            </div>

            <div className="mt-4 space-y-2.5 text-xs">
              <div className="flex justify-between p-2 rounded-lg bg-slate-50">
                <span className="text-slate-500">Current Stock On-Hand</span>
                <span className="font-bold text-slate-900">{selectedProduct.stock} units</span>
              </div>

              <div className="flex justify-between p-2 rounded-lg bg-slate-50">
                <span className="text-slate-500">Average Daily Sales</span>
                <span className="font-semibold text-slate-800">
                  {selectedProduct.avgDailySales} units / day
                </span>
              </div>

              <div className="flex justify-between p-2 rounded-lg bg-slate-50">
                <span className="text-slate-500">Current Stock Coverage</span>
                <span
                  className={`font-bold ${
                    baseline.coverage !== null && baseline.coverage < selectedProduct.leadTime
                      ? 'text-rose-600'
                      : 'text-slate-900'
                  }`}
                >
                  {baseline.coverage !== null ? `${baseline.coverage} days` : 'N/A'}
                </span>
              </div>

              <div className="flex justify-between p-2 rounded-lg bg-slate-50">
                <span className="text-slate-500">Supplier Lead Time</span>
                <span className="font-semibold text-slate-800">
                  {selectedProduct.leadTime} days
                </span>
              </div>

              <div className="flex justify-between p-2 rounded-lg bg-slate-50">
                <span className="text-slate-500">Target Safety Buffer</span>
                <span className="font-semibold text-slate-800">
                  {selectedProduct.safetyStock} units
                </span>
              </div>

              <div className="flex justify-between p-2 rounded-lg bg-slate-50">
                <span className="text-slate-500">Required Minimum Stock</span>
                <span className="font-semibold text-slate-800">
                  {baseline.required} units
                </span>
              </div>

              <div className="flex justify-between p-2 rounded-lg bg-indigo-50/60 border border-indigo-100">
                <span className="text-indigo-900 font-semibold">Recommended Reorder</span>
                <span className="font-extrabold text-indigo-700">
                  {baseline.recommendedReorder} units
                </span>
              </div>
            </div>
          </div>

          {/* Current Risk Verdict */}
          <div className="mt-5 pt-3 border-t border-slate-100">
            <div
              className={`p-3 rounded-lg border text-xs ${
                baseline.risk.isAtRisk
                  ? 'bg-rose-50/80 border-rose-200 text-rose-900'
                  : baseline.risk.level === 'WATCH'
                  ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                  : 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="font-bold text-[10px] uppercase tracking-wider">
                  Baseline Risk Level:
                </span>
                <RiskBadge level={baseline.risk.level} size="sm" />
              </div>
              <p className="font-medium leading-relaxed">{baseline.risk.explanation}</p>
            </div>
          </div>
        </div>

        {/* Box 2: Projected Simulated State */}
        <div className="bg-white rounded-xl border border-indigo-200 shadow-sm p-5 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
            Projected Model
          </div>

          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900">
                  Projected Simulation
                </h4>
              </div>
              <StatusBadge status={projection.projectedStatus} size="sm" />
            </div>

            {/* Interactive Slider & Controls */}
            <div className="mt-4 p-4 rounded-xl bg-indigo-50/60 border border-indigo-100 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-indigo-950">
                  Simulated Reorder Quantity
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="0"
                    max="500"
                    value={simulatedReorder}
                    onChange={(e) => setSimulatedReorder(parseInt(e.target.value, 10) || 0)}
                    className="w-20 text-center font-extrabold text-sm py-1 bg-white border border-indigo-300 rounded-md focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-indigo-900"
                  />
                  <span className="text-xs text-indigo-950 font-semibold">units</span>
                </div>
              </div>

              {/* Slider Input */}
              <input
                type="range"
                min="0"
                max={Math.max(60, baseline.recommendedReorder * 2)}
                value={simulatedReorder}
                onChange={(e) => setSimulatedReorder(parseInt(e.target.value, 10))}
                className="w-full accent-indigo-600 cursor-pointer h-2 bg-indigo-200 rounded-lg"
              />

              <div className="flex justify-between text-[10px] text-indigo-700 font-medium">
                <span>0 units (Do nothing)</span>
                <span>Recommended: {baseline.recommendedReorder} units</span>
                <span>Max: {Math.max(60, baseline.recommendedReorder * 2)} units</span>
              </div>
            </div>

            {/* Projected Key Metrics */}
            <div className="mt-4 space-y-2.5 text-xs">
              <div className="flex justify-between p-2 rounded-lg bg-slate-50">
                <span className="text-slate-500">Projected Total Stock</span>
                <span className="font-extrabold text-slate-900">
                  {projection.projectedStock} units{' '}
                  <span className="text-emerald-600 text-[11px]">
                    (+{projection.safeSimQty})
                  </span>
                </span>
              </div>

              <div className="flex justify-between p-2 rounded-lg bg-slate-50">
                <span className="text-slate-500">Projected Stock Coverage</span>
                <span
                  className={`font-black ${
                    projection.projectedRisk.isAtRisk ? 'text-rose-600' : 'text-emerald-600'
                  }`}
                >
                  {formatCoverageDays(projection.projectedCoverage)}
                </span>
              </div>

              <div className="flex justify-between p-2 rounded-lg bg-slate-50">
                <span className="text-slate-500">Estimated Reorder Cost</span>
                <span className="font-semibold text-slate-800">
                  {formatCurrency(projection.estimatedCost)}
                </span>
              </div>
            </div>
          </div>

          {/* Projected Verdict & Action Button */}
          <div className="mt-5 pt-3 border-t border-slate-100 space-y-3">
            <div
              className={`p-3 rounded-lg border text-xs ${
                projection.projectedRisk.isAtRisk
                  ? 'bg-rose-50/80 border-rose-200 text-rose-900'
                  : projection.projectedRisk.level === 'WATCH'
                  ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                  : 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="font-bold text-[10px] uppercase tracking-wider">
                  Projected Risk Level:
                </span>
                <RiskBadge level={projection.projectedRisk.level} size="sm" />
              </div>
              <p className="font-medium leading-relaxed">
                {projection.projectedRisk.isAtRisk
                  ? `Still at risk. Increase simulated quantity to cover ${selectedProduct.leadTime} days lead time.`
                  : `Risk Resolved: Stock-out averted! Coverage reaches ${projection.projectedCoverage} days.`}
              </p>
            </div>

            {/* Safe Live Apply Button */}
            <button
              onClick={() => setApplyModalOpen(true)}
              disabled={projection.safeSimQty <= 0}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 transition-colors shadow-xs flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Apply Reorder to Live Inventory (+{projection.safeSimQty} units)
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog before changing real data */}
      <ConfirmationModal
        isOpen={applyModalOpen}
        title="Apply Simulated Reorder to Live Inventory?"
        message={`This will add ${projection.safeSimQty} units directly to "${selectedProduct.name}", increasing live inventory from ${selectedProduct.stock} to ${projection.projectedStock} units. An audit log activity will be recorded.`}
        confirmLabel="Confirm & Restock"
        cancelLabel="Keep in Sandbox"
        variant="primary"
        onConfirm={handleConfirmApply}
        onCancel={() => setApplyModalOpen(false)}
      />
    </div>
  );
};
