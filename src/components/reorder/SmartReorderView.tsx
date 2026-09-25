import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Product, ReorderPriority } from '../../types';
import {
  getStockStatus,
  getStockCoverageDays,
  formatCoverageDays,
  getRequiredStock,
  getRecommendedReorder,
  getStockOutRisk,
  getReorderPriority,
  getReorderExplanation,
  formatCurrency,
} from '../../utils/inventoryCalculations';
import { PriorityBadge } from '../common/PriorityBadge';
import { RiskBadge } from '../common/RiskBadge';
import {
  RefreshCw,
  Search,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  PackagePlus,
  SlidersHorizontal,
  Calculator,
  Info,
} from 'lucide-react';

export const SmartReorderView: React.FC = () => {
  const { state, dispatch } = useApp();

  const [search, setSearch] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);
  const [restockModalProduct, setRestockModalProduct] = useState<Product | null>(null);
  const [restockQty, setRestockQty] = useState<number>(10);

  // Compute reorder rows
  const reorderList = useMemo(() => {
    return state.products.map((p) => {
      const status = getStockStatus(p.stock);
      const coverageDays = getStockCoverageDays(p.stock, p.avgDailySales);
      const requiredStock = getRequiredStock(p.avgDailySales, p.leadTime, p.safetyStock);
      const recommendedReorder = getRecommendedReorder(requiredStock, p.stock);
      const risk = getStockOutRisk(coverageDays, p.leadTime, p.stock);
      const priority = getReorderPriority(status, recommendedReorder);
      const explanation = getReorderExplanation(p);

      return {
        product: p,
        status,
        coverageDays,
        requiredStock,
        recommendedReorder,
        risk,
        priority,
        explanation,
      };
    });
  }, [state.products]);

  // Priority sorting weight
  const priorityWeight: Record<ReorderPriority, number> = {
    URGENT: 4,
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1,
    NO_ACTION: 0,
  };

  // Filter and sort reorder rows
  const filteredList = useMemo(() => {
    return reorderList
      .filter((item) => {
        const matchSearch =
          item.product.name.toLowerCase().includes(search.toLowerCase()) ||
          item.product.category.toLowerCase().includes(search.toLowerCase());

        const matchPriority =
          selectedPriority === 'ALL' || item.priority === selectedPriority;

        return matchSearch && matchPriority;
      })
      .sort((a, b) => {
        const weightDiff = priorityWeight[b.priority] - priorityWeight[a.priority];
        if (weightDiff !== 0) return weightDiff;
        return b.recommendedReorder - a.recommendedReorder;
      });
  }, [reorderList, search, selectedPriority]);

  // Overall Reorder Summary
  const summary = useMemo(() => {
    let totalUnits = 0;
    let totalEstimatedCost = 0;
    let urgentCount = 0;

    reorderList.forEach((item) => {
      if (item.recommendedReorder > 0) {
        totalUnits += item.recommendedReorder;
        totalEstimatedCost += item.recommendedReorder * item.product.costPrice;
      }
      if (item.priority === 'URGENT' || item.priority === 'HIGH') {
        urgentCount++;
      }
    });

    return { totalUnits, totalEstimatedCost, urgentCount };
  }, [reorderList]);

  const toggleExpand = (productId: string) => {
    setExpandedProductId((prev) => (prev === productId ? null : productId));
  };

  const handleOpenRestock = (product: Product, defaultQty: number) => {
    setRestockModalProduct(product);
    setRestockQty(defaultQty > 0 ? defaultQty : 10);
  };

  const handleApplyRestock = () => {
    if (!restockModalProduct || restockQty <= 0) return;
    dispatch({
      type: 'UPDATE_STOCK',
      productId: restockModalProduct.id,
      newStock: restockModalProduct.stock + restockQty,
      reason: 'Smart Reorder PO Fulfilled',
    });
    dispatch({
      type: 'ADD_TOAST',
      toast: {
        type: 'success',
        title: 'Stock Replenished',
        message: `Added ${restockQty} units of "${restockModalProduct.name}".`,
      },
    });
    setRestockModalProduct(null);
  };

  return (
    <div className="space-y-5">
      {/* Formula Explainer Banner */}
      <div className="bg-indigo-50/60 border border-indigo-200/80 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-indigo-600 text-white shrink-0 shadow-2xs mt-0.5">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
              Explainable Reorder Algorithm
            </h3>
            <p className="text-xs text-indigo-900 mt-0.5">
              <span className="font-semibold">Required Stock</span> = (Average Daily Sales × Lead Time) + Safety Stock &nbsp;|&nbsp;{' '}
              <span className="font-semibold">Reorder Quantity</span> = max(0, Required Stock − Current Stock)
            </p>
          </div>
        </div>

        <span className="text-[11px] font-semibold px-2.5 py-1 bg-white text-indigo-700 rounded-md border border-indigo-200 shrink-0">
          Deterministic Math • No Blackbox
        </span>
      </div>

      {/* Top Reorder Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Total Reorder Demand
          </span>
          <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1 font-sans">
            {summary.totalUnits}{' '}
            <span className="text-xs font-medium text-slate-500">units</span>
          </p>
          <p className="text-xs text-slate-500 mt-1">Across all catalog SKUs</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Estimated Working Capital
          </span>
          <p className="text-xl sm:text-2xl font-black text-indigo-600 mt-1 font-sans">
            {formatCurrency(summary.totalEstimatedCost)}
          </p>
          <p className="text-xs text-slate-500 mt-1">Calculated using supplier cost price</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Urgent / High Priority Items
          </span>
          <p className="text-xl sm:text-2xl font-black text-rose-600 mt-1 font-sans">
            {summary.urgentCount}{' '}
            <span className="text-xs font-medium text-slate-500">products</span>
          </p>
          <p className="text-xs text-slate-500 mt-1">Require immediate purchase order</p>
        </div>
      </div>

      {/* Main Smart Reorder Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {/* Search & Filter Header */}
        <div className="p-4 border-b border-slate-200/90 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/40">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products in reorder plan..."
              className="w-full text-xs pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs text-slate-500 font-semibold">Filter Priority:</span>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-hidden shadow-2xs"
            >
              <option value="ALL">All Priorities</option>
              <option value="URGENT">URGENT</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
              <option value="NO_ACTION">NO ACTION</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold tracking-wider uppercase text-[11px]">
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-3 text-right">Current Stock</th>
                <th className="py-3 px-3 text-right">Daily Sales</th>
                <th className="py-3 px-3 text-right">Coverage</th>
                <th className="py-3 px-3 text-right">Lead Time</th>
                <th className="py-3 px-3 text-right">Safety Stock</th>
                <th className="py-3 px-3 text-right">Required Stock</th>
                <th className="py-3 px-3 text-right">Recommended Reorder</th>
                <th className="py-3 px-3 text-center">Stock-Out Risk</th>
                <th className="py-3 px-3 text-center">Priority</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-16 text-center text-slate-400">
                    <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2 stroke-1" />
                    <p className="font-semibold text-slate-700">No reorder items match filter</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      All products in this category are operating above risk limits.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => {
                  const isExpanded = expandedProductId === item.product.id;

                  return (
                    <React.Fragment key={item.product.id}>
                      <tr className="hover:bg-indigo-50/20 transition-colors">
                        {/* Product */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{item.product.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {item.product.category}
                          </div>
                        </td>

                        {/* Current Stock */}
                        <td className="py-3 px-3 text-right font-black text-slate-900">
                          {item.product.stock}
                        </td>

                        {/* Daily Sales */}
                        <td className="py-3 px-3 text-right text-slate-600">
                          {item.product.avgDailySales > 0 ? `${item.product.avgDailySales} / d` : '0 / d'}
                        </td>

                        {/* Coverage */}
                        <td className="py-3 px-3 text-right">
                          {item.coverageDays !== null ? (
                            <span
                              className={`font-semibold ${
                                item.coverageDays < item.product.leadTime
                                  ? 'text-rose-600 font-bold'
                                  : 'text-slate-800'
                              }`}
                            >
                              {item.coverageDays}d
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[10px]">No sales</span>
                          )}
                        </td>

                        {/* Lead Time */}
                        <td className="py-3 px-3 text-right text-slate-600">
                          {item.product.leadTime}d
                        </td>

                        {/* Safety Stock */}
                        <td className="py-3 px-3 text-right text-slate-600">
                          {item.product.safetyStock}
                        </td>

                        {/* Required Stock */}
                        <td className="py-3 px-3 text-right font-bold text-slate-800">
                          {item.requiredStock}
                        </td>

                        {/* Recommended Reorder with Explainable Accordion Trigger */}
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => toggleExpand(item.product.id)}
                            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-indigo-50 transition-colors text-right ml-auto group"
                            title="Click to view full mathematical derivation"
                          >
                            <span
                              className={`font-black text-sm ${
                                item.recommendedReorder > 0
                                  ? 'text-indigo-600'
                                  : 'text-slate-400'
                              }`}
                            >
                              {item.recommendedReorder} units
                            </span>
                            <span className="p-0.5 text-slate-400 group-hover:text-indigo-600">
                              {isExpanded ? (
                                <ChevronUp className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5" />
                              )}
                            </span>
                          </button>
                        </td>

                        {/* Risk Indicator Badge */}
                        <td className="py-3 px-3 text-center">
                          <RiskBadge level={item.risk.level} size="sm" />
                        </td>

                        {/* Priority */}
                        <td className="py-3 px-3 text-center">
                          <PriorityBadge priority={item.priority} />
                        </td>

                        {/* Action: Quick Restock or Simulate */}
                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() =>
                                handleOpenRestock(
                                  item.product,
                                  item.recommendedReorder > 0 ? item.recommendedReorder : 10
                                )
                              }
                              className="px-2.5 py-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors shadow-2xs"
                              title="Receive stock / order"
                            >
                              Restock
                            </button>
                            <button
                              onClick={() =>
                                dispatch({
                                  type: 'OPEN_SIMULATOR_FOR_PRODUCT',
                                  product: item.product,
                                })
                              }
                              className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                              title="Simulate replenishment in Sandbox"
                            >
                              <SlidersHorizontal className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Explainable Reorder Math Expanded Sub-Row */}
                      {isExpanded && (
                        <tr className="bg-indigo-50/40 border-b border-indigo-100">
                          <td colSpan={11} className="p-4">
                            <div className="bg-white rounded-xl p-4 border border-indigo-200 shadow-2xs space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <HelpCircle className="w-4 h-4 text-indigo-600" />
                                  <h5 className="text-xs font-bold text-indigo-950 uppercase tracking-wide">
                                    Mathematical Derivation for &ldquo;{item.product.name}&rdquo;
                                  </h5>
                                </div>
                                <span className="text-[11px] font-semibold text-slate-500">
                                  Unit Cost: {formatCurrency(item.product.costPrice)} | Reorder Cost: {formatCurrency(item.recommendedReorder * item.product.costPrice)}
                                </span>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Step-by-Step Visible Math */}
                                <div className="text-xs text-slate-800 font-mono bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-1.5">
                                  <div className="text-slate-500 font-sans font-semibold text-[11px] uppercase tracking-wider">
                                    Step 1: Input Parameters
                                  </div>
                                  <div>• Average Daily Sales: <strong>{item.product.avgDailySales} units/day</strong></div>
                                  <div>• Supplier Lead Time: <strong>{item.product.leadTime} days</strong></div>
                                  <div>• Safety Stock Buffer: <strong>{item.product.safetyStock} units</strong></div>
                                  <div>• Current Stock On-Hand: <strong>{item.product.stock} units</strong></div>
                                </div>

                                <div className="text-xs text-slate-800 font-mono bg-indigo-50/60 p-3.5 rounded-lg border border-indigo-200 space-y-1.5">
                                  <div className="text-indigo-900 font-sans font-semibold text-[11px] uppercase tracking-wider">
                                    Step 2: Formula &amp; Recommended Reorder
                                  </div>
                                  <div>
                                    Required Stock = {item.product.avgDailySales} × {item.product.leadTime} + {item.product.safetyStock} ={' '}
                                    <strong className="text-slate-900">{item.explanation.requiredStock} units</strong>
                                  </div>
                                  <div>
                                    Recommended Reorder = max(0, {item.explanation.requiredStock} − {item.product.stock})
                                  </div>
                                  <div className="pt-1 text-sm font-extrabold text-indigo-700 font-sans">
                                    = {item.recommendedReorder} units recommended
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                                <Info className="w-4 h-4 text-indigo-600 shrink-0" />
                                <span>
                                  <strong>Stock-out Risk Assessment:</strong> {item.risk.explanation}
                                </span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Restock Modal Dialog */}
      {restockModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-2xs">
          <div className="relative w-full max-w-sm bg-white rounded-xl shadow-xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600">
                <PackagePlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Receive Inbound Restock
                </h3>
                <p className="text-xs text-slate-500">{restockModalProduct.name}</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Units Received from Supplier
              </label>
              <input
                type="number"
                min="1"
                value={restockQty}
                onChange={(e) => setRestockQty(parseInt(e.target.value, 10) || 0)}
                className="w-full text-sm font-bold px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Current: {restockModalProduct.stock} units → New Total:{' '}
                <strong className="text-emerald-600">
                  {restockModalProduct.stock + (restockQty || 0)} units
                </strong>
              </p>
              <div className="mt-2.5 p-2 bg-slate-50 border border-slate-200/80 rounded-lg text-xs text-slate-600 flex justify-between">
                <span>Total Supplier Cost:</span>
                <strong className="text-slate-900 font-mono">
                  {formatCurrency((restockQty || 0) * restockModalProduct.costPrice)}
                </strong>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRestockModalProduct(null)}
                className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyRestock}
                disabled={restockQty <= 0}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
              >
                <PackagePlus className="w-3.5 h-3.5" />
                <span>Confirm Inbound Restock</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
