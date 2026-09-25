import React from 'react';
import { Sale } from '../../types';
import { formatCurrency, formatDateTime } from '../../utils/inventoryCalculations';
import { CheckCircle2, Printer, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface ReceiptModalProps {
  sale: Sale | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ sale, onClose }) => {
  const { state } = useApp();
  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="relative w-full max-w-sm bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Receipt Header Banner */}
        <div className="bg-indigo-600 px-5 py-4 text-white text-center relative">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-indigo-200 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/10 mb-2">
            <CheckCircle2 className="w-6 h-6 text-emerald-300" />
          </div>
          <h3 className="text-base font-bold tracking-tight">Payment Successful</h3>
          <p className="text-xs text-indigo-100 mt-0.5">Receipt #{sale.receiptNumber}</p>
        </div>

        {/* Receipt Content */}
        <div className="p-5 font-mono text-xs text-slate-700 space-y-4">
          <div className="text-center pb-3 border-b border-dashed border-slate-300">
            <h4 className="font-bold text-slate-900 font-sans text-sm tracking-wide">
              {state.settings.storeName.toUpperCase()}
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5 font-sans">
              Tax Invoice & Customer Receipt
            </p>
            <p className="text-[10px] text-slate-400 mt-1">{formatDateTime(sale.timestamp)}</p>
          </div>

          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-500">Customer:</span>
              <span className="font-medium text-slate-800">{sale.customerName || 'Walk-in'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Payment:</span>
              <span className="font-medium text-slate-800">{sale.paymentMethod}</span>
            </div>
          </div>

          {/* Line items table */}
          <div className="border-t border-b border-dashed border-slate-300 py-2.5">
            <div className="flex justify-between text-[11px] text-slate-500 font-semibold mb-1.5">
              <span>ITEM</span>
              <span>QTY × RATE</span>
              <span>AMT</span>
            </div>
            <div className="space-y-1.5">
              {sale.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-[11px] items-start">
                  <div className="flex-1 pr-2 truncate">
                    <div className="font-sans font-medium text-slate-800 truncate">{item.productName}</div>
                    <div className="text-[10px] text-slate-400">{item.category}</div>
                  </div>
                  <div className="text-slate-500 text-right shrink-0 px-2">
                    {item.quantity} × {formatCurrency(item.price)}
                  </div>
                  <div className="font-medium text-slate-800 text-right shrink-0">
                    {formatCurrency(item.subtotal)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-500">Subtotal</span>
              <span className="text-slate-800">{formatCurrency(sale.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">GST ({state.settings.taxRate}%)</span>
              <span className="text-slate-800">{formatCurrency(sale.tax)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200 font-sans">
              <span>Grand Total</span>
              <span className="text-indigo-600">{formatCurrency(sale.total)}</span>
            </div>
          </div>

          <div className="text-center pt-2 text-[10px] text-slate-400 border-t border-dashed border-slate-200 font-sans">
            Inventory stock has been automatically updated in STOCKFLOW. Thank you for your business!
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 p-3 bg-slate-50 border-t border-slate-100">
          <button
            onClick={handlePrint}
            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Receipt
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2 px-3 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
