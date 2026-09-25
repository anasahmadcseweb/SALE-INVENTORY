import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db, doc, setDoc } from '../lib/firebase';
import {
  Product,
  Sale,
  SaleItem,
  CartItem,
  Activity,
  StoreSettings,
  AppPage,
  ToastMessage,
} from '../types';
import {
  INITIAL_PRODUCTS,
  INITIAL_SALES,
  INITIAL_ACTIVITIES,
  INITIAL_SETTINGS,
} from '../data/seedData';
import { getStockStatus } from '../utils/inventoryCalculations';

interface AppState {
  products: Product[];
  sales: Sale[];
  activities: Activity[];
  cart: CartItem[];
  settings: StoreSettings;
  activePage: AppPage;
  selectedProductForDrawer: Product | null;
  selectedProductForSimulator: Product | null;
  notificationsOpen: boolean;
  copilotOpen: boolean;
  demoModalOpen: boolean;
  receiptModalSale: Sale | null;
  toasts: ToastMessage[];
}

type Action =
  | { type: 'SET_ACTIVE_PAGE'; page: AppPage }
  | { type: 'ADD_PRODUCT'; product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> }
  | { type: 'UPDATE_PRODUCT'; product: Product }
  | { type: 'DELETE_PRODUCT'; productId: string }
  | { type: 'UPDATE_STOCK'; productId: string; newStock: number; reason?: string }
  | { type: 'ADD_TO_CART'; product: Product; quantity?: number }
  | { type: 'UPDATE_CART_QTY'; productId: string; quantity: number }
  | { type: 'REMOVE_FROM_CART'; productId: string }
  | { type: 'CLEAR_CART' }
  | {
      type: 'COMPLETE_SALE';
      paymentMethod?: 'UPI' | 'Cash' | 'Card';
      customerName?: string;
    }
  | {
      type: 'SET_USER_DATA';
      payload: {
        products: Product[];
        sales: Sale[];
        activities: Activity[];
        settings: StoreSettings;
      };
    }
  | { type: 'RUN_LIVE_DEMO' }
  | { type: 'TOGGLE_DEMO_MODAL'; open?: boolean }
  | { type: 'EXECUTE_SIMULATED_SALE'; productId: string; quantity: number }
  | { type: 'APPLY_SIMULATED_REORDER'; productId: string; quantity: number }
  | { type: 'RESET_DATA' }
  | { type: 'UPDATE_SETTINGS'; settings: Partial<StoreSettings> }
  | { type: 'OPEN_PRODUCT_DRAWER'; product: Product | null }
  | { type: 'OPEN_SIMULATOR_FOR_PRODUCT'; product: Product }
  | { type: 'TOGGLE_NOTIFICATIONS'; open?: boolean }
  | { type: 'TOGGLE_COPILOT'; open?: boolean }
  | { type: 'SET_RECEIPT_MODAL'; sale: Sale | null }
  | { type: 'ADD_TOAST'; toast: Omit<ToastMessage, 'id'> }
  | { type: 'REMOVE_TOAST'; id: string };

const STORAGE_KEY = 'stockflow_state_v1';

