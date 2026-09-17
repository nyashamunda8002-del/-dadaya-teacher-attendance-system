import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { triggerHaptic } from '../../utils/haptics';

export const PWAInstallButton: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already installed as PWA on home screen, hide
  if (isInstalled) {
    return null;
  }

  // Android / Desktop Chrome / Edge flow
  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={() => {
          triggerHaptic('medium');
          install();
        }}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-2xs transition cursor-pointer ${className}`}
        title="Install Dadaya Staff App to home screen for offline access"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Install App</span>
      </button>
    );
  }

  // iOS Safari flow (WebKit beforeinstallprompt is not supported)
  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            setShowIOSGuide(true);
          }}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100 transition cursor-pointer ${className}`}
        >
          <Smartphone className="w-3.5 h-3.5 text-emerald-700" />
          <span>Install on iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl border border-slate-200 text-slate-900 text-left">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-emerald-700" />
                  <span>Install on iPhone / iPad</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="mt-3 text-xs text-slate-600 leading-relaxed">
                To open Dadaya Staff Clocking offline on your iPhone:
              </p>
              <ol className="mt-2 text-xs text-slate-700 space-y-2 list-decimal list-inside bg-slate-50 p-3 rounded-xl border border-slate-100 font-medium">
                <li>
                  Tap the <strong className="text-blue-600">Share</strong> icon in Safari toolbar.
                </li>
                <li>
                  Scroll down and tap <strong className="text-slate-900">Add to Home Screen</strong>.
                </li>
                <li>
                  Launch from your Home Screen to open anytime offline!
                </li>
              </ol>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-4 w-full rounded-xl bg-emerald-700 hover:bg-emerald-800 py-2 text-xs font-bold text-white transition"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
