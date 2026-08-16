import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Calendar, Clock, CheckCircle2, AlertCircle, Search, Filter } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const TeacherHistory: React.FC = () => {
  const { currentUser, attendanceRecords } = useApp();
  const [filterType, setFilterType] = useState<'all' | 'clock_in' | 'clock_out'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const myRecords = attendanceRecords.filter((r) => r.userId === currentUser?.id);

  const filteredRecords = myRecords.filter((rec) => {
    // Search match
    const matchesSearch =
      rec.date.includes(searchQuery) ||
      (rec.clockInTime && rec.clockInTime.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (rec.earlyClockInReason && rec.earlyClockInReason.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterType === 'clock_in') return !!rec.clockInTime;
    if (filterType === 'clock_out') return !!rec.clockOutTime;
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-12">
      {/* Title & Top Filter Tabs matching Template */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Attendance History</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Personal attendance logs for {currentUser?.name} {currentUser?.surname} ({currentUser?.subject || 'Teacher'})
            </p>
          </div>

          {/* Filter Pills (All / Clock In / Clock Out) */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl w-fit">
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                filterType === 'all'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType('clock_in')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                filterType === 'clock_in'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Clock In
            </button>
            <button
              onClick={() => setFilterType('clock_out')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                filterType === 'clock_out'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Clock Out
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search logs by date (e.g. 2026-08) or reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
          />
        </div>
      </div>

      {/* History List Cards */}
      <div className="space-y-3">
        {filteredRecords.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-gray-800">No attendance records found</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
              Your attendance records will appear here as soon as you clock in on the dashboard.
            </p>
          </div>
        ) : (
          filteredRecords.map((record) => {
            const formattedDate = new Date(record.date).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            });

            return (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs hover:border-emerald-300 transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">{formattedDate}</h4>
                      <span className="text-[11px] text-gray-500">{record.date}</span>
                    </div>
                  </div>

                  <span
                    className={`self-start sm:self-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      record.status === 'present'
                        ? 'bg-emerald-100 text-emerald-800'
                        : record.status === 'late'
                        ? 'bg-amber-100 text-amber-800'
                        : record.status === 'early_departure'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {record.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 text-xs">
                  <div>
                    <span className="text-gray-500 block mb-0.5">Clock In</span>
                    <span className="font-mono font-bold text-emerald-900 text-sm">
                      {record.clockInTime || '--:--'}
                    </span>
                  </div>

                  <div>
                    <span className="text-gray-500 block mb-0.5">Clock Out</span>
                    <span className="font-mono font-bold text-gray-800 text-sm">
                      {record.clockOutTime || '--:--'}
                    </span>
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <span className="text-gray-500 block mb-0.5">Duration</span>
                    <span className="font-mono font-semibold text-slate-700">
                      {record.totalWorkingMinutes
                        ? `${Math.floor(record.totalWorkingMinutes / 60)}h ${record.totalWorkingMinutes % 60}m`
                        : 'In progress'}
                    </span>
                  </div>
                </div>

                {/* Early reason notes if any */}
                {(record.earlyClockInReason || record.earlyClockOutReason) && (
                  <div className="mt-3 p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                    <div className="flex items-center gap-1.5 font-bold text-amber-800 mb-0.5">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                      <span>Admin Notice Reason</span>
                    </div>
                    {record.earlyClockInReason && (
                      <p>
                        <strong className="text-amber-950">Early Clock-in:</strong> {record.earlyClockInReason}
                      </p>
                    )}
                    {record.earlyClockOutReason && (
                      <p>
                        <strong className="text-amber-950">Early Departure:</strong> {record.earlyClockOutReason}
                      </p>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};
