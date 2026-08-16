import React from 'react';
import { motion } from 'motion/react';
import {
  Users,
  UserCheck,
  Clock,
  AlertCircle,
  ShieldAlert,
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  BellRing,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const AdminDashboard: React.FC = () => {
  const {
    currentUser,
    users,
    attendanceRecords,
    notifications,
    acknowledgeNotification,
    clearAllNotifications,
    setActiveView,
    schoolSettings,
  } = useApp();

  const [filterType, setFilterType] = React.useState<'all' | 'early' | 'late' | 'clock'>('all');

  const todayStr = new Date().toISOString().split('T')[0];
  const registeredTeachers = users.filter((u) => u.role === 'teacher');
  const todayRecords = attendanceRecords.filter((r) => r.date === todayStr);

  const presentCount = todayRecords.filter((r) => r.status === 'present' || r.status === 'early_departure').length;
  const lateCount = todayRecords.filter((r) => r.status === 'late').length;
  const totalTeachersCount = registeredTeachers.length || (presentCount + lateCount);
  const absentCount = Math.max(0, totalTeachersCount - (presentCount + lateCount));

  // Early & live notifications pending
  const unreadEarlyNotifs = notifications.filter((n) => !n.acknowledgedByAdmin);

  // Filtered notifications
  const displayedNotifs = notifications.filter((n) => {
    if (filterType === 'early') return n.type === 'early_in' || n.type === 'early_out';
    if (filterType === 'late') return n.type === 'late_in';
    if (filterType === 'clock') return n.type === 'clock_in' || n.type === 'clock_out';
    return true;
  });

  // Total working hours for today
  const totalTodayMinutes = todayRecords.reduce((acc, r) => acc + (r.totalWorkingMinutes || 0), 0);
  const totalWorkingHoursStr = `${Math.floor(totalTodayMinutes / 60)}h ${String(totalTodayMinutes % 60).padStart(2, '0')}m`;

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-6">
      {/* Admin Hero Header */}
      <div className="bg-linear-to-br from-blue-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-4 sm:p-5 shadow-md relative overflow-hidden">
        <div className="flex items-center justify-between gap-3 relative z-10">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="px-2 py-0.2 bg-blue-700/60 border border-blue-400/30 rounded-md text-[10px] font-extrabold uppercase text-blue-200">
                Administration
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-black tracking-tight text-white">
              Executive Directorate
            </h1>
            <p className="text-blue-200 text-xs mt-0.5">
              Welcome, {currentUser?.name} {currentUser?.surname}
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-xs px-3 py-2 rounded-2xl border border-white/10 text-right shrink-0">
            <span className="text-[9px] text-blue-200 uppercase font-bold block">Academic Date</span>
            <span className="text-xs sm:text-sm font-bold font-mono text-white">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>
        </div>
      </div>

      {/* 4 Metric Cards (Teachers, Present, Late, Absent) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        {/* Total Teachers */}
        <div
          onClick={() => setActiveView('teachers')}
          className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs hover:border-blue-300 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
            <span className="text-[9px] font-extrabold text-blue-800 bg-blue-50 px-1.5 py-0.2 rounded-md group-hover:bg-blue-100 transition">
              Staff
            </span>
          </div>
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Teachers</span>
          <h3 className="text-xl sm:text-2xl font-black text-gray-900 mt-0.5">{totalTeachersCount}</h3>
        </div>

        {/* Present Today */}
        <div
          onClick={() => setActiveView('attendance-report')}
          className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs hover:border-emerald-300 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <UserCheck className="w-4 h-4" />
            </div>
            <span className="text-[9px] font-extrabold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded-md">
              On Campus
            </span>
          </div>
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Present</span>
          <h3 className="text-xl sm:text-2xl font-black text-emerald-700 mt-0.5">{presentCount}</h3>
        </div>

        {/* Late */}
        <div
          onClick={() => setActiveView('attendance-report')}
          className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs hover:border-amber-300 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
            <span className="text-[9px] font-extrabold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded-md">
              &gt;07:45
            </span>
          </div>
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Late</span>
          <h3 className="text-xl sm:text-2xl font-black text-amber-600 mt-0.5">{lateCount}</h3>
        </div>

        {/* Absent */}
        <div
          onClick={() => setActiveView('attendance-report')}
          className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs hover:border-rose-300 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center font-bold">
              <AlertCircle className="w-4 h-4" />
            </div>
            <span className="text-[9px] font-extrabold text-rose-800 bg-rose-50 px-1.5 py-0.2 rounded-md">
              Away
            </span>
          </div>
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Absent</span>
          <h3 className="text-xl sm:text-2xl font-black text-rose-600 mt-0.5">{absentCount}</h3>
        </div>
      </div>

      {/* Live Attendance Alerts & Reason Notices */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-4 h-4 text-amber-700" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">
                Live Attendance Alerts
              </h2>
              <p className="text-[11px] text-gray-500">
                Real-time check-ins & teacher explanations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Filter buttons */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl text-[11px] font-semibold">
              <button
                onClick={() => setFilterType('all')}
                className={`px-2 py-1 rounded-lg transition ${
                  filterType === 'all' ? 'bg-white shadow-2xs text-gray-900 font-bold' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                onClick={() => setFilterType('early')}
                className={`px-2 py-1 rounded-lg transition ${
                  filterType === 'early' ? 'bg-white shadow-2xs text-amber-900 font-bold' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Early Notices
              </button>
              <button
                onClick={() => setFilterType('late')}
                className={`px-2 py-1 rounded-lg transition ${
                  filterType === 'late' ? 'bg-white shadow-2xs text-rose-900 font-bold' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Late
              </button>
            </div>

            {unreadEarlyNotifs.length > 0 && (
              <span className="px-2 py-0.5 bg-amber-500 text-white font-bold text-[10px] rounded-full animate-pulse flex items-center gap-1">
                <BellRing className="w-3 h-3" />
                {unreadEarlyNotifs.length}
              </span>
            )}
          </div>
        </div>

        {/* Notifications Feed */}
        {displayedNotifs.length === 0 ? (
          <div className="p-6 text-center bg-slate-50 rounded-2xl border border-slate-100 text-gray-500 text-xs">
            <ShieldAlert className="w-6 h-6 text-gray-300 mx-auto mb-1.5" />
            <p className="font-semibold text-gray-700">No active alerts</p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Teacher check-ins, early reasons, and departure logs will stream here live.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {displayedNotifs.slice(0, 10).map((notif) => {
              const badgeConfig = (() => {
                switch (notif.type) {
                  case 'early_in':
                    return { label: 'Early In', bg: 'bg-amber-600 text-white' };
                  case 'early_out':
                    return { label: 'Early Departure', bg: 'bg-indigo-600 text-white' };
                  case 'late_in':
                    return { label: 'Late', bg: 'bg-rose-600 text-white' };
                  case 'clock_in':
                    return { label: 'Clock In', bg: 'bg-emerald-700 text-white' };
                  case 'clock_out':
                    return { label: 'Clock Out', bg: 'bg-slate-700 text-white' };
                  default:
                    return { label: 'Notice', bg: 'bg-blue-600 text-white' };
                }
              })();

              return (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, y: 3 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-3 sm:p-3.5 rounded-2xl border transition ${
                    notif.acknowledgedByAdmin
                      ? 'bg-slate-50/70 border-slate-200 opacity-85'
                      : notif.type === 'early_in' || notif.type === 'early_out'
                      ? 'bg-amber-50/90 border-amber-300 shadow-2xs'
                      : notif.type === 'late_in'
                      ? 'bg-rose-50/80 border-rose-200 shadow-2xs'
                      : 'bg-slate-50 border-slate-200 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-2 py-0.2 rounded text-[9px] font-black uppercase ${badgeConfig.bg}`}
                      >
                        {badgeConfig.label}
                      </span>
                      <h3 className="font-bold text-gray-900 text-xs sm:text-sm">
                        {notif.teacherName} {notif.teacherSurname}
                      </h3>
                      {notif.subject && (
                        <span className="text-[11px] text-gray-500 font-medium">({notif.subject})</span>
                      )}
                    </div>

                    <span className="text-[10px] text-gray-500 font-mono font-bold">
                      {notif.time}
                    </span>
                  </div>

                  <div className="bg-white/90 p-2 rounded-xl border border-slate-100 text-xs">
                    <p className="text-gray-800 font-medium text-[11px] leading-snug">
                      "{notif.reason}"
                    </p>
                  </div>

                  <div className="mt-2 flex items-center justify-end">
                    {!notif.acknowledgedByAdmin ? (
                      <button
                        onClick={() => acknowledgeNotification(notif.id)}
                        className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold rounded-lg flex items-center gap-1 shadow-2xs transition"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Acknowledge</span>
                      </button>
                    ) : (
                      <span className="text-[10px] font-semibold text-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Reviewed
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Today's Overview Card */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-xs">
        <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3 pb-1.5 border-b border-gray-100">
          Faculty Attendance Summary
        </h3>

        <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center">
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-[10px] font-semibold text-gray-500 block">Total Hours Logged</span>
            <span className="text-base sm:text-lg font-bold font-mono text-blue-900 block mt-0.5">{totalWorkingHoursStr}</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-[10px] font-semibold text-gray-500 block">Avg Clock In</span>
            <span className="text-base sm:text-lg font-bold font-mono text-emerald-800 block mt-0.5">07:20 AM</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-[10px] font-semibold text-gray-500 block">Avg Clock Out</span>
            <span className="text-base sm:text-lg font-bold font-mono text-gray-800 block mt-0.5">03:36 PM</span>
          </div>
        </div>
      </div>
    </div>
  );
};
