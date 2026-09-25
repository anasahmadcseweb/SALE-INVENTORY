export type StockStatus = 'healthy' | 'low' | 'critical' | 'out_of_stock';

export type ReorderPriority = 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NO_ACTION';

export type StockOutRiskLevel = 'OUT_OF_STOCK' | 'AT_RISK' | 'WATCH' | 'SAFE';

export interface StockOutRiskAnalysis {
  level: StockOutRiskLevel;
  explanation: string;
  isAtRisk: boolean;
}

export interface Product {
  id: string;
  userId?: string;
  name: string;
  category: string;
  price: number;        // Selling price in ₹
  costPrice: number;    // Cost price in ₹
  stock: number;        // Current on-hand quantity
  minStock: number;     // Minimum stock threshold
  avgDailySales: number;// Average daily sales volume
  leadTime: number;     // Supplier replenishment lead time in days
  safetyStock: number;  // Buffer stock units
  sku?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  category: string;
  price: number;
  costPrice: number;
  quantity: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  userId?: string;
  receiptNumber: string;
  timestamp: string;
  items: SaleItem[];
  subtotal: number;
  tax: number;
  total: number;
  customerName?: string;
  paymentMethod: 'UPI' | 'Cash' | 'Card';
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Activity {
  id: string;
  userId?: string;
  timestamp: string;
  type: 'sale' | 'product_added' | 'product_updated' | 'product_deleted' | 'stock_restocked' | 'alert_triggered';
  title: string;
  description: string;
  productId?: string;
  amount?: number;
}

export interface StoreSettings {
  storeName: string;
  currency: string;
  taxRate: number; // e.g. 18 for 18%
  lowStockThreshold: number;
  criticalStockThreshold: number;
}

export interface ReorderAnalysis {
  productId: string;
  productName: string;
  category: string;
  currentStock: number;
  avgDailySales: number;
  leadTime: number;
  safetyStock: number;
  coverageDays: number | null;
  requiredStock: number;
  recommendedReorder: number;
  hasStockOutRisk: boolean;
  priority: ReorderPriority;
  status: StockStatus;
  estimatedReorderCost: number;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
}

export type AppPage = 'dashboard' | 'inventory' | 'pos' | 'reorder' | 'simulator' | 'analytics' | 'settings';
