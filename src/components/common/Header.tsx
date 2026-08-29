import React, { useState, useEffect } from 'react';
import {
  Bell,
  BellRing,
  LogOut,
  User as UserIcon,
  ShieldCheck,
  GraduationCap,
  Sparkles,
  Smartphone,
  Monitor,
  CheckCircle2,
  AlertCircle,
  Menu,
  X,
  Building2,
  Calendar,
  Send,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SchoolCrest } from './SchoolCrest';
import { triggerHaptic } from '../../utils/haptics';
import {
  getNotificationPermission,
  requestPhoneNotificationPermission,
  sendTestPhoneNotification,
  isNotificationSupported,
} from '../../utils/phoneNotifications';

export const Header: React.FC = () => {
  const {
    currentUser,
    logout,
    notifications,
    acknowledgeNotification,
    setActiveView,
    schoolSettings,
  } = useApp();

  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [phonePerm, setPhonePerm] = useState<string>(getNotificationPermission());
  const [isTestSending, setIsTestSending] = useState(false);
  const [testSentSuccess, setTestSentSuccess] = useState(false);

  useEffect(() => {
    setPhonePerm(getNotificationPermission());
  }, []);

  const unreadNotifs = notifications.filter((n) => !n.acknowledgedByAdmin);

  const handleToggleOrRequestNotification = async () => {
    triggerHaptic('light');
    if (phonePerm !== 'granted') {
      const res = await requestPhoneNotificationPermission();
      setPhonePerm(res.permission);
      if (res.granted) {
        setTestSentSuccess(true);
        setTimeout(() => setTestSentSuccess(false), 3500);
      }
    } else {
      setShowNotificationsDropdown(!showNotificationsDropdown);
    }
  };

  const handleSendTestAlert = async () => {
    setIsTestSending(true);
    triggerHaptic('medium');
    const ok = await sendTestPhoneNotification();
    setIsTestSending(false);
    if (ok) {
      setTestSentSuccess(true);
      setTimeout(() => setTestSentSuccess(false), 3500);
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-2xs">
      <div className="max-w-5xl mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Left: Dadaya High School Brand with Shield Crest */}
          <div
            onClick={() => setActiveView(currentUser?.role === 'admin' ? 'dashboard' : 'home')}
            className="flex items-center gap-2.5 cursor-pointer select-none group"
          >
            <SchoolCrest size="sm" />
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-gray-900 tracking-tight text-sm sm:text-base uppercase group-hover:text-emerald-900 transition">
                  Dadaya High School
                </span>
              </div>
              <span className="text-[10px] sm:text-[11px] font-semibold text-emerald-800 tracking-wide uppercase line-clamp-1">
                {currentUser?.role === 'admin' ? 'Admin Portal' : 'Faculty Attendance'}
              </span>
            </div>
          </div>

          {/* Center-Right: User Info Displayed on Desktop */}
          <div className="hidden lg:flex items-center gap-3 bg-slate-50 py-1.5 px-3.5 rounded-2xl border border-slate-200">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-700 to-teal-800 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
              {currentUser?.name?.[0]}
              {currentUser?.surname?.[0]}
            </div>
            <div className="text-left text-xs">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-gray-900">
                  {currentUser?.name} {currentUser?.surname}
                </span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[9px] font-extrabold uppercase ${
                    currentUser?.role === 'admin'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {currentUser?.role}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                {currentUser?.subject && (
                  <span className="font-medium text-emerald-800">
                    {currentUser.subject}
                  </span>
                )}
                <span>•</span>
                <span className="font-mono text-gray-500">ID: {currentUser?.employeeId || 'DHS-T001'}</span>
              </div>
            </div>
          </div>

          {/* Right Controls: Notification Bell, Phone Alerts Button, Role Badge, Logout */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* User role pill on mobile */}
            <span
              className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md lg:hidden ${
                currentUser?.role === 'admin'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {currentUser?.role}
            </span>

            {/* Direct Phone Notification Bell / Status Button */}
            <div className="relative">
              <button
                onClick={handleToggleOrRequestNotification}
                className={`p-2 rounded-xl transition relative cursor-pointer ${
                  phonePerm === 'granted'
                    ? 'text-emerald-800 hover:text-emerald-950 hover:bg-emerald-50'
                    : 'text-slate-600 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300'
                }`}
                title={phonePerm === 'granted' ? 'Phone notifications active - Click to test or view alerts' : 'Click to enable phone notifications'}
              >
                {phonePerm === 'granted' ? (
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-700" />
                ) : (
                  <BellRing className="w-4 h-4 sm:w-5 sm:h-5 text-amber-700 animate-bounce" />
                )}

                {currentUser?.role === 'admin' && unreadNotifs.length > 0 && (
                  <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-amber-500 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-pulse">
                    {unreadNotifs.length}
                  </span>
                )}
                {phonePerm === 'granted' && currentUser?.role !== 'admin' && (
                  <span className="absolute bottom-1 right-1 w-2 h-2 bg-emerald-500 rounded-full" />
                )}
              </button>

              {/* Notification & Phone Alerts Dropdown */}
              {showNotificationsDropdown && (
                <div className="absolute right-0 mt-2 w-76 sm:w-92 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3.5 z-50 text-xs">
                  <div className="flex items-center justify-between pb-2.5 border-b border-gray-100 mb-2.5">
                    <div className="flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-emerald-700" />
                      <h4 className="font-bold text-gray-900">
                        Phone Notifications
                      </h4>
                    </div>
                    <span className="text-[10px] bg-emerald-100 text-emerald-900 font-bold px-2 py-0.5 rounded-full">
                      {phonePerm === 'granted' ? 'Connected 🟢' : 'Enable 🔔'}
                    </span>
                  </div>

                  {/* Test alert trigger */}
                  <div className="mb-3 p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="font-bold text-[11px] text-slate-800">Phone Vibration & Alert Test</div>
                      <div className="text-[10px] text-slate-500">Dispatch test alert to phone drawer</div>
                    </div>
                    <button
                      onClick={handleSendTestAlert}
                      disabled={isTestSending}
                      className="px-2.5 py-1 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-[10px] rounded-lg transition flex items-center gap-1 cursor-pointer"
                    >
                      <Send className="w-3 h-3" />
                      <span>{isTestSending ? 'Sending...' : 'Send Test'}</span>
                    </button>
                  </div>

                  {testSentSuccess && (
                    <div className="mb-2 p-2 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg text-[10px] flex items-center gap-1.5 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      <span>Notification dispatched to your phone lock screen!</span>
                    </div>
                  )}

                  {/* Admin Notices list */}
                  {currentUser?.role === 'admin' && (
                    <>
                      <div className="flex items-center justify-between mt-2 mb-1.5">
                        <span className="font-bold text-slate-700 text-[11px]">Recent Teacher Notices</span>
                        <span className="text-[10px] text-slate-500 font-mono">{unreadNotifs.length} unreviewed</span>
                      </div>

                      {notifications.length === 0 ? (
                        <div className="p-3 text-center text-gray-400">
                          <Bell className="w-5 h-5 mx-auto mb-1 text-gray-300" />
                          <p>No notifications yet</p>
                        </div>
                      ) : (
                        <div className="max-h-56 overflow-y-auto space-y-1.5">
                          {notifications.slice(0, 6).map((notif) => (
                            <div
                              key={notif.id}
                              className={`p-2 rounded-xl border ${
                                notif.acknowledgedByAdmin
                                  ? 'bg-slate-50 border-slate-200'
                                  : notif.type === 'early_in' || notif.type === 'early_out'
                                  ? 'bg-amber-50 border-amber-200'
                                  : notif.type === 'late_in'
                                  ? 'bg-rose-50 border-rose-200'
                                  : 'bg-emerald-50 border-emerald-200'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-0.5">
                                <span className="font-bold text-gray-900 text-[11px]">
                                  {notif.teacherName} {notif.teacherSurname}
                                </span>
                                <span className="text-[9px] text-gray-500 font-mono">{notif.time}</span>
                              </div>
                              <p className="text-[10px] text-gray-700 line-clamp-2">
                                {notif.reason}
                              </p>
                              {!notif.acknowledgedByAdmin && (
                                <button
                                  onClick={() => acknowledgeNotification(notif.id)}
                                  className="mt-1 text-[9px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md hover:bg-emerald-200 transition cursor-pointer"
                                >
                                  Mark Reviewed
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Logout Icon */}
            <button
              onClick={logout}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
