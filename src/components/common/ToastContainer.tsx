import React, { useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { ToastMessage } from '../../types';

export const ToastContainer: React.FC = () => {
  const { state, dispatch } = useApp();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2 max-w-sm w-full pointer-events-none">
      {state.toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onDismiss={() => dispatch({ type: 'REMOVE_TOAST', id: toast.id })}
        />
      ))}
    </div>
  );
};

interface ToastItemProps {
  toast: ToastMessage;
  onDismiss: () => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 4500);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />,
    error: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />,
    info: <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />,
  };

  const borders = {
    success: 'border-l-4 border-l-emerald-500 border-slate-200',
    error: 'border-l-4 border-l-rose-500 border-slate-200',
    warning: 'border-l-4 border-l-amber-500 border-slate-200',
    info: 'border-l-4 border-l-blue-500 border-slate-200',
  };

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 p-3.5 bg-white rounded-lg shadow-lg border ${borders[toast.type]} transition-all transform duration-200`}
    >
      {icons[toast.type]}
      <div className="flex-1 min-w-0 pr-1">
        <h4 className="text-xs font-semibold text-slate-900 leading-tight">{toast.title}</h4>
        {toast.message && (
          <p className="text-xs text-slate-600 mt-1 leading-normal break-words">{toast.message}</p>
        )}
      </div>
      <button
        onClick={onDismiss}
        className="text-slate-400 hover:text-slate-700 p-0.5 rounded transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