function loadInitialState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.products) && parsed.products.length > 0) {
        return {
          products: parsed.products,
          sales: Array.isArray(parsed.sales) ? parsed.sales : INITIAL_SALES,
          activities: Array.isArray(parsed.activities) ? parsed.activities : INITIAL_ACTIVITIES,
          settings: parsed.settings || INITIAL_SETTINGS,
          cart: [],
          activePage: 'dashboard',
          selectedProductForDrawer: null,
          selectedProductForSimulator: null,
          notificationsOpen: false,
          copilotOpen: false,
          demoModalOpen: false,
          receiptModalSale: null,
          toasts: [],
        };
      }
    }
  } catch (err) {
    console.error('Failed to load state from localStorage:', err);
  }

  return {
    products: INITIAL_PRODUCTS,
    sales: INITIAL_SALES,
    activities: INITIAL_ACTIVITIES,
    settings: INITIAL_SETTINGS,
    cart: [],
    activePage: 'dashboard',
    selectedProductForDrawer: null,
    selectedProductForSimulator: null,
    notificationsOpen: false,
    copilotOpen: false,
    demoModalOpen: false,
    receiptModalSale: null,
    toasts: [],
  };
}

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_ACTIVE_PAGE': {
      return {
        ...state,
        activePage: action.page,
        selectedProductForDrawer: null,
      };
    }

    case 'OPEN_PRODUCT_DRAWER': {
      return {
        ...state,
        selectedProductForDrawer: action.product,
      };
    }

    case 'OPEN_SIMULATOR_FOR_PRODUCT': {
      return {
        ...state,
        selectedProductForSimulator: action.product,
        activePage: 'simulator',
        selectedProductForDrawer: null,
      };
    }

    case 'TOGGLE_NOTIFICATIONS': {
      return {
        ...state,
        notificationsOpen: action.open !== undefined ? action.open : !state.notificationsOpen,
        copilotOpen: false,
      };
    }

    case 'TOGGLE_COPILOT': {
      return {
        ...state,
        copilotOpen: action.open !== undefined ? action.open : !state.copilotOpen,
        notificationsOpen: false,
      };
    }

    case 'TOGGLE_DEMO_MODAL': {
      return {
        ...state,
        demoModalOpen: action.open !== undefined ? action.open : !state.demoModalOpen,
      };
    }

    case 'SET_RECEIPT_MODAL': {
      return {
        ...state,
        receiptModalSale: action.sale,
      };
    }

    case 'ADD_TOAST': {
      const newToast: ToastMessage = {
        id: 'toast-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        ...action.toast,
      };
      return {
        ...state,
        toasts: [...state.toasts, newToast],
      };
    }

    case 'REMOVE_TOAST': {
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.id),
      };
    }

    case 'ADD_PRODUCT': {
      const newId = 'prod-' + Date.now();
      const now = new Date().toISOString();
      const newProduct: Product = {
        ...action.product,
        id: newId,
        createdAt: now,
        updatedAt: now,
      };

      const newActivity: Activity = {
        id: 'act-' + Date.now(),
        timestamp: now,
        type: 'product_added',
        title: 'New Product Added',
        description: `Added "${newProduct.name}" to ${newProduct.category} (Stock: ${newProduct.stock})`,
        productId: newId,
      };

      const newToast: ToastMessage = {
        id: 'toast-' + Date.now(),
        type: 'success',
        title: 'Product Added Successfully',
        message: `"${newProduct.name}" is now live in inventory and POS.`,
      };

      return {
        ...state,
        products: [newProduct, ...state.products],
        activities: [newActivity, ...state.activities],
        toasts: [...state.toasts, newToast],
      };
    }

    case 'UPDATE_PRODUCT': {
      const now = new Date().toISOString();
      const updatedProduct: Product = {
        ...action.product,
        updatedAt: now,
      };

      const updatedProducts = state.products.map((p) =>
        p.id === updatedProduct.id ? updatedProduct : p
      );

      const newActivity: Activity = {
        id: 'act-' + Date.now(),
        timestamp: now,
        type: 'product_updated',
        title: 'Product Updated',
        description: `Updated details for "${updatedProduct.name}"`,
        productId: updatedProduct.id,
      };

      const newToast: ToastMessage = {
        id: 'toast-' + Date.now(),
        type: 'info',
        title: 'Product Updated',
        message: `Changes to "${updatedProduct.name}" saved.`,
      };

      // Also update drawer if currently open for this product
      const updatedDrawer =
        state.selectedProductForDrawer?.id === updatedProduct.id
          ? updatedProduct
          : state.selectedProductForDrawer;

      return {
        ...state,
        products: updatedProducts,
        activities: [newActivity, ...state.activities],
        selectedProductForDrawer: updatedDrawer,
        toasts: [...state.toasts, newToast],
      };
    }

    case 'DELETE_PRODUCT': {
      const target = state.products.find((p) => p.id === action.productId);
      if (!target) return state;

      const now = new Date().toISOString();
      const updatedProducts = state.products.filter((p) => p.id !== action.productId);
      const updatedCart = state.cart.filter((c) => c.product.id !== action.productId);

      const newActivity: Activity = {
        id: 'act-' + Date.now(),
        timestamp: now,
        type: 'product_deleted',
        title: 'Product Deleted',
        description: `Removed "${target.name}" from catalog`,
      };

      const newToast: ToastMessage = {
        id: 'toast-' + Date.now(),
        type: 'info',
        title: 'Product Removed',
        message: `"${target.name}" was deleted from inventory.`,
      };

      return {
        ...state,
        products: updatedProducts,
        cart: updatedCart,
        activities: [newActivity, ...state.activities],
        selectedProductForDrawer:
          state.selectedProductForDrawer?.id === action.productId
            ? null
            : state.selectedProductForDrawer,
        toasts: [...state.toasts, newToast],
      };
    }

    case 'UPDATE_STOCK': {
      const target = state.products.find((p) => p.id === action.productId);
      if (!target) return state;

      const safeStock = Math.max(0, action.newStock);
      const now = new Date().toISOString();
      const updatedProduct: Product = {
        ...target,
        stock: safeStock,
        updatedAt: now,
      };

      const updatedProducts = state.products.map((p) =>
        p.id === target.id ? updatedProduct : p
      );

      const newActivity: Activity = {
        id: 'act-' + Date.now(),
        timestamp: now,
        type: 'stock_restocked',
        title: 'Stock Updated',
        description: `Stock for "${target.name}" adjusted to ${safeStock} units (${action.reason || 'Manual Adjustment'})`,
        productId: target.id,
      };

      const newToast: ToastMessage = {
        id: 'toast-' + Date.now(),
        type: 'success',
        title: 'Stock Adjusted',
        message: `"${target.name}" stock updated to ${safeStock} units.`,
      };

      return {
        ...state,
        products: updatedProducts,
        activities: [newActivity, ...state.activities],
        selectedProductForDrawer:
          state.selectedProductForDrawer?.id === target.id
            ? updatedProduct
            : state.selectedProductForDrawer,
        toasts: [...state.toasts, newToast],
      };
    }

    case 'ADD_TO_CART': {
      const { product, quantity = 1 } = action;
      // Get the freshest product stock from state
      const currentProduct = state.products.find((p) => p.id === product.id) || product;

      if (currentProduct.stock <= 0) {
        return {
          ...state,
          toasts: [
            ...state.toasts,
            {
              id: 'toast-' + Date.now(),
              type: 'error',
              title: 'Out of Stock',
              message: `"${currentProduct.name}" has 0 units in stock.`,
            },
          ],
        };
      }

      const existingItem = state.cart.find((item) => item.product.id === currentProduct.id);
      const currentCartQty = existingItem ? existingItem.quantity : 0;
      const targetQty = currentCartQty + quantity;

      if (targetQty > currentProduct.stock) {
        return {
          ...state,
          toasts: [
            ...state.toasts,
            {
              id: 'toast-' + Date.now(),
              type: 'warning',
              title: 'Stock Limit Reached',
              message: `Cannot add more. Only ${currentProduct.stock} units available in stock.`,
            },
          ],
        };
      }

      let updatedCart: CartItem[];
      if (existingItem) {
        updatedCart = state.cart.map((item) =>
          item.product.id === currentProduct.id ? { ...item, quantity: targetQty } : item
        );
      } else {
        updatedCart = [...state.cart, { product: currentProduct, quantity }];
      }

      return {
        ...state,
        cart: updatedCart,
      };
    }

    case 'UPDATE_CART_QTY': {
      const { productId, quantity } = action;
      const product = state.products.find((p) => p.id === productId);
      if (!product) return state;

      // Disallow below 1
      if (quantity < 1) {
        return state;
      }

      // Disallow above available stock
      if (quantity > product.stock) {
        return {
          ...state,
          toasts: [
            ...state.toasts,
            {
              id: 'toast-' + Date.now(),
              type: 'warning',
              title: 'Insufficient Stock',
              message: `Maximum available stock for "${product.name}" is ${product.stock} units.`,
            },
          ],
        };
      }

      const updatedCart = state.cart.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      );

      return {
        ...state,
        cart: updatedCart,
      };
    }

    case 'REMOVE_FROM_CART': {
      return {
        ...state,
        cart: state.cart.filter((item) => item.product.id !== action.productId),
      };
    }

    case 'CLEAR_CART': {
      return {
        ...state,
        cart: [],
      };
    }

    case 'SET_USER_DATA': {
      return {
        ...state,
        products: action.payload.products,
        sales: action.payload.sales,
        activities: action.payload.activities,
        settings: action.payload.settings,
        cart: [],
        activePage: 'dashboard',
        selectedProductForDrawer: null,
        selectedProductForSimulator: null,
      };
    }

    case 'COMPLETE_SALE': {
      if (state.cart.length === 0) {
        return {
          ...state,
          toasts: [
            ...state.toasts,
            {
              id: 'toast-' + Date.now(),
              type: 'error',
              title: 'Empty Cart',
              message: 'Add products to cart before checkout.',
            },
          ],
        };
      }

      // Strict validation: check all products have sufficient stock
      for (const cartItem of state.cart) {
        const prod = state.products.find((p) => p.id === cartItem.product.id);
        if (!prod || prod.stock < cartItem.quantity) {
          return {
            ...state,
            toasts: [
              ...state.toasts,
              {
                id: 'toast-' + Date.now(),
                type: 'error',
                title: 'Insufficient stock available',
                message: `Cannot fulfill sale for "${cartItem.product.name}". Requested ${cartItem.quantity}, but only ${prod ? prod.stock : 0} available.`,
              },
            ],
          };
        }
      }

      const now = new Date().toISOString();
      const receiptNumber = `SF-${1000 + state.sales.length + 1}`;

      // Build sale items
      const saleItems: SaleItem[] = state.cart.map((c) => ({
        productId: c.product.id,
        productName: c.product.name,
        category: c.product.category,
        price: c.product.price,
        costPrice: c.product.costPrice,
        quantity: c.quantity,
        subtotal: c.product.price * c.quantity,
      }));

      const subtotal = saleItems.reduce((acc, item) => acc + item.subtotal, 0);
      const tax = Math.round(subtotal * (state.settings.taxRate / 100));
      const total = subtotal + tax;

      const newSale: Sale = {
        id: 'sale-' + Date.now(),
        receiptNumber,
        timestamp: now,
        items: saleItems,
        subtotal,
        tax,
        total,
        customerName: action.customerName || 'Walk-in Customer',
        paymentMethod: action.paymentMethod || 'UPI',
      };

      // Reduce stock for each product
      const newProducts = state.products.map((p) => {
        const cartMatch = state.cart.find((c) => c.product.id === p.id);
        if (cartMatch) {
          const updatedStock = Math.max(0, p.stock - cartMatch.quantity);
          return {
            ...p,
            stock: updatedStock,
            updatedAt: now,
          };
        }
        return p;
      });

      // Generate activity log
      const totalUnits = saleItems.reduce((acc, it) => acc + it.quantity, 0);
      const saleActivity: Activity = {
        id: 'act-' + Date.now(),
        timestamp: now,
        type: 'sale',
        title: `Sale #${receiptNumber} Completed`,
        description: `Sold ${totalUnits} units for ₹${total.toLocaleString('en-IN')} via ${newSale.paymentMethod}`,
        amount: total,
      };

      // Check for stock alerts triggered by this sale
      const alertActivities: Activity[] = [];
      for (const cartItem of state.cart) {
        const updatedProd = newProducts.find((p) => p.id === cartItem.product.id);
        if (updatedProd) {
          const status = getStockStatus(updatedProd.stock);
          if (status === 'out_of_stock') {
            alertActivities.push({
              id: 'act-alert-' + Date.now() + '-' + updatedProd.id,
              timestamp: now,
              type: 'alert_triggered',
              title: `Critical Alert: ${updatedProd.name} Out of Stock`,
              description: `Stock depleted to 0 units following Sale #${receiptNumber}. Reorder urgently!`,
              productId: updatedProd.id,
            });
          } else if (status === 'critical') {
            alertActivities.push({
              id: 'act-alert-' + Date.now() + '-' + updatedProd.id,
              timestamp: now,
              type: 'alert_triggered',
              title: `Warning: ${updatedProd.name} reached Critical level`,
              description: `Only ${updatedProd.stock} units remaining. Supplier lead time is ${updatedProd.leadTime} days.`,
              productId: updatedProd.id,
            });
          }
        }
      }

      const successToast: ToastMessage = {
        id: 'toast-' + Date.now(),
        type: 'success',
        title: 'Sale completed successfully.',
        message: `Order #${receiptNumber} processed (₹${total.toLocaleString('en-IN')}). Inventory & analytics updated.`,
      };

      return {
        ...state,
        products: newProducts,
        sales: [newSale, ...state.sales],
        activities: [...alertActivities, saleActivity, ...state.activities],
        cart: [],
        receiptModalSale: newSale,
        toasts: [...state.toasts, successToast],
      };
    }

    case 'RUN_LIVE_DEMO': {
      // Find "Wireless Mouse" as required by Acceptance Test 1 & Demo flow
      let targetProduct = state.products.find((p) => p.name.toLowerCase().includes('wireless mouse'));
      if (!targetProduct || targetProduct.stock < 2) {
        targetProduct = state.products.find((p) => p.stock >= 2);
      }

      if (!targetProduct) {
        return {
          ...state,
          toasts: [
            ...state.toasts,
            {
              id: 'toast-' + Date.now(),
              type: 'warning',
              title: 'No Stock Available',
              message: 'Add or restock a product first to run the live transaction demo.',
            },
          ],
        };
      }

      const quantityToSell = 2;
      const now = new Date().toISOString();
      const receiptNumber = `SF-${1000 + state.sales.length + 1}`;

      const saleItem: SaleItem = {
        productId: targetProduct.id,
        productName: targetProduct.name,
        category: targetProduct.category,
        price: targetProduct.price,
        costPrice: targetProduct.costPrice,
        quantity: quantityToSell,
        subtotal: targetProduct.price * quantityToSell,
      };

      const subtotal = saleItem.subtotal;
      const tax = Math.round(subtotal * (state.settings.taxRate / 100));
      const total = subtotal + tax;

      const newSale: Sale = {
        id: 'sale-' + Date.now(),
        receiptNumber,
        timestamp: now,
        items: [saleItem],
        subtotal,
        tax,
        total,
        customerName: 'Demo Customer (Live Flow)',
        paymentMethod: 'UPI',
      };

      const updatedProducts = state.products.map((p) =>
        p.id === targetProduct!.id
          ? { ...p, stock: Math.max(0, p.stock - quantityToSell), updatedAt: now }
          : p
      );

      const demoActivity: Activity = {
        id: 'act-' + Date.now(),
        timestamp: now,
        type: 'sale',
        title: `Live Demo Sale #${receiptNumber} Executed`,
        description: `Sold ${quantityToSell}x ${targetProduct.name} for ₹${total.toLocaleString('en-IN')}. Stock reduced from ${targetProduct.stock} to ${targetProduct.stock - quantityToSell}.`,
        amount: total,
      };

      const demoToast: ToastMessage = {
        id: 'toast-' + Date.now(),
        type: 'success',
        title: 'Live Demo Transaction Complete!',
        message: `${targetProduct.name} stock decreased to ${targetProduct.stock - quantityToSell}. Revenue & Analytics refreshed.`,
      };

      return {
        ...state,
        products: updatedProducts,
        sales: [newSale, ...state.sales],
        activities: [demoActivity, ...state.activities],
        receiptModalSale: newSale,
        toasts: [...state.toasts, demoToast],
      };
    }

    case 'EXECUTE_SIMULATED_SALE': {
      const { productId, quantity } = action;
      const targetProduct = state.products.find((p) => p.id === productId);

      if (!targetProduct || targetProduct.stock < quantity) {
        return {
          ...state,
          toasts: [
            ...state.toasts,
            {
              id: 'toast-' + Date.now(),
              type: 'error',
              title: 'Insufficient stock available',
              message: `Requested ${quantity} units, but only ${targetProduct ? targetProduct.stock : 0} available.`,
            },
          ],
        };
      }

      const now = new Date().toISOString();
      const receiptNumber = `SF-${1000 + state.sales.length + 1}`;

      const saleItem: SaleItem = {
        productId: targetProduct.id,
        productName: targetProduct.name,
        category: targetProduct.category,
        price: targetProduct.price,
        costPrice: targetProduct.costPrice,
        quantity,
        subtotal: targetProduct.price * quantity,
      };

      const subtotal = saleItem.subtotal;
      const tax = Math.round(subtotal * (state.settings.taxRate / 100));
      const total = subtotal + tax;

      const newSale: Sale = {
        id: 'sale-' + Date.now(),
        receiptNumber,
        timestamp: now,
        items: [saleItem],
        subtotal,
        tax,
        total,
        customerName: 'POS Simulation Transaction',
        paymentMethod: 'UPI',
      };

      const newStock = Math.max(0, targetProduct.stock - quantity);
      const updatedProducts = state.products.map((p) =>
        p.id === targetProduct.id ? { ...p, stock: newStock, updatedAt: now } : p
      );

      const demoActivity: Activity = {
        id: 'act-' + Date.now(),
        timestamp: now,
        type: 'sale',
        title: `Simulated POS Sale #${receiptNumber} Executed`,
        description: `Sold ${quantity}x ${targetProduct.name} for ₹${total.toLocaleString('en-IN')}. Stock decreased from ${targetProduct.stock} to ${newStock}.`,
        amount: total,
      };

      // Check if stock alert triggered
      const alertActivities: Activity[] = [];
      const updatedStatus = getStockStatus(newStock);
      if (updatedStatus === 'out_of_stock') {
        alertActivities.push({
          id: 'act-alert-' + Date.now(),
          timestamp: now,
          type: 'alert_triggered',
          title: `Critical Alert: ${targetProduct.name} Out of Stock`,
          description: `Stock depleted to 0 units following Sale #${receiptNumber}. Reorder urgently!`,
          productId: targetProduct.id,
        });
      } else if (updatedStatus === 'critical') {
        alertActivities.push({
          id: 'act-alert-' + Date.now(),
          timestamp: now,
          type: 'alert_triggered',
          title: `Warning: ${targetProduct.name} reached Critical level`,
          description: `Only ${newStock} units remaining. Supplier lead time is ${targetProduct.leadTime} days.`,
          productId: targetProduct.id,
        });
      }

      const toast: ToastMessage = {
        id: 'toast-' + Date.now(),
        type: 'success',
        title: 'POS Simulation Sale Executed!',
        message: `${targetProduct.name} stock decreased to ${newStock}. Revenue +₹${total.toLocaleString('en-IN')}, Orders +1, Coverage & Risk refreshed.`,
      };

      return {
        ...state,
        products: updatedProducts,
        sales: [newSale, ...state.sales],
        activities: [...alertActivities, demoActivity, ...state.activities],
        demoModalOpen: false,
        receiptModalSale: newSale,
        toasts: [...state.toasts, toast],
      };
    }

    case 'APPLY_SIMULATED_REORDER': {
      const { productId, quantity } = action;
      const target = state.products.find((p) => p.id === productId);
      if (!target || quantity <= 0) return state;

      const now = new Date().toISOString();
      const updatedStock = target.stock + quantity;
      const updatedProducts = state.products.map((p) =>
        p.id === productId ? { ...p, stock: updatedStock, updatedAt: now } : p
      );

      const activity: Activity = {
        id: 'act-' + Date.now(),
        timestamp: now,
        type: 'stock_restocked',
        title: 'Simulator Reorder Applied',
        description: `Restocked ${quantity} units of "${target.name}". Stock increased from ${target.stock} to ${updatedStock}.`,
        productId,
      };

      const toast: ToastMessage = {
        id: 'toast-' + Date.now(),
        type: 'success',
        title: 'Inventory Replenished!',
        message: `Applied +${quantity} units to "${target.name}". New stock is ${updatedStock}.`,
      };

      return {
        ...state,
        products: updatedProducts,
        activities: [activity, ...state.activities],
        selectedProductForSimulator: null,
        toasts: [...state.toasts, toast],
      };
    }

    case 'RESET_DATA': {
      localStorage.removeItem(STORAGE_KEY);
      return {
        ...state,
        products: INITIAL_PRODUCTS,
        sales: INITIAL_SALES,
        activities: INITIAL_ACTIVITIES,
        cart: [],
        settings: INITIAL_SETTINGS,
        selectedProductForDrawer: null,
        selectedProductForSimulator: null,
        receiptModalSale: null,
        toasts: [
          ...state.toasts,
          {
            id: 'toast-' + Date.now(),
            type: 'info',
            title: 'Data Reset',
            message: 'All products, sales, and analytics restored to original benchmark seed.',
          },
        ],
      };
    }

    case 'UPDATE_SETTINGS': {
      return {
        ...state,
        settings: {
          ...state.settings,
          ...action.settings,
        },
        toasts: [
          ...state.toasts,
          {
            id: 'toast-' + Date.now(),
            type: 'success',
            title: 'Settings Saved',
            message: 'Store configuration updated.',
          },
        ],
      };
    }

    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, userProfile } = useAuth();
  const [state, dispatch] = useReducer(appReducer, undefined, loadInitialState);

  // Multi-user data isolation: Load user-specific dataset whenever currentUser changes
  useEffect(() => {
    if (!currentUser) return;
    const userStorageKey = `stockflow_user_data_${currentUser.uid}`;
    try {
      const raw = localStorage.getItem(userStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.products) && parsed.products.length > 0) {
          dispatch({
            type: 'SET_USER_DATA',
            payload: {
              products: parsed.products,
              sales: Array.isArray(parsed.sales) ? parsed.sales : INITIAL_SALES,
              activities: Array.isArray(parsed.activities) ? parsed.activities : INITIAL_ACTIVITIES,
              settings: parsed.settings || {
                ...INITIAL_SETTINGS,
                storeName: userProfile?.storeName || INITIAL_SETTINGS.storeName,
              },
            },
          });
          return;
        }
      }

      // If user has no isolated data yet, seed fresh benchmark catalog for this user
      const userProducts = INITIAL_PRODUCTS.map((p) => ({
        ...p,
        userId: currentUser.uid,
      }));
      const userSales = INITIAL_SALES.map((s) => ({
        ...s,
        userId: currentUser.uid,
      }));
      const userActivities = INITIAL_ACTIVITIES.map((a) => ({
        ...a,
        userId: currentUser.uid,
      }));
      const userSettings = {
        ...INITIAL_SETTINGS,
        storeName: userProfile?.storeName || `${userProfile?.displayName || 'My'} Store`,
      };

      const initialData = {
        products: userProducts,
        sales: userSales,
        activities: userActivities,
        settings: userSettings,
      };

      localStorage.setItem(userStorageKey, JSON.stringify(initialData));
      dispatch({ type: 'SET_USER_DATA', payload: initialData });

      // Save user profile to Firestore
      try {
        setDoc(
          doc(db, 'users', currentUser.uid),
          {
            userId: currentUser.uid,
            email: currentUser.email,
            displayName: userProfile?.displayName || currentUser.email?.split('@')[0],
            role: 'Store Manager',
            storeName: userSettings.storeName,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (err) {
        console.warn('Firestore user profile sync:', err);
      }
    } catch (err) {
      console.error('Failed loading isolated user state:', err);
    }
  }, [currentUser?.uid]);

  // Synchronize state mutations to user's isolated storage
  useEffect(() => {
    if (!currentUser) return;
    const userStorageKey = `stockflow_user_data_${currentUser.uid}`;
    try {
      const serialized = JSON.stringify({
        products: state.products,
        sales: state.sales,
        activities: state.activities,
        settings: state.settings,
      });
      localStorage.setItem(userStorageKey, serialized);
    } catch (err) {
      console.error('Failed to sync to user localStorage:', err);
    }
  }, [currentUser?.uid, state.products, state.sales, state.activities, state.settings]);

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
};

export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
