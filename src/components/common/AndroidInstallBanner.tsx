import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  X,
  ArrowDownToLine,
} from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const AndroidInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);

  useEffect(() => {
    // Check if running in standalone PWA / Android APK container
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    setIsStandalone(isStandaloneMode);

    // Capture Android PWA install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      triggerHaptic('success');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const triggerDirectApkDownload = () => {
    triggerHaptic('medium');

    // Directly trigger physical file download to phone storage without opening modals
    const link = document.createElement('a');
    link.href = '/api/download-app';
    link.download = 'DadayaAttendance-v1.0.4.apk';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleInstallClick = async () => {
    triggerHaptic('medium');

    // 1. Immediately initiate physical download of the full app
    triggerDirectApkDownload();

    // 2. Prompt native Android install if supported
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          triggerHaptic('success');
          setIsInstalled(true);
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.warn('Install prompt note:', err);
      }
    }

    // Auto-dismiss banner cleanly
    setIsDismissed(true);
  };

  // If already installed and running standalone or dismissed, do not show persistent bar
  if (isStandalone || isDismissed || isInstalled) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white px-3 py-2.5 shadow-md flex items-center justify-between gap-3 text-xs border-b border-emerald-700/50">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-white/10 p-1 flex items-center justify-center shrink-0 border border-white/20">
          <Smartphone className="w-4 h-4 text-emerald-300" />
        </div>
        <div className="truncate">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-white text-[13px]">Download Dadaya Android App</span>
            <span className="bg-emerald-500/30 text-emerald-200 text-[10px] font-bold px-1.5 py-0.2 rounded border border-emerald-400/30 uppercase tracking-wider">
              APK
            </span>
          </div>
          <p className="text-[11px] text-emerald-100/80 truncate">
            Direct download to phone storage • 1-tap duty check-in & offline mode
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={handleInstallClick}
          className="px-3.5 py-1.5 bg-emerald-400 hover:bg-emerald-300 text-emerald-950 font-black rounded-lg text-xs shadow-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
        >
          <ArrowDownToLine className="w-3.5 h-3.5" />
          <span>Install App</span>
        </button>
        <button
          onClick={() => {
            triggerHaptic('light');
            setIsDismissed(true);
          }}
          className="p-1 text-emerald-200 hover:text-white rounded-md transition"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
