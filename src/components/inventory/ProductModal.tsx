import React, { useState, useEffect } from 'react';
import { Product } from '../../types';
import { X, Check, AlertCircle } from 'lucide-react';

interface ProductModalProps {
  isOpen: boolean;
  productToEdit: Product | null;
  onClose: () => void;
  onSave: (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

const CATEGORIES = ['Electronics', 'Accessories', 'Office', 'Networking', 'Storage', 'Other'];

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  productToEdit,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    category: 'Accessories',
    price: '',
    costPrice: '',
    stock: '',
    minStock: '5',
    avgDailySales: '2',
    leadTime: '5',
    safetyStock: '4',
    sku: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (productToEdit) {
      setFormData({
        name: productToEdit.name,
        category: productToEdit.category,
        price: productToEdit.price.toString(),
        costPrice: productToEdit.costPrice.toString(),
        stock: productToEdit.stock.toString(),
        minStock: productToEdit.minStock.toString(),
        avgDailySales: productToEdit.avgDailySales.toString(),
        leadTime: productToEdit.leadTime.toString(),
        safetyStock: productToEdit.safetyStock.toString(),
        sku: productToEdit.sku || '',
      });
    } else {
      setFormData({
        name: '',
        category: 'Accessories',
        price: '',
        costPrice: '',
        stock: '15',
        minStock: '5',
        avgDailySales: '2',
        leadTime: '5',
        safetyStock: '4',
        sku: '',
      });
    }
    setErrors({});
  }, [productToEdit, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const errs: Record<string, string> = {};

    if (!formData.name.trim()) {
      errs.name = 'Product name is required';
    }
    if (!formData.category.trim()) {
      errs.category = 'Category is required';
    }

    const priceNum = parseFloat(formData.price);
    if (isNaN(priceNum) || priceNum <= 0) {
      errs.price = 'Selling price must be greater than 0';
    }

    const costPriceNum = parseFloat(formData.costPrice);
    if (isNaN(costPriceNum) || costPriceNum < 0) {
      errs.costPrice = 'Cost price must be 0 or greater';
    }

    const stockNum = parseInt(formData.stock, 10);
    if (isNaN(stockNum) || stockNum < 0) {
      errs.stock = 'Current stock must be 0 or greater';
    }

    const minStockNum = parseInt(formData.minStock, 10);
    if (isNaN(minStockNum) || minStockNum < 0) {
      errs.minStock = 'Minimum stock must be 0 or greater';
    }

    const dailyNum = parseFloat(formData.avgDailySales);
    if (isNaN(dailyNum) || dailyNum < 0) {
      errs.avgDailySales = 'Average daily sales must be 0 or greater';
    }

    const leadNum = parseInt(formData.leadTime, 10);
    if (isNaN(leadNum) || leadNum < 0) {
      errs.leadTime = 'Lead time must be 0 or greater';
    }

    const safetyNum = parseInt(formData.safetyStock, 10);
    if (isNaN(safetyNum) || safetyNum < 0) {
      errs.safetyStock = 'Safety stock must be 0 or greater';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSave({
      name: formData.name.trim(),
      category: formData.category,
      price: Math.round(parseFloat(formData.price)),
      costPrice: Math.round(parseFloat(formData.costPrice || '0')),
      stock: parseInt(formData.stock, 10),
      minStock: parseInt(formData.minStock, 10),
      avgDailySales: parseFloat(formData.avgDailySales),
      leadTime: parseInt(formData.leadTime, 10),
      safetyStock: parseInt(formData.safetyStock, 10),
      sku:
        formData.sku.trim() ||
        `${formData.category.substring(0, 3).toUpperCase()}-${Math.floor(
          100 + Math.random() * 900
        )}`,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="relative w-full max-w-xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {productToEdit ? 'Edit Product Details' : 'Add New Inventory Product'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter retail pricing, current stock, and replenishment parameters
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Product Name */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Product Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Ergonomic Bluetooth Mouse"
                className={`w-full text-xs px-3 py-2 bg-white border rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-hidden ${
                  errors.name ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                }`}
              />
              {errors.name && <p className="text-[11px] text-rose-500 mt-1">{errors.name}</p>}
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* SKU */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                SKU / Barcode
              </label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="e.g. ACC-MOU-008"
                className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            {/* Selling Price */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Selling Price (₹) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="999"
                className={`w-full text-xs px-3 py-2 bg-white border rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-hidden ${
                  errors.price ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                }`}
              />
              {errors.price && <p className="text-[11px] text-rose-500 mt-1">{errors.price}</p>}
            </div>

            {/* Cost Price */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Cost Price (₹) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={formData.costPrice}
                onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                placeholder="550"
                className={`w-full text-xs px-3 py-2 bg-white border rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-hidden ${
                  errors.costPrice ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                }`}
              />
              {errors.costPrice && (
                <p className="text-[11px] text-rose-500 mt-1">{errors.costPrice}</p>
              )}
            </div>

            {/* Current Stock */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Current Stock (Units) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                placeholder="25"
                className={`w-full text-xs px-3 py-2 bg-white border rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-hidden ${
                  errors.stock ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                }`}
              />
              {errors.stock && <p className="text-[11px] text-rose-500 mt-1">{errors.stock}</p>}
            </div>

            {/* Minimum Stock Alert Level */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Minimum Stock Alert Level <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                value={formData.minStock}
                onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                placeholder="5"
                className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Section: Smart Replenishment Parameters */}
          <div className="pt-3 border-t border-slate-100">
            <h4 className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-2">
              Smart Replenishment Parameters
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Avg Daily Sales (Units) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.avgDailySales}
                  onChange={(e) => setFormData({ ...formData, avgDailySales: e.target.value })}
                  placeholder="2.5"
                  className={`w-full text-xs px-3 py-2 bg-white border rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-hidden ${
                    errors.avgDailySales ? 'border-rose-400' : 'border-slate-300'
                  }`}
                />
                {errors.avgDailySales && (
                  <p className="text-[10px] text-rose-500 mt-0.5">{errors.avgDailySales}</p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Lead Time (Days) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.leadTime}
                  onChange={(e) => setFormData({ ...formData, leadTime: e.target.value })}
                  placeholder="5"
                  className={`w-full text-xs px-3 py-2 bg-white border rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-hidden ${
                    errors.leadTime ? 'border-rose-400' : 'border-slate-300'
                  }`}
                />
                {errors.leadTime && (
                  <p className="text-[10px] text-rose-500 mt-0.5">{errors.leadTime}</p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Safety Stock (Buffer) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.safetyStock}
                  onChange={(e) => setFormData({ ...formData, safetyStock: e.target.value })}
                  placeholder="4"
                  className={`w-full text-xs px-3 py-2 bg-white border rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-hidden ${
                    errors.safetyStock ? 'border-rose-400' : 'border-slate-300'
                  }`}
                />
                {errors.safetyStock && (
                  <p className="text-[10px] text-rose-500 mt-0.5">{errors.safetyStock}</p>
                )}
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-xs"
            >
              <Check className="w-4 h-4" />
              {productToEdit ? 'Save Changes' : 'Add to Inventory'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
