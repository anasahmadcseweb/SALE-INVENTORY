import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { ConfirmationModal } from '../common/ConfirmationModal';
import {
  RotateCcw,
  Save,
  Download,
  Upload,
  Store,
  Percent,
  CheckCircle2,
  ShieldAlert,
  ShieldCheck,
  CreditCard,
  Smartphone,
  Banknote,
  Lock,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { state, dispatch } = useApp();
  const { currentUser, userProfile } = useAuth();

  const [storeName, setStoreName] = useState(state.settings.storeName);
  const [currency, setCurrency] = useState(state.settings.currency);
  const [taxRate, setTaxRate] = useState(state.settings.taxRate.toString());
  const [resetModalOpen, setResetModalOpen] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch({
      type: 'UPDATE_SETTINGS',
      settings: {
        storeName: storeName.trim() || 'STOCKFLOW Retail',
        currency: currency.trim() || '₹',
        taxRate: Math.max(0, parseFloat(taxRate) || 18),
      },
    });
  };

  const handleConfirmReset = () => {
    dispatch({ type: 'RESET_DATA' });
    setResetModalOpen(false);
  };

  const handleExportData = () => {
    const dataToExport = {
      products: state.products,
      sales: state.sales,
      activities: state.activities,
      settings: state.settings,
      exportedAt: new Date().toISOString(),
      app: 'STOCKFLOW',
    };

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stockflow-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed.products)) {
          localStorage.setItem('stockflow_state_v1', JSON.stringify(parsed));
          window.location.reload();
        } else {
          alert('Invalid backup file format');
        }
      } catch (err) {
        alert('Failed to parse backup JSON file');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Enterprise Platform Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Firebase Account Card */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Firebase Authentication</h4>
              <p className="text-[11px] text-slate-500">Multi-User Tenant Isolation</p>
            </div>
          </div>
          <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200/80">
            <div className="flex justify-between">
              <span className="text-slate-400">Authenticated Email:</span>
              <span className="font-semibold text-slate-800 truncate max-w-[180px]">
                {currentUser?.email || 'Authenticated'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Role:</span>
              <span className="font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded text-[10px]">
                Store Manager
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Tenant UID:</span>
              <span className="font-mono text-[10px] text-slate-500">
                {currentUser?.uid ? `${currentUser.uid.slice(0, 12)}...` : 'Active'}
              </span>
            </div>
          </div>
        </div>

        {/* POS Payment Methods Card */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Payment Modes</h4>
                <p className="text-[11px] text-slate-500">Retail checkout channels</p>
              </div>
            </div>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
              ACTIVE
            </span>
          </div>
          <div className="space-y-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200/80">
            <div className="flex justify-between items-center">
              <span className="text-slate-600 font-medium flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
                UPI (Instant QR / VPA)
              </span>
              <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px] border border-emerald-200">
                Enabled
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 font-medium flex items-center gap-1.5">
                <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                Cash (In-Store Counter)
              </span>
              <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px] border border-emerald-200">
                Enabled
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 font-medium flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-sky-600" />
                Card (POS Terminal)
              </span>
              <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px] border border-emerald-200">
                Enabled
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* General Store Configuration */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-sm font-bold text-slate-900">Store Profile &amp; Financials</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure retail branch name, currency symbol, and statutory GST tax percentages
          </p>
        </div>

        <form onSubmit={handleSaveSettings} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Store Name
              </label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Currency Symbol
              </label>
              <input
                type="text"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                GST Tax Rate (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
              />
              <p className="text-[11px] text-slate-400 mt-1">Applied automatically during POS checkout (Default: 18%)</p>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-xs"
            >
              <Save className="w-3.5 h-3.5" />
              Save Configuration
            </button>
          </div>
        </form>
      </div>

      {/* Data Backup & Migration */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-sm font-bold text-slate-900">Local Data Backup &amp; Portability</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Export the complete state including products, sales receipts, and audit activities
          </p>
        </div>

        <div className="p-6 flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={handleExportData}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Download className="w-4 h-4 text-indigo-600" />
            Export Store JSON Backup
          </button>

          <label className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
            <Upload className="w-4 h-4 text-indigo-600" />
            Import JSON Backup
            <input
              type="file"
              accept=".json"
              onChange={handleImportData}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Reset System State to Factory Seed */}
      <div className="bg-white rounded-xl border border-rose-200 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-rose-100 bg-rose-50/50">
          <h3 className="text-sm font-bold text-rose-950">System Reset</h3>
          <p className="text-xs text-rose-800 mt-0.5">
            Restore original seed data with 15 benchmark retail products &amp; sales history
          </p>
        </div>

        <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs text-slate-700 font-medium">
              Want to start fresh or replay the acceptance test benchmarks?
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              This will reset Wireless Mouse stock to 10, restore Keyboard to 3 units, and reload initial sales history.
            </p>
          </div>

          <button
            onClick={() => setResetModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-rose-600 rounded-lg hover:bg-rose-700 transition-colors shadow-xs shrink-0 self-start sm:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Demo Data
          </button>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      <ConfirmationModal
        isOpen={resetModalOpen}
        title="Reset Store to Benchmark Seed Data?"
        message="This action will clear all live changes and restore the 15 benchmark retail products, historical sales, and calculations. You can export a backup first if you want to keep current transactions."
        confirmLabel="Yes, Reset Store"
        cancelLabel="Keep Current Data"
        variant="danger"
        onConfirm={handleConfirmReset}
        onCancel={() => setResetModalOpen(false)}
      />
    </div>
  );
};
