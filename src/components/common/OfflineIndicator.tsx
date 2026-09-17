import React from 'react';
import { WifiOff, Download, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { triggerHaptic } from '../../utils/haptics';

export const OfflineIndicator: React.FC = () => {
  const { isOnline } = useApp();
  const { isInstallable, isInstalled, install } = usePWAInstall();

  if (isOnline) {
    return null;
  }

  return (
    <aside
      aria-label="Offline Mode Notice"
      className="fixed bottom-16 sm:bottom-4 left-3 right-3 sm:left-auto sm:right-4 z-50 flex items-center justify-between gap-3 bg-slate-900/95 text-white px-3.5 py-2.5 rounded-2xl shadow-xl border border-amber-500/40 backdrop-blur-md text-xs transition animate-fade-in"
    >
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
          <WifiOff className="w-3.5 h-3.5 animate-pulse" />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-amber-300 text-[11px] leading-tight flex items-center gap-1">
            Offline Mode Active
          </p>
          <p className="text-[10px] text-slate-300 truncate">
            App is running offline from local cache.
          </p>
        </div>
      </div>

      {isInstallable && !isInstalled && (
        <button
          type="button"
          onClick={() => {
            triggerHaptic('medium');
            install();
          }}
          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] rounded-xl transition shrink-0 flex items-center gap-1 cursor-pointer"
        >
          <Download className="w-3 h-3" />
          <span>Install</span>
        </button>
      )}
    </aside>
  );
};
