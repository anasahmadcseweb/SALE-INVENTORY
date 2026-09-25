import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  getStockCoverageDays,
  getStockOutRisk,
  hasStockOutRisk,
  getRequiredStock,
  formatCurrency,
} from '../../utils/inventoryCalculations';
import {
  Sparkles,
  AlertTriangle,
  RefreshCw,
  Clock,
  Flame,
  ArrowRight,
  TrendingDown,
  Package,
  CheckCircle2,
  XCircle,
  TrendingUp,
} from 'lucide-react';
import { Product } from '../../types';

interface DynamicInsight {
  id: string;
  category: string;
  badgeText: string;
  badgeType: 'danger' | 'warning' | 'indigo' | 'emerald';
  title: string;
  description: string;
  actionLabel: string;
  onClick: () => void;
}

export const BusinessCommandCenter: React.FC = () => {
  const { state, dispatch } = useApp();

  // 1. Calculate the 6 core metrics strictly following user specification
  const metrics = useMemo(() => {
    const products = state.products;

    // 1. Stock Coverage Days for each product (Current Stock / Average Daily Sales)
    const productsWithCoverage = products.map((p) => {
      const coverageDays = getStockCoverageDays(p.stock, p.avgDailySales);
      return {
        product: p,
        coverageDays,
      };
    });

    // Valid coverage values for catalog average
    const validCoverages = productsWithCoverage
      .map((item) => item.coverageDays)
      .filter((days): days is number => days !== null);

    const avgCoverageDays =
      validCoverages.length > 0
        ? Number((validCoverages.reduce((a, b) => a + b, 0) / validCoverages.length).toFixed(1))
        : null;

    // 2. Stock-out Risk: Compare stock coverage days against supplier lead time
    // Products that may run out before replenishment arrives (or already out of stock)
    const atRiskProducts: Product[] = [];
    products.forEach((p) => {
      const cov = getStockCoverageDays(p.stock, p.avgDailySales);
      if (hasStockOutRisk(cov, p.leadTime, p.stock)) {
        atRiskProducts.push(p);
      }
    });

    // 3. Low Stock Count: Products with stock <= 20
    const lowStockProducts = products.filter((p) => p.stock <= 20);

    // 4. Critical Stock Count: Products with stock < 5 and > 0
    const criticalStockProducts = products.filter((p) => p.stock < 5 && p.stock > 0);

    // 5. Out of Stock Count: Products with stock = 0
    const outOfStockProducts = products.filter((p) => p.stock === 0);

    // 6. Reorder Candidates: Products where Required Stock > Current Stock
    // Required Stock = Math.round((avgDailySales * leadTime) + safetyStock)
    const reorderCandidates: { product: Product; requiredStock: number; deficit: number }[] = [];
    products.forEach((p) => {
      const requiredStock = getRequiredStock(p.avgDailySales, p.leadTime, p.safetyStock);
      if (requiredStock > p.stock) {
        reorderCandidates.push({
          product: p,
          requiredStock,
          deficit: requiredStock - p.stock,
        });
      }
    });

    return {
      avgCoverageDays,
      productsWithCoverage,
      atRiskProducts,
      lowStockProducts,
      criticalStockProducts,
      outOfStockProducts,
      reorderCandidates,
    };
  }, [state.products]);

  // 2. Dynamically generate 3-5 business insights based on live inventory & sales state
  const insights = useMemo(() => {
    const list: DynamicInsight[] = [];
    const {
      atRiskProducts,
      reorderCandidates,
      criticalStockProducts,
      outOfStockProducts,
      lowStockProducts,
    } = metrics;

    // Insight A: Stock-out Risk before replenishment
    if (atRiskProducts.length > 0) {
      const firstRisk = atRiskProducts[0];
      const riskNames = atRiskProducts.map((p) => p.name).slice(0, 2).join(', ');
      const extraCount = atRiskProducts.length > 2 ? ` and ${atRiskProducts.length - 2} more` : '';
      list.push({
        id: 'insight-stockout-risk',
        category: 'Stock-out Risk',
        badgeText: `${atRiskProducts.length} at Risk`,
        badgeType: 'danger',
        title: `${atRiskProducts.length} product${atRiskProducts.length === 1 ? '' : 's'} may run out before replenishment.`,
        description: `${riskNames}${extraCount} have estimated coverage days lower than supplier lead time (${firstRisk.leadTime}d for ${firstRisk.name}).`,
        actionLabel: 'Simulate Replenishment Risk',
        onClick: () => dispatch({ type: 'OPEN_SIMULATOR_FOR_PRODUCT', product: firstRisk }),
      });
    } else {
      list.push({
        id: 'insight-stockout-risk-safe',
        category: 'Stock-out Risk',
        badgeText: 'Replenishment Safe',
        badgeType: 'emerald',
        title: '0 products at risk of stocking out before replenishment.',
        description: 'Current coverage days across all catalog SKUs comfortably satisfy supplier delivery lead times.',
        actionLabel: 'View Lead Times',
        onClick: () => dispatch({ type: 'SET_ACTIVE_PAGE', page: 'reorder' }),
      });
    }

    // Insight B: Reorder Candidates (Required Stock > Current Stock)
    if (reorderCandidates.length > 0) {
      const totalDeficitUnits = reorderCandidates.reduce((acc, curr) => acc + curr.deficit, 0);
      list.push({
        id: 'insight-reorder-candidates',
        category: 'Reorder Attention',
        badgeText: `${reorderCandidates.length} Candidates`,
        badgeType: 'warning',
        title: `${reorderCandidates.length} product${reorderCandidates.length === 1 ? '' : 's'} need reorder attention.`,
        description: `Required replenishment stock exceeds on-hand quantities by a total buffer deficit of ${totalDeficitUnits} units.`,
        actionLabel: 'Open Reorder Workbench',
        onClick: () => dispatch({ type: 'SET_ACTIVE_PAGE', page: 'reorder' }),
      });
    } else {
      list.push({
        id: 'insight-reorder-candidates-safe',
        category: 'Reorder Attention',
        badgeText: 'Optimal Buffer',
        badgeType: 'emerald',
        title: '0 products need reorder attention.',
        description: 'All on-hand quantities currently meet or exceed required stock levels (Daily Sales × Lead Time + Safety Stock).',
        actionLabel: 'Inspect Inventory',
        onClick: () => dispatch({ type: 'SET_ACTIVE_PAGE', page: 'inventory' }),
      });
    }

    // Insight C: Specific Product Coverage (e.g. Wireless Mouse or fastest moving product)
    const wirelessMouse = state.products.find((p) =>
      p.name.toLowerCase().includes('wireless mouse')
    );
    const focusProduct =
      wirelessMouse ||
      [...state.products].sort((a, b) => {
        const covA = getStockCoverageDays(a.stock, a.avgDailySales) ?? 999;
        const covB = getStockCoverageDays(b.stock, b.avgDailySales) ?? 999;
        return covA - covB;
      })[0];

    if (focusProduct) {
      const cov = getStockCoverageDays(focusProduct.stock, focusProduct.avgDailySales);
      const isUrgent = cov !== null && cov < focusProduct.leadTime;

      list.push({
        id: 'insight-product-coverage',
        category: 'Stock Coverage',
        badgeText: cov !== null ? `${cov}d Coverage` : 'No Sales Rate',
        badgeType: isUrgent ? 'danger' : 'indigo',
        title:
          cov !== null
            ? `${focusProduct.name} has ${cov} days of coverage.`
            : `${focusProduct.name} has stable stock with zero recorded sales drain.`,
        description:
          cov !== null
            ? `Current stock of ${focusProduct.stock} units divided by ${focusProduct.avgDailySales} average daily sales yields ${cov} days before run-out (lead time: ${focusProduct.leadTime}d).`
            : `Stock is held at ${focusProduct.stock} units with no registered daily burn.`,
        actionLabel: `Inspect ${focusProduct.name}`,
        onClick: () => dispatch({ type: 'OPEN_PRODUCT_DRAWER', product: focusProduct }),
      });
    }

    // Insight D: Critical & Out of Stock counts
    if (outOfStockProducts.length > 0 || criticalStockProducts.length > 0) {
      list.push({
        id: 'insight-critical-alert',
        category: 'Urgent Buffer',
        badgeText: `${outOfStockProducts.length} Out / ${criticalStockProducts.length} Critical`,
        badgeType: 'danger',
        title: `${outOfStockProducts.length} SKU${outOfStockProducts.length === 1 ? '' : 's'} out of stock and ${criticalStockProducts.length} critical item${criticalStockProducts.length === 1 ? '' : 's'} detected.`,
        description: `Out-of-stock items have 0 units and cannot fulfill POS transactions. Critical items hold under 5 units.`,
        actionLabel: 'Filter Critical Stock',
        onClick: () => dispatch({ type: 'SET_ACTIVE_PAGE', page: 'inventory' }),
      });
    } else if (lowStockProducts.length > 0) {
      list.push({
        id: 'insight-low-stock',
        category: 'Buffer Warning',
        badgeText: `${lowStockProducts.length} Low Stock`,
        badgeType: 'warning',
        title: `${lowStockProducts.length} product${lowStockProducts.length === 1 ? '' : 's'} are below the 20-unit threshold.`,
        description: `Monitor items with stock ≤ 20 to schedule replenishment orders before entering critical lead-time windows.`,
        actionLabel: 'Review Inventory',
        onClick: () => dispatch({ type: 'SET_ACTIVE_PAGE', page: 'inventory' }),
      });
    }

    // Insight E: Sales Velocity & Revenue Leader (Dynamic from actual state)
    if (state.sales.length > 0) {
      const productSalesMap: Record<string, { name: string; units: number; revenue: number }> = {};
      state.sales.forEach((sale) => {
        sale.items.forEach((item) => {
          if (!productSalesMap[item.productId]) {
            productSalesMap[item.productId] = { name: item.productName, units: 0, revenue: 0 };
          }
          productSalesMap[item.productId].units += item.quantity;
          productSalesMap[item.productId].revenue += item.subtotal;
        });
      });

      const topProduct = Object.values(productSalesMap).sort((a, b) => b.units - a.units)[0];
      if (topProduct && topProduct.units > 0) {
        list.push({
          id: 'insight-top-velocity',
          category: 'Sales Leader',
          badgeText: `${topProduct.units} Units Sold`,
          badgeType: 'indigo',
          title: `${topProduct.name} leads POS volume with ${topProduct.units} units sold.`,
          description: `Generated ${formatCurrency(topProduct.revenue)} in revenue across ${state.sales.length} completed transactions.`,
          actionLabel: 'Open POS Analytics',
          onClick: () => dispatch({ type: 'SET_ACTIVE_PAGE', page: 'analytics' }),
        });
      }
    }

    // Limit to 3-5 insights as requested
    return list.slice(0, 5);
  }, [metrics, state.products, state.sales, dispatch]);

  const badgeStyles = {
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
      {/* 1. Visually Prominent Command Center Header */}
      <div className="px-5 py-3.5 bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-indigo-500/20 border border-indigo-400/30 text-indigo-300">
            <Sparkles className="w-4 h-4 text-indigo-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold tracking-tight text-white">Business Command Center</h2>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                Live State Engine
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              Rule-based inventory coverage, stock-out risk, and automated replenishment calculations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium px-2.5 py-1 bg-white/10 rounded-full text-indigo-200 border border-white/10 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            6 Core Metrics Monitored
          </span>
        </div>
      </div>

      {/* 2. Compact 6 Core Calculated Metrics Strip */}
      <div className="p-4 sm:p-5 bg-slate-50/70 border-b border-slate-200/80">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Metric 1: Stock Coverage Days */}
          <div
            onClick={() => dispatch({ type: 'SET_ACTIVE_PAGE', page: 'inventory' })}
            className="p-3 bg-white rounded-lg border border-slate-200 hover:border-indigo-300 hover:shadow-2xs transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-semibold text-slate-600">Stock Coverage</span>
              <Clock className="w-3.5 h-3.5 text-indigo-500" />
            </div>
            <div className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
              {metrics.avgCoverageDays !== null ? `${metrics.avgCoverageDays}d` : 'N/A'}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Current Stock / Daily Sales</div>
          </div>

          {/* Metric 2: Stock-out Risk */}
          <div
            onClick={() => dispatch({ type: 'SET_ACTIVE_PAGE', page: 'simulator' })}
            className="p-3 bg-white rounded-lg border border-slate-200 hover:border-rose-300 hover:shadow-2xs transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-semibold text-slate-600">Stock-out Risk</span>
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            </div>
            <div className={`text-lg font-bold transition-colors ${
              metrics.atRiskProducts.length > 0
                ? 'text-rose-600 group-hover:text-rose-700'
                : 'text-slate-900 group-hover:text-emerald-600'
            }`}>
              {metrics.atRiskProducts.length}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Coverage &lt; Lead Time</div>
          </div>

          {/* Metric 3: Low Stock Count (<= 20) */}
          <div
            onClick={() => dispatch({ type: 'SET_ACTIVE_PAGE', page: 'inventory' })}
            className="p-3 bg-white rounded-lg border border-slate-200 hover:border-amber-300 hover:shadow-2xs transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-semibold text-slate-600">Low Stock (≤20)</span>
              <TrendingDown className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className={`text-lg font-bold transition-colors ${
              metrics.lowStockProducts.length > 0
                ? 'text-amber-600 group-hover:text-amber-700'
                : 'text-slate-900 group-hover:text-emerald-600'
            }`}>
              {metrics.lowStockProducts.length}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Products stock ≤ 20</div>
          </div>

          {/* Metric 4: Critical Stock Count (< 5 and > 0) */}
          <div
            onClick={() => dispatch({ type: 'SET_ACTIVE_PAGE', page: 'inventory' })}
            className="p-3 bg-white rounded-lg border border-slate-200 hover:border-rose-300 hover:shadow-2xs transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-semibold text-slate-600">Critical (&lt;5)</span>
              <Flame className="w-3.5 h-3.5 text-rose-500" />
            </div>
            <div className={`text-lg font-bold transition-colors ${
              metrics.criticalStockProducts.length > 0
                ? 'text-rose-600 group-hover:text-rose-700'
                : 'text-slate-900 group-hover:text-emerald-600'
            }`}>
              {metrics.criticalStockProducts.length}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Stock &lt; 5 and &gt; 0</div>
          </div>

          {/* Metric 5: Out of Stock Count (= 0) */}
          <div
            onClick={() => dispatch({ type: 'SET_ACTIVE_PAGE', page: 'inventory' })}
            className="p-3 bg-white rounded-lg border border-slate-200 hover:border-rose-300 hover:shadow-2xs transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-semibold text-slate-600">Out of Stock (=0)</span>
              <XCircle className="w-3.5 h-3.5 text-rose-600" />
            </div>
            <div className={`text-lg font-bold transition-colors ${
              metrics.outOfStockProducts.length > 0
                ? 'text-rose-700 group-hover:text-rose-800'
                : 'text-slate-900 group-hover:text-emerald-600'
            }`}>
              {metrics.outOfStockProducts.length}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Stock = 0 units</div>
          </div>

          {/* Metric 6: Reorder Candidates (Required > Current) */}
          <div
            onClick={() => dispatch({ type: 'SET_ACTIVE_PAGE', page: 'reorder' })}
            className="p-3 bg-white rounded-lg border border-slate-200 hover:border-indigo-300 hover:shadow-2xs transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-semibold text-slate-600">Reorder Candidates</span>
              <RefreshCw className="w-3.5 h-3.5 text-indigo-500" />
            </div>
            <div className={`text-lg font-bold transition-colors ${
              metrics.reorderCandidates.length > 0
                ? 'text-indigo-600 group-hover:text-indigo-700'
                : 'text-slate-900 group-hover:text-emerald-600'
            }`}>
              {metrics.reorderCandidates.length}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Required &gt; Current Stock</div>
          </div>
        </div>
      </div>

      {/* 3. Dynamically Generated Business Insights (3-5 Insights) */}
      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Live Decision Insights
            </span>
            <span className="text-[11px] text-slate-400 font-normal">
              ({insights.length} operational advisories generated from real-time state)
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {insights.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-xl border border-slate-200/90 bg-white hover:border-indigo-300 hover:shadow-xs transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {item.category}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                      badgeStyles[item.badgeType]
                    }`}
                  >
                    {item.badgeText}
                  </span>
                </div>

                <h4 className="text-xs font-bold text-slate-900 leading-snug group-hover:text-indigo-600 transition-colors">
                  {item.title}
                </h4>

                <p className="mt-1.5 text-[11px] text-slate-500 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <button
                onClick={item.onClick}
                className="mt-3.5 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors pt-2.5 border-t border-slate-100 cursor-pointer"
              >
                <span>{item.actionLabel}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
