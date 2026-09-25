import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { formatCurrency, getStockStatus } from '../../utils/inventoryCalculations';
import { KpiCard } from '../dashboard/KpiCard';
import {
  IndianRupee,
  ShoppingBag,
  TrendingUp,
  Award,
  Layers,
  BarChart2,
  PieChart as PieIcon,
} from 'lucide-react';

const CATEGORY_COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
const HEALTH_COLORS = {
  healthy: '#10b981',
  low: '#f59e0b',
  critical: '#f43f5e',
  out_of_stock: '#881337',
};

export const AnalyticsView: React.FC = () => {
  const { state } = useApp();

  // Primary Metrics
  const metrics = useMemo(() => {
    const totalRevenue = state.sales.reduce((sum, s) => sum + s.total, 0);
    const totalOrders = state.sales.length;
    let unitsSold = 0;
    const productSalesMap: Record<string, { name: string; units: number; revenue: number }> = {};
    const categorySalesMap: Record<string, number> = {};

    state.sales.forEach((sale) => {
      sale.items.forEach((item) => {
        unitsSold += item.quantity;

        // Product stats
        if (!productSalesMap[item.productId]) {
          productSalesMap[item.productId] = { name: item.productName, units: 0, revenue: 0 };
        }
        productSalesMap[item.productId].units += item.quantity;
        productSalesMap[item.productId].revenue += item.subtotal;

        // Category stats
        categorySalesMap[item.category] = (categorySalesMap[item.category] || 0) + item.subtotal;
      });
    });

    const aov = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    // Determine top product
    const sortedProducts = Object.values(productSalesMap).sort((a, b) => b.revenue - a.revenue);
    const topProduct = sortedProducts[0] || { name: 'None', revenue: 0, units: 0 };

    // Determine top category
    const sortedCategories = Object.entries(categorySalesMap).sort((a, b) => b[1] - a[1]);
    const topCategory = sortedCategories[0]
      ? { name: sortedCategories[0][0], revenue: sortedCategories[0][1] }
      : { name: 'None', revenue: 0 };

    return {
      totalRevenue,
      totalOrders,
      unitsSold,
      aov,
      topProduct,
      topCategory,
      productSalesMap,
      categorySalesMap,
    };
  }, [state.sales]);

  // Chart 1: Daily Revenue Trend
  const revenueTrendData = useMemo(() => {
    const map: Record<string, { date: string; revenue: number; orders: number }> = {};
    const sorted = [...state.sales].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    sorted.forEach((sale) => {
      const d = new Date(sale.timestamp);
      const day = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
      if (!map[day]) {
        map[day] = { date: day, revenue: 0, orders: 0 };
      }
      map[day].revenue += sale.total;
      map[day].orders += 1;
    });

    return Object.values(map);
  }, [state.sales]);

  // Chart 2: Top Selling Products by Revenue
  const topProductsChartData = useMemo(() => {
    return Object.values(metrics.productSalesMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map((item) => ({
        name: item.name.length > 15 ? item.name.substring(0, 15) + '...' : item.name,
        revenue: item.revenue,
        units: item.units,
      }));
  }, [metrics.productSalesMap]);

  // Chart 3: Category Revenue Distribution
  const categoryPieData = useMemo(() => {
    return Object.entries(metrics.categorySalesMap).map(([name, value]) => ({
      name,
      value,
    }));
  }, [metrics.categorySalesMap]);

  // Chart 4: Inventory Health Distribution
  const inventoryHealthData = useMemo(() => {
    let healthy = 0;
    let low = 0;
    let critical = 0;
    let oos = 0;

    state.products.forEach((p) => {
      const s = getStockStatus(p.stock);
      if (s === 'out_of_stock') oos++;
      else if (s === 'critical') critical++;
      else if (s === 'low') low++;
      else healthy++;
    });

    return [
      { name: 'Healthy (>20)', count: healthy, color: HEALTH_COLORS.healthy },
      { name: 'Low (5-20)', count: low, color: HEALTH_COLORS.low },
      { name: 'Critical (1-4)', count: critical, color: HEALTH_COLORS.critical },
      { name: 'Out of Stock (0)', count: oos, color: HEALTH_COLORS.out_of_stock },
    ];
  }, [state.products]);

  return (
    <div className="space-y-6">
      {/* 6 Top Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Total Revenue
          </span>
          <p className="text-base sm:text-lg font-black text-slate-900 mt-1 font-sans">
            {formatCurrency(metrics.totalRevenue)}
          </p>
          <span className="text-[10px] text-emerald-600 font-semibold">Live POS Sales</span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Total Orders
          </span>
          <p className="text-base sm:text-lg font-black text-slate-900 mt-1">
            {metrics.totalOrders}
          </p>
          <span className="text-[10px] text-slate-400">Transactions</span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Units Sold
          </span>
          <p className="text-base sm:text-lg font-black text-slate-900 mt-1">
            {metrics.unitsSold}
          </p>
          <span className="text-[10px] text-slate-400">Items out the door</span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Avg Order Value
          </span>
          <p className="text-base sm:text-lg font-black text-slate-900 mt-1 font-sans">
            {formatCurrency(metrics.aov)}
          </p>
          <span className="text-[10px] text-slate-400">Per basket</span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs truncate">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Top Product
          </span>
          <p className="text-xs font-bold text-slate-900 mt-1 truncate" title={metrics.topProduct.name}>
            {metrics.topProduct.name}
          </p>
          <span className="text-[10px] text-indigo-600 font-medium">
            {formatCurrency(metrics.topProduct.revenue)}
          </span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs truncate">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Top Category
          </span>
          <p className="text-xs font-bold text-slate-900 mt-1 truncate">
            {metrics.topCategory.name}
          </p>
          <span className="text-[10px] text-indigo-600 font-medium">
            {formatCurrency(metrics.topCategory.revenue)}
          </span>
        </div>
      </div>

      {/* Grid of 4 Recharts Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Revenue Trend AreaChart */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Revenue Trajectory
              </h3>
              <p className="text-xs font-bold text-slate-900 mt-0.5">
                Completed sales value over time
              </p>
            </div>
            <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
              Area Graph
            </span>
          </div>

          <div className="h-64 w-full">
            {revenueTrendData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-lg border border-slate-100 p-4 text-center">
                <TrendingUp className="w-8 h-8 text-slate-300 stroke-1 mb-2" />
                <p className="text-xs font-semibold text-slate-700">No sales transactions logged</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Complete a sale in POS to populate revenue trends.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="analyticsRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val >= 1000 ? Math.round(val / 1000) + 'k' : val}`} />
                  <Tooltip
                    formatter={(value: any) => [formatCurrency(Number(value) || 0), 'Revenue']}
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={2.5} fill="url(#analyticsRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 2: Top Selling Products BarChart */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Top Products by Revenue
              </h3>
              <p className="text-xs font-bold text-slate-900 mt-0.5">
                Highest grossing catalog items
              </p>
            </div>
            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
              Leaderboard
            </span>
          </div>

          <div className="h-64 w-full">
            {topProductsChartData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-lg border border-slate-100 p-4 text-center">
                <Award className="w-8 h-8 text-slate-300 stroke-1 mb-2" />
                <p className="text-xs font-semibold text-slate-700">No product sales yet</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Product revenue rankings will display after sales occur.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProductsChartData} layout="vertical" margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(val) => `₹${val >= 1000 ? Math.round(val / 1000) + 'k' : val}`} />
                  <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 11, fill: '#334155' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(value: any) => [formatCurrency(Number(value) || 0), 'Revenue']}
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  />
                  <Bar dataKey="revenue" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 3: Category Revenue Breakdown */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Category Contribution
              </h3>
              <p className="text-xs font-bold text-slate-900 mt-0.5">
                Revenue share across departments
              </p>
            </div>
            <span className="text-[11px] font-semibold text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded">
              Donut Chart
            </span>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {categoryPieData.length === 0 ? (
              <p className="text-xs text-slate-400">No category sales recorded yet</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryPieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [formatCurrency(Number(value) || 0), 'Revenue']}
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(val) => <span className="text-xs text-slate-700">{val}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 4: Inventory Health Counts */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Inventory Health Breakdown
              </h3>
              <p className="text-xs font-bold text-slate-900 mt-0.5">
                Current catalog distribution by status tier
              </p>
            </div>
            <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
              SKU Count
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={inventoryHealthData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  formatter={(value: any) => [`${value} SKUs`, 'Count']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {inventoryHealthData.map((entry, index) => (
                    <Cell key={`health-cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
