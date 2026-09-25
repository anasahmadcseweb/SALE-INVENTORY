import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';
import { POSProductCard } from './POSProductCard';
import { formatCurrency } from '../../utils/inventoryCalculations';
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  Banknote,
  Smartphone,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  Receipt,
} from 'lucide-react';

export const POSView: React.FC = () => {
  const { state, dispatch } = useApp();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Cash' | 'Card'>('UPI');
  const [customerName, setCustomerName] = useState('');

  // Extract categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    state.products.forEach((p) => set.add(p.category));
    return ['ALL', ...Array.from(set)];
  }, [state.products]);

  // Filter products for catalog
  const catalogProducts = useMemo(() => {
    return state.products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()));

      const matchCat = selectedCategory === 'ALL' || p.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [state.products, search, selectedCategory]);

  // Calculate cart financials
  const cartFinancials = useMemo(() => {
    let subtotal = 0;
    state.cart.forEach((item) => {
      subtotal += item.product.price * item.quantity;
    });
    const tax = Math.round(subtotal * (state.settings.taxRate / 100));
    const total = subtotal + tax;
    const totalItems = state.cart.reduce((sum, item) => sum + item.quantity, 0);

    return { subtotal, tax, total, totalItems };
  }, [state.cart, state.settings.taxRate]);

  const handleAddToCart = (product: Product) => {
    dispatch({ type: 'ADD_TO_CART', product, quantity: 1 });
  };

  const handleUpdateQty = (productId: string, newQty: number) => {
    dispatch({ type: 'UPDATE_CART_QTY', productId, quantity: newQty });
  };

  const handleRemoveItem = (productId: string) => {
    dispatch({ type: 'REMOVE_FROM_CART', productId });
  };

  const handleCompleteSale = () => {
    if (state.cart.length === 0) return;
    dispatch({
      type: 'COMPLETE_SALE',
      paymentMethod,
      customerName: customerName.trim() || 'Walk-in Customer',
    });
    setCustomerName('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* LEFT: Product Catalog & Search (8 cols on lg) */}
      <div className="lg:col-span-7 xl:col-span-8 space-y-4">
        {/* Search & Category Filter Pills */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products by name, SKU, or category..."
                className="w-full text-xs pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-slate-900"
              />
            </div>

            {/* Quick 1-Click Acceptance Demo Button & Simulation trigger */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto shrink-0">
              <button
                onClick={() => dispatch({ type: 'RUN_LIVE_DEMO' })}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors shadow-2xs"
                title="Runs Acceptance Test 1: Sells 2x Wireless Mouse, updates stock from 10 to 8, increases revenue & orders"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                1-Click Demo (2x Mouse)
              </button>
              <button
                onClick={() => dispatch({ type: 'TOGGLE_DEMO_MODAL', open: true })}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
                title="Simulate sale for any catalog item"
              >
                Simulate Any SKU
              </button>
            </div>
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
          {catalogProducts.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-400 bg-white rounded-xl border border-slate-200/90">
              <ShoppingCart className="w-8 h-8 mx-auto mb-2 stroke-1" />
              <p className="font-semibold text-slate-700 text-xs">No products found</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Try clearing filters or search terms.
              </p>
            </div>
          ) : (
            catalogProducts.map((product) => {
              const inCart = state.cart.find((c) => c.product.id === product.id);
              return (
                <POSProductCard
                  key={product.id}
                  product={product}
                  cartQuantity={inCart ? inCart.quantity : 0}
                  onAddToCart={handleAddToCart}
                />
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT: Live POS Cart & Checkout Panel (4 or 5 cols on lg) */}
      <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-xl border border-slate-200/90 shadow-xs sticky top-20 flex flex-col overflow-hidden">
        {/* Cart Header */}
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Current Order Cart
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
              {cartFinancials.totalItems} items
            </span>
          </div>

          {state.cart.length > 0 && (
            <button
              onClick={() => dispatch({ type: 'CLEAR_CART' })}
              className="text-xs text-rose-600 hover:text-rose-800 font-medium transition-colors"
            >
              Clear Cart
            </button>
          )}
        </div>

        {/* Cart Items List */}
        <div className="p-4 overflow-y-auto max-h-[380px] divide-y divide-slate-100">
          {state.cart.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <ShoppingCart className="w-10 h-10 mx-auto text-slate-300 stroke-1 mb-2" />
              <p className="text-xs font-semibold text-slate-700">Your cart is empty</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Click &ldquo;Add&rdquo; on any product in the catalog to begin
              </p>
            </div>
          ) : (
            state.cart.map(({ product, quantity }) => {
              const liveProduct = state.products.find((p) => p.id === product.id) || product;
              const itemSubtotal = product.price * quantity;
              const isAtMaxStock = quantity >= liveProduct.stock;

              return (
                <div key={product.id} className="py-3 first:pt-0 last:pb-0 flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <h5 className="text-xs font-bold text-slate-900 truncate">
                      {product.name}
                    </h5>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {formatCurrency(product.price)} each •{' '}
                      <span className="text-slate-400">Stock: {liveProduct.stock}</span>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden shadow-2xs">
                        <button
                          onClick={() => handleUpdateQty(product.id, quantity - 1)}
                          disabled={quantity <= 1}
                          className="px-2 py-1 text-slate-600 hover:bg-slate-100 disabled:opacity-30 transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-3 text-xs font-bold text-slate-900 select-none">
                          {quantity}
                        </span>
                        <button
                          onClick={() => handleUpdateQty(product.id, quantity + 1)}
                          disabled={isAtMaxStock}
                          className="px-2 py-1 text-slate-600 hover:bg-slate-100 disabled:opacity-30 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => handleRemoveItem(product.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
                        title="Remove from cart"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-extrabold text-slate-900">
                      {formatCurrency(itemSubtotal)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Customer & Payment Selector (if cart has items) */}
        {state.cart.length > 0 && (
          <div className="p-4 bg-slate-50/70 border-t border-slate-200/90 space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Customer Name / Mobile (Optional)
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Walk-in Customer"
                className="w-full text-xs px-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">
                Payment Method
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['UPI', 'Cash', 'Card'] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`py-2 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      paymentMethod === method
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {method === 'UPI' && <Smartphone className="w-3.5 h-3.5" />}
                    {method === 'Cash' && <Banknote className="w-3.5 h-3.5" />}
                    {method === 'Card' && <CreditCard className="w-3.5 h-3.5" />}
                    {method}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Financial Totals & Checkout Button */}
        <div className="p-4 bg-white border-t border-slate-200 space-y-2.5">
          <div className="flex justify-between text-xs text-slate-500">
            <span>Subtotal</span>
            <span className="font-semibold text-slate-800">
              {formatCurrency(cartFinancials.subtotal)}
            </span>
          </div>

          <div className="flex justify-between text-xs text-slate-500">
            <span>GST ({state.settings.taxRate}%)</span>
            <span className="font-semibold text-slate-800">
              {formatCurrency(cartFinancials.tax)}
            </span>
          </div>

          <div className="pt-2 border-t border-slate-100 flex justify-between text-sm font-extrabold text-slate-900">
            <span>Grand Total</span>
            <span className="text-indigo-600 text-base font-sans">
              {formatCurrency(cartFinancials.total)}
            </span>
          </div>

          <button
            onClick={handleCompleteSale}
            disabled={state.cart.length === 0}
            className="w-full mt-3 py-3 px-4 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs flex items-center justify-center gap-2 active:scale-98"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Complete Sale &amp; Update Inventory</span>
          </button>

          <p className="text-[10px] text-center text-slate-400">
            Deducts live inventory, logs revenue, &amp; recalculates replenishment risk instantly
          </p>
        </div>
      </div>
    </div>
  );
};
