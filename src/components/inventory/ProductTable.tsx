import React, { useState, useMemo } from 'react';
import { Product, StockStatus } from '../../types';
import {
  getStockStatus,
  getStockCoverageDays,
  formatCoverageDays,
  getStockOutRisk,
  formatCurrency,
} from '../../utils/inventoryCalculations';
import { StatusBadge } from '../common/StatusBadge';
import { RiskBadge } from '../common/RiskBadge';
import {
  Search,
  Plus,
  Eye,
  Edit2,
  Trash2,
  ArrowUpDown,
  Boxes,
  SlidersHorizontal,
} from 'lucide-react';

interface ProductTableProps {
  products: Product[];
  onOpenAddModal: () => void;
  onOpenEditModal: (product: Product) => void;
  onOpenDrawer: (product: Product) => void;
  onConfirmDelete: (product: Product) => void;
}

export const ProductTable: React.FC<ProductTableProps> = ({
  products,
  onOpenAddModal,
  onOpenEditModal,
  onOpenDrawer,
  onConfirmDelete,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'stock' | 'coverage' | 'leadTime'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Extract distinct categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => set.add(p.category));
    return Array.from(set);
  }, [products]);

  // Filter & sort products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Search query
        const matchSearch =
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.category.toLowerCase().includes(search.toLowerCase()) ||
          (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()));

        // Category filter
        const matchCategory = selectedCategory === 'ALL' || p.category === selectedCategory;

        // Status filter
        const currentStatus = getStockStatus(p.stock);
        const matchStatus = selectedStatus === 'ALL' || currentStatus === selectedStatus;

        return matchSearch && matchCategory && matchStatus;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortBy === 'name') {
          diff = a.name.localeCompare(b.name);
        } else if (sortBy === 'price') {
          diff = a.price - b.price;
        } else if (sortBy === 'stock') {
          diff = a.stock - b.stock;
        } else if (sortBy === 'coverage') {
          const covA = getStockCoverageDays(a.stock, a.avgDailySales) ?? 9999;
          const covB = getStockCoverageDays(b.stock, b.avgDailySales) ?? 9999;
          diff = covA - covB;
        } else if (sortBy === 'leadTime') {
          diff = a.leadTime - b.leadTime;
        }
        return sortOrder === 'asc' ? diff : -diff;
      });
  }, [products, search, selectedCategory, selectedStatus, sortBy, sortOrder]);

  const toggleSort = (field: 'name' | 'price' | 'stock' | 'coverage' | 'leadTime') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
      {/* Search & Filter Header Bar */}
      <div className="p-4 border-b border-slate-200/90 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-slate-50/40">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by product name, category, or SKU..."
            className="w-full text-xs pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 shadow-2xs text-slate-900 placeholder:text-slate-400"
          />
        </div>

        {/* Filters and Add button */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs shadow-2xs">
            <span className="text-slate-400">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent font-semibold text-slate-700 focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs shadow-2xs">
            <span className="text-slate-400">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent font-semibold text-slate-700 focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="healthy">Healthy</option>
              <option value="low">Low Stock</option>
              <option value="critical">Critical</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
          </div>

          {/* Add Product Button */}
          <button
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-xs ml-auto lg:ml-0"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>
      </div>

      {/* Compact Financial Table */}
      <div className="overflow-x-auto max-h-[640px]">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 z-10">
            <tr className="text-slate-500 font-semibold tracking-wider uppercase text-[11px]">
              <th
                onClick={() => toggleSort('name')}
                className="py-3 px-4 cursor-pointer hover:text-slate-800"
              >
                <div className="flex items-center gap-1">
                  Product
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-3">Category</th>
              <th
                onClick={() => toggleSort('price')}
                className="py-3 px-3 cursor-pointer hover:text-slate-800 text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  Price
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => toggleSort('stock')}
                className="py-3 px-3 cursor-pointer hover:text-slate-800 text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  Stock
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-3 text-center">Status</th>
              <th className="py-3 px-3 text-right">Daily Sales</th>
              <th
                onClick={() => toggleSort('coverage')}
                className="py-3 px-3 cursor-pointer hover:text-slate-800 text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  Coverage Days
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => toggleSort('leadTime')}
                className="py-3 px-3 cursor-pointer hover:text-slate-800 text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  Lead Time
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-3 text-center">Stock-Out Risk</th>
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-16 text-center text-slate-400">
                  <Boxes className="w-8 h-8 mx-auto mb-2 stroke-1" />
                  <p className="font-semibold text-slate-700">No matching products found</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Adjust your search query or reset filter settings.
                  </p>
                </td>
              </tr>
            ) : (
              filteredProducts.map((p) => {
                const status = getStockStatus(p.stock);
                const coverage = getStockCoverageDays(p.stock, p.avgDailySales);
                const risk = getStockOutRisk(coverage, p.leadTime, p.stock);

                return (
                  <tr
                    key={p.id}
                    className="hover:bg-indigo-50/30 transition-colors group cursor-pointer"
                    onClick={() => onOpenDrawer(p)}
                  >
                    {/* Product Name & SKU */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {p.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {p.sku || 'SKU-NONE'}
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-3">
                      <span className="inline-block text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        {p.category}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="py-3 px-3 text-right font-semibold text-slate-900">
                      {formatCurrency(p.price)}
                    </td>

                    {/* Stock with Emphasis */}
                    <td className="py-3 px-3 text-right">
                      <span
                        className={`font-black text-sm ${
                          p.stock === 0
                            ? 'text-rose-900'
                            : p.stock < 5
                            ? 'text-rose-600'
                            : p.stock <= 20
                            ? 'text-amber-600'
                            : 'text-slate-900'
                        }`}
                      >
                        {p.stock}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <StatusBadge status={status} size="sm" />
                    </td>

                    {/* Daily Sales */}
                    <td className="py-3 px-3 text-right text-slate-600">
                      {p.avgDailySales > 0 ? `${p.avgDailySales}/d` : '0/d'}
                    </td>

                    {/* Stock Coverage Days */}
                    <td className="py-3 px-3 text-right">
                      {coverage !== null ? (
                        <span
                          className={`font-semibold ${
                            coverage < p.leadTime
                              ? 'text-rose-600 font-bold'
                              : coverage < p.leadTime * 1.5
                              ? 'text-amber-600'
                              : 'text-slate-800'
                          }`}
                        >
                          {coverage} days
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">No sales data</span>
                      )}
                    </td>

                    {/* Lead Time */}
                    <td className="py-3 px-3 text-right text-slate-600">
                      {p.leadTime} days
                    </td>

                    {/* Stock-Out Risk Indicator */}
                    <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <RiskBadge level={risk.level} size="sm" />
                    </td>

                    {/* Actions */}
                    <td
                      className="py-3 px-4 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => onOpenDrawer(p)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                          title="View Details Drawer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onOpenEditModal(p)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                          title="Edit Product"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onConfirmDelete(p)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          title="Delete Product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      <div className="px-4 py-3 bg-slate-50 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
        <span>
          Showing <strong className="text-slate-700">{filteredProducts.length}</strong> of{' '}
          <strong className="text-slate-700">{products.length}</strong> products
        </span>
        <span className="text-slate-400">
          Click any row to open the operational insight drawer
        </span>
      </div>
    </div>
  );
};
