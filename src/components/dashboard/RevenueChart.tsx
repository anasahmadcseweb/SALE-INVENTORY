import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { formatCurrency } from '../../utils/inventoryCalculations';
import { TrendingUp, ShoppingBag } from 'lucide-react';

interface ChartPoint {
  date: string;
  revenue: number;
  orders: number;
  cumulativeRevenue: number;
}

export const RevenueChart: React.FC = () => {
  const { state } = useApp();

  const chartData = useMemo(() => {
    if (state.sales.length === 0) return [];

    // Group sales by day
    const dayMap: Record<string, { revenue: number; orders: number; rawDate: Date }> = {};

    // Sort ascending by timestamp
    const sortedSales = [...state.sales].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    sortedSales.forEach((sale) => {
      const d = new Date(sale.timestamp);
      const dayKey = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
      if (!dayMap[dayKey]) {
        dayMap[dayKey] = { revenue: 0, orders: 0, rawDate: d };
      }
      dayMap[dayKey].revenue += sale.total;
      dayMap[dayKey].orders += 1;
    });

    let runningCumulative = 0;
    const points: ChartPoint[] = Object.entries(dayMap).map(([date, val]) => {
      runningCumulative += val.revenue;
      return {
        date,
        revenue: val.revenue,
        orders: val.orders,
        cumulativeRevenue: runningCumulative,
      };
    });

    return points;
  }, [state.sales]);

  const totalPeriodRevenue = useMemo(() => {
    return state.sales.reduce((sum, s) => sum + s.total, 0);
  }, [state.sales]);

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Revenue Trend
            </h3>
            <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
              <TrendingUp className="w-3 h-3" />
              Live Sales Stream
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl font-extrabold text-slate-900 font-sans">
              {formatCurrency(totalPeriodRevenue)}
            </span>
            <span className="text-xs text-slate-500">
              across {state.sales.length} orders
            </span>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 font-medium">
          Updates instantly on every completed sale
        </div>
      </div>

      <div className="h-64 w-full">
        {chartData.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <ShoppingBag className="w-8 h-8 mb-2 stroke-1" />
            <p className="text-xs">No sales recorded yet</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(val) => `₹${val >= 1000 ? Math.round(val / 1000) + 'k' : val}`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as ChartPoint;
                    return (
                      <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl text-xs space-y-1">
                        <p className="font-semibold text-slate-200">{data.date}</p>
                        <p className="text-emerald-400 font-bold">
                          Daily: {formatCurrency(data.revenue)}
                        </p>
                        <p className="text-indigo-300">
                          Total To Date: {formatCurrency(data.cumulativeRevenue)}
                        </p>
                        <p className="text-slate-400 text-[10px]">
                          {data.orders} order(s) processed
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#4f46e5"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
