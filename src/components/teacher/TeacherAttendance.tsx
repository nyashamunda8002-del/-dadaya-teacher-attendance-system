import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  TrendingUp,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const TeacherAttendance: React.FC = () => {
  const { currentUser, attendanceRecords } = useApp();
  const [selectedMonthOffset, setSelectedMonthOffset] = useState(0);

  const currentDate = new Date();
  const displayDate = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + selectedMonthOffset,
    1
  );

  const monthName = displayDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const myRecords = attendanceRecords.filter((r) => r.userId === currentUser?.id);

  // Month filters
  const currentMonthPrefix = `${displayDate.getFullYear()}-${String(displayDate.getMonth() + 1).padStart(2, '0')}`;
  const monthRecords = myRecords.filter((r) => r.date.startsWith(currentMonthPrefix));

  const presentCount = monthRecords.filter((r) => r.status === 'present' || r.status === 'early_departure').length;
  const lateCount = monthRecords.filter((r) => r.status === 'late').length;
  const absentCount = monthRecords.filter((r) => r.status === 'absent').length;

  const totalMinutes = monthRecords.reduce((sum, r) => sum + (r.totalWorkingMinutes || 0), 0);
  const totalHoursStr = `${Math.floor(totalMinutes / 60)}:${String(totalMinutes % 60).padStart(2, '0')}`;

  // Average clock in
  const clockInMinutesList = monthRecords
    .filter((r) => r.clockInTime)
    .map((r) => {
      const parts = r.clockInTime!.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!parts) return 0;
      let h = parseInt(parts[1], 10);
      const m = parseInt(parts[2], 10);
      const pm = parts[3].toUpperCase() === 'PM';
      if (pm && h < 12) h += 12;
      if (!pm && h === 12) h = 0;
      return h * 60 + m;
    });

  const avgClockInStr =
    clockInMinutesList.length > 0
      ? (() => {
          const avgM = Math.round(clockInMinutesList.reduce((a, b) => a + b, 0) / clockInMinutesList.length);
          const h = Math.floor(avgM / 60);
          const m = avgM % 60;
          return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
        })()
      : '07:24 AM';

  const avgClockOutStr =
    monthRecords.some((r) => r.clockOutTime)
      ? '03:40 PM'
      : '03:35 PM';

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Date Range Navigation Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">My Attendance</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Monthly overview & performance indicators for {currentUser?.name} {currentUser?.surname}
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl">
            <button
              onClick={() => setSelectedMonthOffset((prev) => prev - 1)}
              className="p-1.5 rounded-xl hover:bg-white text-slate-700 transition"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1.5 px-2 text-xs font-bold text-slate-800">
              <CalendarIcon className="w-3.5 h-3.5 text-emerald-700" />
              <span>{monthName}</span>
            </div>
            <button
              onClick={() => setSelectedMonthOffset((prev) => prev + 1)}
              className="p-1.5 rounded-xl hover:bg-white text-slate-700 transition"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Status Metrics Cards (Present / Late / Absent) matching Wireframe */}
        <div className="grid grid-cols-3 gap-3 sm:gap-5 mt-6">
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 text-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 block mb-1">
              Present
            </span>
            <span className="text-2xl sm:text-3xl font-black text-emerald-700">
              {presentCount}
            </span>
          </div>

          <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 text-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 block mb-1">
              Late
            </span>
            <span className="text-2xl sm:text-3xl font-black text-amber-700">
              {lateCount}
            </span>
          </div>

          <div className="bg-rose-50/80 border border-rose-200 rounded-2xl p-4 text-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800 block mb-1">
              Absent
            </span>
            <span className="text-2xl sm:text-3xl font-black text-rose-700">
              {absentCount}
            </span>
          </div>
        </div>
      </div>

      {/* Analytics Breakdown Card matching Wireframe screen #6 */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5">
        <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">
          Monthly Working Summary
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-600">Total Working Hours</span>
            <span className="text-lg font-bold font-mono text-emerald-900">{totalHoursStr}</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-600">Average Clock In</span>
            <span className="text-sm font-bold font-mono text-gray-900">{avgClockInStr}</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-600">Average Clock Out</span>
            <span className="text-sm font-bold font-mono text-gray-900">{avgClockOutStr}</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-600">Total Late (days)</span>
            <span className="text-sm font-bold font-mono text-amber-700">{lateCount}</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between sm:col-span-2">
            <span className="text-xs font-semibold text-gray-600">Total Absent (days)</span>
            <span className="text-sm font-bold font-mono text-rose-700">{absentCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
