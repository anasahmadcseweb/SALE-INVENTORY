import React from 'react';
import { Product } from '../../types';
import { getStockStatus, formatCurrency } from '../../utils/inventoryCalculations';
import { StatusBadge } from '../common/StatusBadge';
import { Plus, Check } from 'lucide-react';

interface POSProductCardProps {
  product: Product;
  cartQuantity: number;
  onAddToCart: (product: Product) => void;
}

export const POSProductCard: React.FC<POSProductCardProps> = ({
  product,
  cartQuantity,
  onAddToCart,
}) => {
  const status = getStockStatus(product.stock);
  const isOutOfStock = product.stock <= 0;
  const isMaxInCart = cartQuantity >= product.stock;

  return (
    <div
      className={`bg-white rounded-xl border p-4 flex flex-col justify-between transition-all duration-150 ${
        isOutOfStock
          ? 'opacity-60 border-slate-200 bg-slate-50/50'
          : 'border-slate-200/90 hover:border-indigo-300 hover:shadow-xs'
      }`}
    >
      <div>
        <div className="flex items-center justify-between gap-1 mb-1.5">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            {product.category}
          </span>
          <StatusBadge status={status} size="sm" />
        </div>

        <h4 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2">
          {product.name}
        </h4>
        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{product.sku || 'SKU'}</p>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
        <div>
          <span className="text-sm font-extrabold text-slate-900 font-sans">
            {formatCurrency(product.price)}
          </span>
          <div className="text-[10px] text-slate-500 font-medium">
            Available: <strong className="text-slate-800">{product.stock}</strong> units
          </div>
        </div>

        <button
          onClick={() => onAddToCart(product)}
          disabled={isOutOfStock || isMaxInCart}
          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-2xs ${
            isOutOfStock
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : isMaxInCart
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-not-allowed'
              : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'
          }`}
        >
          {isMaxInCart ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Max</span>
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
