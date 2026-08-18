import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  WifiOff,
  Wifi,
  CloudUpload,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Trash2,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { triggerHaptic } from '../../utils/haptics';

export const OfflineQueueBar: React.FC = () => {
  const {
    isOnline,
    offlineQueue,
    offlineQueueCount,
    isSyncingQueue,
    syncOfflineQueue,
    clearOfflineQueue,
    currentUser,
  } = useApp();

  const [isExpanded, setIsExpanded] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // If user is online AND queue is empty, do not show clutter
  if (isOnline && offlineQueueCount === 0) {
    return null;
  }

  const handleSyncClick = async () => {
    triggerHaptic('medium');
    const result = await syncOfflineQueue();
    setSyncFeedback(result.message);
    setTimeout(() => {
      setSyncFeedback(null);
    }, 4000);
  };

  return (
    <div className="w-full max-w-5xl mx-auto mb-4">
      <div
        className={`rounded-2xl border transition shadow-xs overflow-hidden ${
          !isOnline
            ? 'bg-amber-500/10 border-amber-300 text-amber-950'
            : 'bg-emerald-50 border-emerald-200 text-emerald-950'
        }`}
      >
        {/* Main Status Bar */}
        <div className="p-3 sm:p-3.5 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                !isOnline
                  ? 'bg-amber-100 border-amber-300 text-amber-800'
                  : 'bg-emerald-100 border-emerald-300 text-emerald-800'
              }`}
            >
              {!isOnline ? (
                <WifiOff className="w-4 h-4 text-amber-700 animate-pulse" />
              ) : (
                <Wifi className="w-4 h-4 text-emerald-700" />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black uppercase tracking-wide">
                  {!isOnline ? 'Offline Mode Active' : 'Online & Connected'}
                </span>
                {offlineQueueCount > 0 && (
                  <span className="px-2 py-0.2 rounded-full text-[10px] font-extrabold bg-amber-200 text-amber-900 border border-amber-300">
                    {offlineQueueCount} Check-in{offlineQueueCount === 1 ? '' : 's'} Queued
                  </span>
                )}
              </div>
              <p className="text-[11px] opacity-85 line-clamp-1">
                {!isOnline
                  ? 'Device is disconnected from internet. Check-ins are safely saved in local storage and will sync upon reconnect.'
                  : `${offlineQueueCount} queued offline attendance record${offlineQueueCount === 1 ? '' : 's'} ready for cloud sync.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {offlineQueueCount > 0 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold border border-black/10 bg-white/70 hover:bg-white transition flex items-center gap-1 cursor-pointer select-none"
              >
                <span>Queue Details</span>
                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            )}

            <button
              onClick={handleSyncClick}
              disabled={isSyncingQueue || !isOnline || offlineQueueCount === 0}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 select-none shadow-xs ${
                !isOnline || offlineQueueCount === 0
                  ? 'bg-black/5 text-black/40 border border-black/10 cursor-not-allowed'
                  : 'bg-emerald-800 hover:bg-emerald-900 text-white cursor-pointer'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingQueue ? 'animate-spin' : ''}`} />
              <span>{isSyncingQueue ? 'Syncing...' : 'Sync Now'}</span>
            </button>
          </div>
        </div>

        {/* Sync Feedback Toast */}
        {syncFeedback && (
          <div className="px-3.5 py-2 bg-white/90 border-t border-black/10 text-[11px] font-semibold text-emerald-900 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{syncFeedback}</span>
          </div>
        )}

        {/* Expandable Queued Items Drawer */}
        <AnimatePresence>
          {isExpanded && offlineQueueCount > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-black/10 bg-white/95 p-3.5 text-xs space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold uppercase text-[10px] text-gray-500 tracking-wider">
                  Pending Offline Queue Ledger ({offlineQueue.length})
                </span>
                {currentUser?.role === 'admin' && (
                  <button
                    onClick={clearOfflineQueue}
                    className="text-[10px] text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear Local Queue</span>
                  </button>
                )}
              </div>

              <div className="divide-y divide-gray-100 max-h-48 overflow-y-auto rounded-xl border border-gray-200 bg-white">
                {offlineQueue.map((item) => (
                  <div key={item.id} className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-50">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-[10px] ${
                          item.type === 'clock_in'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.type === 'clock_out'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {item.type === 'clock_in' ? 'IN' : item.type === 'clock_out' ? 'OUT' : 'LV'}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">
                          {item.teacherName} {item.teacherSurname}
                        </p>
                        <p className="text-[10px] text-gray-500 font-mono">
                          {item.dateStr} • {item.timeStr} • Subject: {item.subject || 'General'}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800">
                        {item.status === 'pending' ? 'Pending Sync' : item.status}
                      </span>
                      {item.error && (
                        <p className="text-[9px] text-rose-600 line-clamp-1">{item.error}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
