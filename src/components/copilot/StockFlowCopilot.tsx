import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { AppPage } from '../../types';
import {
  getStockStatus,
  getStockCoverageDays,
  formatCoverageDays,
  getStockOutRisk,
  getRequiredStock,
  getRecommendedReorder,
  formatCurrency,
} from '../../utils/inventoryCalculations';
import { Bot, Send, X, Sparkles, ArrowRight, Database } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  action?: {
    label: string;
    page: AppPage;
    productId?: string;
  };
}

export const StockFlowCopilot: React.FC = () => {
  const { state, dispatch } = useApp();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'assistant',
      text: `Hello! I am your StockFlow Copilot. I inspect your live catalog, completed transactions, stock coverage velocities, and supplier replenishment times to give you instant operational answers. Select a suggested question below or type your query.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const quickPrompts = [
    'Which products need reorder?',
    'Which products are at risk?',
    'What are my top selling products?',
    'Which category generated the most revenue?',
    'How many products are critically low?',
    'Show products with less than 5 days coverage.',
  ];

  // Real-time calculated store intelligence
  const storeMetrics = useMemo(() => {
    let totalReorderUnits = 0;
    let totalReorderCost = 0;
    const reorderNeeded: { name: string; qty: number; id: string }[] = [];
    const stockOutRiskList: { name: string; coverage: number; leadTime: number; id: string }[] = [];
    const criticalList: { name: string; stock: number; id: string }[] = [];
    const lowCoverageList: { name: string; coverage: number; stock: number; id: string }[] = [];

    state.products.forEach((p) => {
      const status = getStockStatus(p.stock);
      const cov = getStockCoverageDays(p.stock, p.avgDailySales);
      const risk = getStockOutRisk(cov, p.leadTime, p.stock);
      const req = getRequiredStock(p.avgDailySales, p.leadTime, p.safetyStock);
      const reorderQty = getRecommendedReorder(req, p.stock);

      if (reorderQty > 0) {
        totalReorderUnits += reorderQty;
        totalReorderCost += reorderQty * p.costPrice;
        reorderNeeded.push({ name: p.name, qty: reorderQty, id: p.id });
      }

      if (risk.isAtRisk) {
        stockOutRiskList.push({
          name: p.name,
          coverage: cov !== null ? cov : 0,
          leadTime: p.leadTime,
          id: p.id,
        });
      }

      if (status === 'critical' || status === 'out_of_stock') {
        criticalList.push({ name: p.name, stock: p.stock, id: p.id });
      }

      if (cov !== null && cov < 5) {
        lowCoverageList.push({ name: p.name, coverage: cov, stock: p.stock, id: p.id });
      }
    });

    // Sales and Category totals
    const salesVolumeMap: Record<string, { name: string; volume: number; revenue: number }> = {};
    const categoryTotals: Record<string, number> = {};
    let totalRevenue = 0;

    state.sales.forEach((sale) => {
      totalRevenue += sale.total;
      sale.items.forEach((item) => {
        if (!salesVolumeMap[item.productId]) {
          salesVolumeMap[item.productId] = { name: item.productName, volume: 0, revenue: 0 };
        }
        salesVolumeMap[item.productId].volume += item.quantity;
        salesVolumeMap[item.productId].revenue += item.subtotal;

        categoryTotals[item.category] = (categoryTotals[item.category] || 0) + item.subtotal;
      });
    });

    const topSelling = Object.values(salesVolumeMap).sort((a, b) => b.revenue - a.revenue);
    const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);

    return {
      totalProducts: state.products.length,
      totalSalesCount: state.sales.length,
      totalRevenue,
      totalReorderUnits,
      totalReorderCost,
      reorderNeeded,
      stockOutRiskList,
      criticalList,
      lowCoverageList,
      topSelling,
      sortedCategories,
    };
  }, [state.products, state.sales]);

  const handleSend = (queryText: string) => {
    const q = queryText.trim();
    if (!q) return;

    const userMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    setTimeout(() => {
      const lower = q.toLowerCase();
      let answer = '';
      let action: ChatMessage['action'] = undefined;

      // 1. Reorder questions
      if (lower.includes('reorder') && !lower.includes('how much') && !lower.includes('cost')) {
        if (storeMetrics.reorderNeeded.length === 0) {
          answer = `Good news! None of your ${storeMetrics.totalProducts} catalog products currently need reordering. All inventory levels are above required replenishment buffers.`;
        } else {
          const topList = storeMetrics.reorderNeeded
            .slice(0, 5)
            .map((r) => `• ${r.name}: ${r.qty} units recommended`)
            .join('\n');
          answer = `Currently, ${storeMetrics.reorderNeeded.length} product(s) require reordering to meet lead-time demand + safety buffer, totaling ${storeMetrics.totalReorderUnits} units (Estimated working capital: ${formatCurrency(storeMetrics.totalReorderCost)}):\n\n${topList}`;
          action = {
            label: 'Open Smart Reorder Workbench',
            page: 'reorder',
          };
        }
      }
      // 2. Risk / Stock-out questions
      else if (lower.includes('risk') || lower.includes('stock-out') || lower.includes('run out')) {
        if (storeMetrics.stockOutRiskList.length === 0) {
          answer = `Currently, all products have stock coverage exceeding supplier replenishment lead times. No immediate stock-out risks detected.`;
        } else {
          const listStr = storeMetrics.stockOutRiskList
            .slice(0, 4)
            .map((r) => `• ${r.name}: ${r.coverage}d coverage vs ${r.leadTime}d lead time`)
            .join('\n');
          answer = `Stock-Out Alert: ${storeMetrics.stockOutRiskList.length} product(s) are at risk of depleting before supplier replenishment arrives:\n\n${listStr}\n\nReordering immediately or expediting shipment is strongly advised.`;
          action = {
            label: 'Test Replenishment in Risk Simulator',
            page: 'simulator',
          };
        }
      }
      // 3. Top selling products
      else if (lower.includes('top') && (lower.includes('selling') || lower.includes('product'))) {
        if (storeMetrics.topSelling.length === 0) {
          answer = `No sales recorded yet. Once transactions occur in the POS, revenue and volume leaders will appear here automatically.`;
        } else {
          const topItems = storeMetrics.topSelling
            .slice(0, 4)
            .map((item, idx) => `${idx + 1}. ${item.name}: ${item.volume} units sold (${formatCurrency(item.revenue)})`)
            .join('\n');
          answer = `Based on actual completed sales, your top performing products are:\n\n${topItems}\n\nTotal store revenue to date is ${formatCurrency(storeMetrics.totalRevenue)} across ${storeMetrics.totalSalesCount} orders.`;
          action = {
            label: 'View Detailed Sales Analytics',
            page: 'analytics',
          };
        }
      }
      // 4. Category generated most revenue
      else if (lower.includes('category') && (lower.includes('revenue') || lower.includes('most') || lower.includes('highest'))) {
        if (storeMetrics.sortedCategories.length === 0 || storeMetrics.sortedCategories[0][1] === 0) {
          answer = `No category sales have been logged yet. Complete POS sales to view category revenue breakdown.`;
        } else {
          const topCat = storeMetrics.sortedCategories[0];
          const pct = storeMetrics.totalRevenue > 0
            ? Math.round((topCat[1] / storeMetrics.totalRevenue) * 100)
            : 0;
          const rankingStr = storeMetrics.sortedCategories
            .map(([cat, rev]) => `• ${cat}: ${formatCurrency(rev)}`)
            .join('\n');
          answer = `The **${topCat[0]}** category generated the highest revenue, contributing ${formatCurrency(topCat[1])} (${pct}% of total sales).\n\nCategory ranking:\n${rankingStr}`;
          action = {
            label: 'Open Category Analytics',
            page: 'analytics',
          };
        }
      }
      // 5. Critically low products
      else if (lower.includes('critical') || (lower.includes('how many') && lower.includes('low'))) {
        if (storeMetrics.criticalList.length === 0) {
          answer = `No products are currently in critical or out-of-stock condition. All SKUs have at least 5 units on hand.`;
        } else {
          const itemsStr = storeMetrics.criticalList
            .map((p) => `• ${p.name}: ${p.stock === 0 ? '0 units (OUT OF STOCK)' : `${p.stock} units (Critical)`}`)
            .join('\n');
          answer = `There are ${storeMetrics.criticalList.length} product(s) critically low or out of stock (< 5 units threshold):\n\n${itemsStr}`;
          action = {
            label: 'View Critical Products in Inventory',
            page: 'inventory',
          };
        }
      }
      // 6. Products with less than 5 days coverage
      else if (lower.includes('less than 5') || (lower.includes('coverage') && lower.includes('5'))) {
        if (storeMetrics.lowCoverageList.length === 0) {
          answer = `None of your products currently have less than 5 days of coverage. All items with sales velocity have adequate days of buffer remaining.`;
        } else {
          const listStr = storeMetrics.lowCoverageList
            .map((p) => `• ${p.name}: ${p.coverage} days coverage (${p.stock} units remaining)`)
            .join('\n');
          answer = `Found ${storeMetrics.lowCoverageList.length} product(s) with less than 5 days of stock coverage:\n\n${listStr}\n\nThese items will deplete quickly based on their current daily sales pace.`;
          action = {
            label: 'Review Reorder Priorities',
            page: 'reorder',
          };
        }
      }
      // 7. General inquiry / Fallback summary
      else {
        answer = `Here is your current store operational snapshot:\n• Catalog Size: ${storeMetrics.totalProducts} active products\n• Reorder Demand: ${storeMetrics.totalReorderUnits} units across ${storeMetrics.reorderNeeded.length} SKUs (${formatCurrency(storeMetrics.totalReorderCost)})\n• Replenishment Risks: ${storeMetrics.stockOutRiskList.length} products with coverage < lead time\n• Total Revenue: ${formatCurrency(storeMetrics.totalRevenue)} from ${storeMetrics.totalSalesCount} orders\n\nAsk me about reorders, lead times, critical products, or specific categories!`;
      }

      const botMsg: ChatMessage = {
        id: 'msg-' + Date.now(),
        sender: 'assistant',
        text: answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action,
      };

      setMessages((prev) => [...prev, botMsg]);
    }, 150);
  };

  const handleActionClick = (action: NonNullable<ChatMessage['action']>) => {
    dispatch({ type: 'SET_ACTIVE_PAGE', page: action.page });
    if (action.productId) {
      const prod = state.products.find((p) => p.id === action.productId);
      if (prod) {
        if (action.page === 'simulator') {
          dispatch({ type: 'OPEN_SIMULATOR_FOR_PRODUCT', product: prod });
        } else {
          dispatch({ type: 'OPEN_PRODUCT_DRAWER', product: prod });
        }
      }
    }
  };

  if (!state.copilotOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white shadow-2xl border-l border-slate-200 z-50 flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 bg-slate-900 text-white">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center">
            <Bot className="w-4 h-4 text-indigo-300" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-bold tracking-wide">StockFlow Copilot</h3>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <p className="text-[10px] text-slate-400">Local Business Intelligence Engine</p>
          </div>
        </div>
        <button
          onClick={() => dispatch({ type: 'TOGGLE_COPILOT', open: false })}
          className="text-slate-400 hover:text-white transition-colors p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Prompts Bar */}
      <div className="p-2.5 bg-slate-50 border-b border-slate-200 overflow-x-auto flex gap-1.5 scrollbar-none">
        {quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(prompt)}
            className="text-[11px] font-medium whitespace-nowrap bg-white text-slate-700 hover:text-indigo-600 hover:border-indigo-300 border border-slate-200 px-2.5 py-1 rounded-full shadow-2xs transition-colors"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Message History */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-xs shadow-2xs ${
                msg.sender === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-xs'
                  : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs'
              }`}
            >
              <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>
              {msg.action && (
                <button
                  onClick={() => handleActionClick(msg.action!)}
                  className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 border border-indigo-200 px-2 py-1 rounded transition-colors"
                >
                  {msg.action.label}
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.timestamp}</span>
          </div>
        ))}
      </div>

      {/* Input Box */}
      <div className="p-3 bg-white border-t border-slate-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about reorders, risk, coverage, categories..."
            className="flex-1 text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white text-slate-800"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="p-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-lg transition-colors shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
        <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 mt-1.5">
          <Database className="w-3 h-3" />
          <span>Grounded strictly in actual store state &amp; formulas</span>
        </div>
      </div>
    </div>
  );
};
