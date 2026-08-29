import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bell,
  BellRing,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  X,
  Sparkles,
  Sliders,
  Check,
  Send,
  Volume2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  getNotificationPermission,
  requestPhoneNotificationPermission,
  sendTestPhoneNotification,
  getNotificationPreferences,
  saveNotificationPreferences,
  NotificationPreferences,
  isNotificationSupported,
} from '../../utils/phoneNotifications';
import { triggerHaptic } from '../../utils/haptics';

export const PhoneNotificationBanner: React.FC = () => {
  const { currentUser, isSchoolDay } = useApp();
  const [permission, setPermission] = useState<string>(getNotificationPermission());
  const [isDismissed, setIsDismissed] = useState(false);
  const [isTestSending, setIsTestSending] = useState(false);
  const [testSentSuccess, setTestSentSuccess] = useState(false);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [prefs, setPrefs] = useState<NotificationPreferences>(getNotificationPreferences());

  useEffect(() => {
    setPermission(getNotificationPermission());
    setPrefs(getNotificationPreferences());
  }, []);

  const handleEnableNotifications = async () => {
    triggerHaptic('medium');
    const result = await requestPhoneNotificationPermission();
    setPermission(result.permission);
    if (result.granted) {
      setTestSentSuccess(true);
      setTimeout(() => setTestSentSuccess(false), 4000);
    }
  };

  const handleSendTest = async () => {
    setIsTestSending(true);
    triggerHaptic('light');
    const ok = await sendTestPhoneNotification();
    setIsTestSending(false);
    if (ok) {
      setTestSentSuccess(true);
      setTimeout(() => setTestSentSuccess(false), 4000);
    }
  };

  const handleTogglePref = (key: keyof NotificationPreferences) => {
    triggerHaptic('light');
    const updated = saveNotificationPreferences({ [key]: !prefs[key] });
    setPrefs(updated);
  };

  if (!isNotificationSupported() || isDismissed) {
    return null;
  }

  return (
    <>
      <AnimatePresence>
        {/* Banner shown if permission is not yet granted or as a compact quick bar */}
        {permission !== 'granted' ? (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 text-white rounded-2xl p-3.5 sm:p-4 shadow-lg border border-emerald-700/50 relative overflow-hidden"
          >
            {/* Ambient background glow */}
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-800/80 border border-emerald-600/40 flex items-center justify-center text-emerald-300 shrink-0 shadow-inner">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs sm:text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                      <span>Get Notifications Directly On Your Phone</span>
                      <span className="px-1.5 py-0.2 text-[9px] bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 rounded-full font-semibold uppercase">
                        Instant Alerts
                      </span>
                    </h4>
                  </div>
                  <p className="text-[11px] sm:text-xs text-emerald-100/90 mt-0.5 max-w-xl leading-relaxed">
                    Receive instant clock-in confirmations, duty shift reminders (07:15 AM), leave status updates, and Zimbabwe national holiday greetings in your phone's notification tray.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                {permission === 'denied' ? (
                  <div className="text-[10px] sm:text-xs bg-amber-500/20 border border-amber-400/40 text-amber-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Notifications blocked in browser. Tap site settings to allow.</span>
                  </div>
                ) : (
                  <button
                    onClick={handleEnableNotifications}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-400 hover:bg-emerald-300 text-emerald-950 font-bold text-xs rounded-xl shadow-md transition transform active:scale-95 cursor-pointer"
                  >
                    <BellRing className="w-3.5 h-3.5 animate-bounce" />
                    <span>Turn On Phone Alerts</span>
                  </button>
                )}

                <button
                  onClick={() => setIsDismissed(true)}
                  className="p-1.5 text-emerald-300/70 hover:text-white rounded-lg transition hover:bg-emerald-800/50"
                  title="Dismiss banner"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          /* Subtle notification status chip / quick test bar */
          <div className="mb-4 bg-white border border-emerald-200/80 rounded-xl px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 shadow-2xs">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-emerald-700" />
                Phone Notifications Active
              </span>
              <span className="hidden sm:inline text-[11px] text-slate-500">
                • Alerts delivered to lock screen & notification drawer
              </span>
            </div>

            <div className="flex items-center gap-2">
              {testSentSuccess && (
                <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1 animate-fade-in">
                  <CheckCircle2 className="w-3 h-3" />
                  Alert sent to your phone!
                </span>
              )}

              <button
                onClick={handleSendTest}
                disabled={isTestSending}
                className="text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/90 px-2.5 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer"
                title="Send a test notification to check device reception"
              >
                <Send className="w-3 h-3" />
                <span>{isTestSending ? 'Sending...' : 'Test Phone Alert'}</span>
              </button>

              <button
                onClick={() => setShowPreferencesModal(true)}
                className="text-[11px] font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer"
                title="Notification preferences"
              >
                <Sliders className="w-3 h-3" />
                <span>Settings</span>
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Notification Preferences Modal */}
      {showPreferencesModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <BellRing className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Phone Notification Settings</h3>
                  <p className="text-[10px] text-slate-500">Customize alerts delivered to your phone</p>
                </div>
              </div>
              <button
                onClick={() => setShowPreferencesModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              {/* Master toggle */}
              <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div>
                  <div className="font-bold text-emerald-950">Master Phone Alerts</div>
                  <div className="text-[10px] text-emerald-800">Enable or silence all notifications</div>
                </div>
                <button
                  onClick={() => handleTogglePref('enabled')}
                  className={`w-11 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                    prefs.enabled ? 'bg-emerald-600' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                      prefs.enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Morning reminder */}
              <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <div className="font-semibold text-slate-900">⏰ Morning Duty Reminder (07:15 AM)</div>
                  <div className="text-[10px] text-slate-500">Alerts if not clocked in before standard duty time</div>
                </div>
                <button
                  onClick={() => handleTogglePref('morningReminder')}
                  disabled={!prefs.enabled}
                  className={`w-10 h-5 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                    prefs.morningReminder && prefs.enabled ? 'bg-emerald-600' : 'bg-slate-300 opacity-60'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform ${
                      prefs.morningReminder && prefs.enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Late warning */}
              <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <div className="font-semibold text-slate-900">⚠️ Late Arrival Alert (07:35 AM)</div>
                  <div className="text-[10px] text-slate-500">Gentle notice when past standard clock-in boundary</div>
                </div>
                <button
                  onClick={() => handleTogglePref('lateWarning')}
                  disabled={!prefs.enabled}
                  className={`w-10 h-5 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                    prefs.lateWarning && prefs.enabled ? 'bg-emerald-600' : 'bg-slate-300 opacity-60'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform ${
                      prefs.lateWarning && prefs.enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Afternoon clock-out */}
              <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <div className="font-semibold text-slate-900">👋 End of Shift Reminder (16:30 PM)</div>
                  <div className="text-[10px] text-slate-500">Reminds you to clock out before leaving campus</div>
                </div>
                <button
                  onClick={() => handleTogglePref('afternoonReminder')}
                  disabled={!prefs.enabled}
                  className={`w-10 h-5 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                    prefs.afternoonReminder && prefs.enabled ? 'bg-emerald-600' : 'bg-slate-300 opacity-60'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform ${
                      prefs.afternoonReminder && prefs.enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Leave status updates */}
              <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <div className="font-semibold text-slate-900">📋 Leave & Absence Updates</div>
                  <div className="text-[10px] text-slate-500">Instant notice when admin approves or declines leave</div>
                </div>
                <button
                  onClick={() => handleTogglePref('leaveUpdates')}
                  disabled={!prefs.enabled}
                  className={`w-10 h-5 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                    prefs.leaveUpdates && prefs.enabled ? 'bg-emerald-600' : 'bg-slate-300 opacity-60'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform ${
                      prefs.leaveUpdates && prefs.enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Zimbabwe Holiday greetings */}
              <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <div className="font-semibold text-slate-900">🇿🇼 Zimbabwe National Holiday Greetings</div>
                  <div className="text-[10px] text-slate-500">Celebratory greetings on official gazetted public holidays</div>
                </div>
                <button
                  onClick={() => handleTogglePref('holidayGreetings')}
                  disabled={!prefs.enabled}
                  className={`w-10 h-5 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                    prefs.holidayGreetings && prefs.enabled ? 'bg-emerald-600' : 'bg-slate-300 opacity-60'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform ${
                      prefs.holidayGreetings && prefs.enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                onClick={handleSendTest}
                className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Test Phone Alert</span>
              </button>

              <button
                onClick={() => setShowPreferencesModal(false)}
                className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl shadow-xs transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};
