import { Product, StockStatus, ReorderPriority, ReorderAnalysis, StockOutRiskLevel, StockOutRiskAnalysis } from '../types';

/**
 * Calculates stock status strictly following specified business rules:
 * IF stock === 0: Out of Stock (Dark red)
 * ELSE IF stock < 5: Critical (Red)
 * ELSE IF stock <= 20: Low (Orange)
 * ELSE: Healthy (Green)
 * Out of Stock always has top priority.
 */
export function getStockStatus(stock: number): StockStatus {
  if (stock <= 0) {
    return 'out_of_stock';
  }
  if (stock < 5) {
    return 'critical';
  }
  if (stock <= 20) {
    return 'low';
  }
  return 'healthy';
}

/**
 * Calculates stock coverage in days:
 * Current Stock / Average Daily Sales
 * Handles avgDailySales <= 0 safely.
 * Never divides by zero. Never returns NaN or Infinity.
 */
export function getStockCoverageDays(stock: number, avgDailySales: number): number | null {
  if (typeof avgDailySales !== 'number' || isNaN(avgDailySales) || avgDailySales <= 0) {
    return null;
  }
  if (typeof stock !== 'number' || isNaN(stock) || stock < 0) {
    return 0;
  }
  const days = stock / avgDailySales;
  return Number(days.toFixed(1));
}

/**
 * Formats coverage days with safe fallback:
 * Shows "12.4 days coverage" or "No sales data"
 */
export function formatCoverageDays(coverageDays: number | null, short = false): string {
  if (coverageDays === null || isNaN(coverageDays)) {
    return 'No sales data';
  }
  return short ? `${coverageDays}d` : `${coverageDays} days coverage`;
}

/**
 * Calculates required stock to buffer supplier lead time:
 * Required Stock = Average Daily Sales * Lead Time + Safety Stock
 */
export function getRequiredStock(avgDailySales: number, leadTime: number, safetyStock: number): number {
  return Math.round((avgDailySales * leadTime) + safetyStock);
}

/**
 * Calculates recommended reorder quantity:
 * Recommended Reorder = MAX(0, Required Stock - Current Stock)
 */
export function getRecommendedReorder(requiredStock: number, currentStock: number): number {
  return Math.max(0, requiredStock - currentStock);
}

/**
 * Evaluates stock-out risk with clear, deterministic categories and explanations:
 * - OUT OF STOCK: Current stock = 0
 * - AT RISK: Coverage is below lead time (shortage before replenishment)
 * - WATCH: Coverage is approaching lead time (within 1.5x lead time)
 * - SAFE: Coverage comfortably exceeds lead time (>= 1.5x lead time)
 */
export function getStockOutRisk(
  coverageDays: number | null,
  leadTime: number,
  currentStock: number
): StockOutRiskAnalysis {
  if (currentStock <= 0) {
    return {
      level: 'OUT_OF_STOCK',
      explanation: 'Current stock is 0 units. Critical stock-out in effect. Reorder immediately.',
      isAtRisk: true,
    };
  }

  if (coverageDays === null) {
    return {
      level: 'SAFE',
      explanation: 'No daily sales velocity recorded. Stock is stable and meets safety threshold.',
      isAtRisk: false,
    };
  }

  if (coverageDays < leadTime) {
    return {
      level: 'AT_RISK',
      explanation: `Estimated stock coverage: ${coverageDays} days. Supplier lead time: ${leadTime} days. Potential shortage before replenishment.`,
      isAtRisk: true,
    };
  }

  if (coverageDays < leadTime * 1.5) {
    return {
      level: 'WATCH',
      explanation: `Estimated stock coverage: ${coverageDays} days. Supplier lead time: ${leadTime} days. Approaching supplier replenishment window.`,
      isAtRisk: false,
    };
  }

  return {
    level: 'SAFE',
    explanation: `Estimated stock coverage: ${coverageDays} days. Supplier lead time: ${leadTime} days. Stock coverage comfortably exceeds replenishment lead time.`,
    isAtRisk: false,
  };
}

/**
 * Evaluates whether a product is at risk of stocking out before replenishment (boolean)
 */
export function hasStockOutRisk(coverageDays: number | null, leadTime: number, currentStock: number): boolean {
  if (currentStock <= 0) return true;
  if (coverageDays === null) return false;
  return coverageDays < leadTime;
}

/**
 * Assigns reorder priority based on health status and reorder quantity:
 * Out of Stock -> URGENT
 * Critical -> HIGH
 * Low + reorder > 0 -> MEDIUM
 * Healthy + reorder > 0 -> LOW
 * Reorder = 0 -> NO ACTION
 */
export function getReorderPriority(status: StockStatus, recommendedReorder: number): ReorderPriority {
  if (recommendedReorder <= 0) {
    return 'NO_ACTION';
  }
  if (status === 'out_of_stock') {
    return 'URGENT';
  }
  if (status === 'critical') {
    return 'HIGH';
  }
  if (status === 'low') {
    return 'MEDIUM';
  }
  return 'LOW';
}

/**
 * Generates complete reorder analysis record for a product
 */
export function analyzeProductReorder(product: Product): ReorderAnalysis {
  const status = getStockStatus(product.stock);
  const coverageDays = getStockCoverageDays(product.stock, product.avgDailySales);
  const requiredStock = getRequiredStock(product.avgDailySales, product.leadTime, product.safetyStock);
  const recommendedReorder = getRecommendedReorder(requiredStock, product.stock);
  const stockOutRisk = hasStockOutRisk(coverageDays, product.leadTime, product.stock);
  const priority = getReorderPriority(status, recommendedReorder);
  const estimatedReorderCost = recommendedReorder * (product.costPrice || product.price * 0.6);

  return {
    productId: product.id,
    productName: product.name,
    category: product.category,
    currentStock: product.stock,
    avgDailySales: product.avgDailySales,
    leadTime: product.leadTime,
    safetyStock: product.safetyStock,
    coverageDays,
    requiredStock,
    recommendedReorder,
    hasStockOutRisk: stockOutRisk,
    priority,
    status,
    estimatedReorderCost,
  };
}

/**
 * Explainable Reorder Math breakdown
 */
export interface ReorderExplanation {
  avgDailySales: number;
  leadTime: number;
  demandDuringLeadTime: number;
  safetyStock: number;
  requiredStock: number;
  currentStock: number;
  reorderQuantity: number;
  formulaString: string;
}

export function getReorderExplanation(product: Product): ReorderExplanation {
  const demandDuringLeadTime = product.avgDailySales * product.leadTime;
  const requiredStock = demandDuringLeadTime + product.safetyStock;
  const reorderQuantity = Math.max(0, Math.round(requiredStock - product.stock));
  
  const formulaString = `${product.avgDailySales} × ${product.leadTime} + ${product.safetyStock} − ${product.stock} = ${reorderQuantity} units`;

  return {
    avgDailySales: product.avgDailySales,
    leadTime: product.leadTime,
    demandDuringLeadTime,
    safetyStock: product.safetyStock,
    requiredStock: Math.round(requiredStock),
    currentStock: product.stock,
    reorderQuantity,
    formulaString,
  };
}

/**
 * Format currency in Indian standard format: ₹1,25,000
 */
export function formatCurrency(amount: number): string {
  const rounded = Math.round(amount);
  return '₹' + new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(rounded);
}

/**
 * Format date nicely
 */
export function formatDateTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return isoString;
  }
}
