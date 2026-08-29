import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BellRing,
  Smartphone,
  CheckCircle2,
  X,
  Sparkles,
  Clock,
  Calendar,
  FileCheck,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  getNotificationPermission,
  requestPhoneNotificationPermission,
  isNotificationSupported,
} from '../../utils/phoneNotifications';
import { triggerHaptic } from '../../utils/haptics';

const PROMPT_DISMISSED_KEY = 'dadaya_notif_prompt_dismissed_time';

export const NotificationPermissionModal: React.FC = () => {
  const { currentUser } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [grantedSuccess, setGrantedSuccess] = useState(false);

  useEffect(() => {
    if (!isNotificationSupported()) return;

    const checkPermissionState = () => {
      const currentPerm = getNotificationPermission();

      // If permission is already granted, no need to show
      if (currentPerm === 'granted') {
        setIsOpen(false);
        return;
      }

      // If permission is 'default' (never asked or user hasn't decided)
      if (currentPerm === 'default') {
        const lastDismissed = localStorage.getItem(PROMPT_DISMISSED_KEY);
        // If dismissed recently (e.g. within 2 hours), don't harass unless they logged in now
        if (lastDismissed) {
          const dismissedTime = parseInt(lastDismissed, 10);
          const twoHours = 2 * 60 * 60 * 1000;
          if (Date.now() - dismissedTime < twoHours && !currentUser) {
            return;
          }
        }

        // Show prompt after a short 1-second delay so user sees dashboard context
        const timer = setTimeout(() => {
          setIsOpen(true);
        }, 1000);

        return () => clearTimeout(timer);
      }
    };

    checkPermissionState();
  }, [currentUser]);

  const handleAllowNotifications = async () => {
    setIsRequesting(true);
    triggerHaptic('medium');
    try {
      const result = await requestPhoneNotificationPermission();
      setIsRequesting(false);
      if (result.granted) {
        setGrantedSuccess(true);
        triggerHaptic('success');
        setTimeout(() => {
          setIsOpen(false);
        }, 2200);
      } else {
        // If user denied in native dialog, close modal
        setIsOpen(false);
      }
    } catch (e) {
      console.warn('Error requesting notification permission:', e);
      setIsRequesting(false);
      setIsOpen(false);
    }
  };

  const handleDismiss = () => {
    triggerHaptic('light');
    localStorage.setItem(PROMPT_DISMISSED_KEY, Date.now().toString());
    setIsOpen(false);
  };

  if (!isOpen || !isNotificationSupported()) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-emerald-100"
        >
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 p-6 text-white text-center relative overflow-hidden">
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-emerald-400/20 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-amber-400/15 rounded-full blur-2xl pointer-events-none" />

            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-emerald-800/90 border border-emerald-500/40 flex items-center justify-center text-emerald-300 shadow-inner relative z-10">
              <BellRing className="w-7 h-7 animate-bounce" />
            </div>

            <h3 className="text-lg font-extrabold text-white tracking-tight relative z-10">
              Enable Phone Notifications
            </h3>
            <p className="text-xs text-emerald-100/90 mt-1 max-w-xs mx-auto leading-relaxed relative z-10">
              Stay connected with instant attendance alerts, duty shift reminders, and official school notices directly on your phone.
            </p>
          </div>

          {/* Body Content */}
          <div className="p-5 sm:p-6 space-y-4">
            {grantedSuccess ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center"
              >
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                <h4 className="font-bold text-emerald-950 text-sm">Notifications Enabled!</h4>
                <p className="text-xs text-emerald-800 mt-1">
                  A welcome alert with vibration has been sent to your phone's notification shade.
                </p>
              </motion.div>
            ) : (
              <>
                <div className="space-y-2.5">
                  <div className="flex items-start gap-3 p-2.5 bg-slate-50 border border-slate-100 rounded-2xl">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">Morning Shift Reminders</div>
                      <p className="text-[11px] text-slate-600 leading-tight">
                        Receive a gentle prompt at 07:15 AM before standard school arrival cutoff.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-2.5 bg-slate-50 border border-slate-100 rounded-2xl">
                    <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center shrink-0 mt-0.5">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">Instant Clock-In Confirmations</div>
                      <p className="text-[11px] text-slate-600 leading-tight">
                        Get native lock-screen delivery whenever your attendance or departure is registered.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-2.5 bg-slate-50 border border-slate-100 rounded-2xl">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                      <FileCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">Leave & Absence Status</div>
                      <p className="text-[11px] text-slate-600 leading-tight">
                        Instant notification when Administration approves or updates your leave request.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-2.5 bg-slate-50 border border-slate-100 rounded-2xl">
                    <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center shrink-0 mt-0.5">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">Zimbabwe Public Holiday Alerts</div>
                      <p className="text-[11px] text-slate-600 leading-tight">
                        Official gazetted holiday reminders and greetings on national commemorative days.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 space-y-2">
                  <button
                    onClick={handleAllowNotifications}
                    disabled={isRequesting}
                    className="w-full py-3 px-4 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-sm rounded-2xl shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2 transition active:scale-[0.98] cursor-pointer"
                  >
                    <BellRing className="w-4 h-4" />
                    <span>{isRequesting ? 'Requesting Permission...' : 'Allow Phone Notifications'}</span>
                  </button>

                  <button
                    onClick={handleDismiss}
                    disabled={isRequesting}
                    className="w-full py-2.5 px-4 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                  >
                    Maybe Later
                  </button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
