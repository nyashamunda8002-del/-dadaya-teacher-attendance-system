import React, { useState } from 'react';
import {
  Bell,
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
  ArrowDownToLine,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SchoolCrest } from './SchoolCrest';
import { triggerHaptic } from '../../utils/haptics';

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
  const unreadNotifs = notifications.filter((n) => !n.acknowledgedByAdmin);

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
                  Dadaya High
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-extrabold rounded uppercase tracking-wider">
                  School
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

          {/* Right Controls: Notification Bell (Admin), Role Badge, Profile/Logout */}
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

            {/* Notification Bell with Badge (For Admin: Real-time Teacher Clocking & Early Alerts) */}
            {currentUser?.role === 'admin' && (
              <div className="relative">
                <button
                  onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
                  className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 relative transition"
                  title="Live Clocking & Departure Alerts"
                >
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                  {unreadNotifs.length > 0 && (
                    <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-amber-500 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-pulse">
                      {unreadNotifs.length}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {showNotificationsDropdown && (
                  <div className="absolute right-0 mt-2 w-72 sm:w-88 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3.5 z-50 text-xs">
                    <div className="flex items-center justify-between pb-2.5 border-b border-gray-100 mb-2.5">
                      <div>
                        <h4 className="font-bold text-gray-900">
                          Teacher Alerts
                        </h4>
                        <p className="text-[10px] text-gray-500">Live notices</p>
                      </div>
                      <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full font-mono">
                        {unreadNotifs.length} new
                      </span>
                    </div>

                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-gray-400">
                        <Bell className="w-6 h-6 mx-auto mb-1 text-gray-300" />
                        <p>No notifications yet</p>
                      </div>
                    ) : (
                      <div className="max-h-64 overflow-y-auto space-y-2">
                        {notifications.slice(0, 8).map((notif) => (
                          <div
                            key={notif.id}
                            className={`p-2.5 rounded-xl border ${
                              notif.acknowledgedByAdmin
                                ? 'bg-slate-50 border-slate-200'
                                : notif.type === 'early_in' || notif.type === 'early_out'
                                ? 'bg-amber-50 border-amber-200'
                                : notif.type === 'late_in'
                                ? 'bg-rose-50 border-rose-200'
                                : 'bg-emerald-50 border-emerald-200'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-gray-900">
                                {notif.teacherName} {notif.teacherSurname}
                              </span>
                              <span className="text-[9px] text-gray-500 font-mono">{notif.time}</span>
                            </div>
                            <p className="text-[11px] text-gray-700">
                              {notif.reason}
                            </p>
                            {!notif.acknowledgedByAdmin && (
                              <button
                                onClick={() => acknowledgeNotification(notif.id)}
                                className="mt-1.5 text-[9px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md hover:bg-emerald-200 transition"
                              >
                                Mark Reviewed
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Direct App Download Link for Phone */}
            <a
              href="/api/download-app"
              download="DadayaAttendance-v1.0.4.apk"
              onClick={() => triggerHaptic('medium')}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition select-none"
              title="Download Android App Package to Phone"
            >
              <ArrowDownToLine className="w-3.5 h-3.5 text-emerald-700" />
              <span className="hidden sm:inline">Download App</span>
            </a>

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
