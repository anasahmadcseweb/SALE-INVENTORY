/**
 * STOCKFLOW - Smart Inventory. Smarter Decisions.
 * Real, Fully Functional Retail Management, POS & Stock Risk Intelligence.
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthScreen } from './components/auth/AuthScreen';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { DashboardView } from './components/dashboard/DashboardView';
import { InventoryView } from './components/inventory/InventoryView';
import { POSView } from './components/pos/POSView';
import { SmartReorderView } from './components/reorder/SmartReorderView';
import { RiskSimulatorView } from './components/simulator/RiskSimulatorView';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { SettingsView } from './components/settings/SettingsView';
import { StockFlowCopilot } from './components/copilot/StockFlowCopilot';
import { ToastContainer } from './components/common/ToastContainer';
import { ReceiptModal } from './components/common/ReceiptModal';
import { DemoSaleModal } from './components/common/DemoSaleModal';
import { ShieldCheck, Zap } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { state, dispatch } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const renderActivePage = () => {
    switch (state.activePage) {
      case 'dashboard':
        return <DashboardView />;
      case 'inventory':
        return <InventoryView />;
      case 'pos':
        return <POSView />;
      case 'reorder':
        return <SmartReorderView />;
      case 'simulator':
        return <RiskSimulatorView />;
      case 'analytics':
        return <AnalyticsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-slate-800 flex flex-col font-sans">
      {/* Navigation Sidebar */}
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Workspace Frame */}
      <div className="flex-1 md:pl-64 flex flex-col min-w-0">
        {/* Sticky Topbar */}
        <Topbar onOpenMobile={() => setMobileMenuOpen(true)} />

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {renderActivePage()}

          {/* Professional Competition Polish Footer */}
          <footer className="pt-6 pb-2 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-600 font-mono">STOCKFLOW v2.4</span>
              <span>•</span>
              <span className="font-medium">Smart Inventory. Smarter Decisions.</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Built for smarter retail operations</span>
            </div>
          </footer>
        </main>
      </div>

      {/* StockFlow Copilot Assistant Drawer */}
      <StockFlowCopilot />

      {/* Live POS Sale Simulation Modal */}
      <DemoSaleModal />

      {/* Global Toast Alerts */}
      <ToastContainer />

      {/* Customer Sale Receipt Modal */}
      <ReceiptModal
        sale={state.receiptModalSale}
        onClose={() => dispatch({ type: 'SET_RECEIPT_MODAL', sale: null })}
      />
    </div>
  );
};

const AuthGate: React.FC = () => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] text-white flex flex-col items-center justify-center p-4 font-sans select-none">
        <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center mb-4 shadow-xl shadow-indigo-600/30 border border-indigo-400/30 animate-pulse">
          <Zap className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-xl font-bold font-mono tracking-tight text-white">STOCKFLOW</h2>
        <p className="text-xs text-slate-400 mt-1 font-medium">Smart Inventory. Smarter Decisions.</p>
        <div className="mt-6 flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-xs text-indigo-300">
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
          <span>Verifying Firebase Auth Session...</span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthScreen />;
  }

  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}
