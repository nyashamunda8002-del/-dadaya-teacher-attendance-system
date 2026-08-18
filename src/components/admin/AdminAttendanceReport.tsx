import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Calendar,
  Download,
  Printer,
  FileSpreadsheet,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Trash2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SchoolCrest } from '../common/SchoolCrest';

export const AdminAttendanceReport: React.FC = () => {
  const { users, attendanceRecords, schoolSettings, clearAttendanceRecords, deleteAttendanceRecord } = useApp();

  const [reportType, setReportType] = useState<'Daily' | 'Weekly' | 'Monthly' | 'Yearly'>('Daily');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');

  const registeredTeachers = users.filter((u) => u.role === 'teacher');

  // Filter records by date and search
  const filteredRecords = attendanceRecords.filter((rec) => {
    if (reportType === 'Daily' && rec.date !== selectedDate) return false;
    if (reportType === 'Monthly' && !rec.date.startsWith(selectedDate.substring(0, 7))) return false;

    const fullStr = `${rec.teacherName} ${rec.teacherSurname} ${rec.subject}`.toLowerCase();
    return fullStr.includes(searchQuery.toLowerCase());
  });

  const presentCount = filteredRecords.filter((r) => r.status === 'present' || r.status === 'early_departure').length;
  const lateCount = filteredRecords.filter((r) => r.status === 'late').length;
  const totalCount = registeredTeachers.length || (presentCount + lateCount);
  const absentCount = Math.max(0, totalCount - (presentCount + lateCount));

  const handleExportCSV = () => {
    const headers = ['Date', 'Teacher Name', 'Subject', 'In Time', 'Out Time', 'Status', 'Duration (Mins)', 'Early Reason Note'];
    const rows = filteredRecords.map((r) => [
      r.date,
      `"${r.teacherName} ${r.teacherSurname}"`,
      `"${r.subject}"`,
      r.clockInTime || 'N/A',
      r.clockOutTime || 'N/A',
      r.status,
      r.totalWorkingMinutes || 0,
      `"${r.earlyClockInReason || r.earlyClockOutReason || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Dadaya_Admin_Attendance_Report_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Filters Bar matching wireframe screen #6 */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <SchoolCrest size="sm" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Attendance Report</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Comprehensive attendance logs for {schoolSettings.schoolName}
              </p>
            </div>
          </div>

          {/* Export Buttons matching wireframe */}
          <div className="flex items-center gap-2 flex-wrap">
            {attendanceRecords.length > 0 && (
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete all clocked in attendance records? This action cannot be undone.')) {
                    clearAttendanceRecords();
                  }
                }}
                className="px-3.5 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition"
                title="Remove all attendance records"
              >
                <Trash2 className="w-4 h-4 text-red-600" />
                <span>Clear Records</span>
              </button>
            )}
            <button
              onClick={handlePrint}
              className="px-4 py-2.5 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition"
            >
              <FileText className="w-4 h-4" />
              <span>Export PDF</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export Excel</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* Report Type */}
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
              Report Type
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-700/30"
            >
              <option value="Daily">Daily Report</option>
              <option value="Weekly">Weekly Report</option>
              <option value="Monthly">Monthly Report</option>
              <option value="Yearly">Yearly Report</option>
            </select>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
              Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-700/30"
            />
          </div>

          {/* Search */}
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
              Search Teacher
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name or subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-700/30"
              />
            </div>
          </div>
        </div>

        {/* 4 Summary Stat Pills matching Wireframe (Present, Late, Absent, Total) */}
        <div className="grid grid-cols-4 gap-2 sm:gap-4 pt-3">
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-center">
            <span className="text-[10px] font-bold text-emerald-800 uppercase block">Present</span>
            <span className="text-xl sm:text-2xl font-black text-emerald-700">{presentCount}</span>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-center">
            <span className="text-[10px] font-bold text-amber-800 uppercase block">Late</span>
            <span className="text-xl sm:text-2xl font-black text-amber-700">{lateCount}</span>
          </div>

          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 text-center">
            <span className="text-[10px] font-bold text-rose-800 uppercase block">Absent</span>
            <span className="text-xl sm:text-2xl font-black text-rose-700">{absentCount}</span>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 text-center">
            <span className="text-[10px] font-bold text-blue-800 uppercase block">Total</span>
            <span className="text-xl sm:text-2xl font-black text-blue-700">{totalCount}</span>
          </div>
        </div>
      </div>

      {/* Attendance Table matching Wireframe screen #6 */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 text-sm">Attendance Logs</h3>
          <span className="text-xs text-gray-500">{filteredRecords.length} entries shown</span>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="p-12 text-center text-gray-500 text-xs">
            <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="font-semibold text-gray-700">No attendance records for selected filters</p>
            <p className="text-gray-400 mt-0.5">Records will show in real time as teachers clock in.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] text-gray-600 uppercase border-b border-gray-200">
                <tr>
                  <th className="p-3.5 pl-5">Teacher</th>
                  <th className="p-3.5">In Time</th>
                  <th className="p-3.5">Out Time</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 pr-5">Early Reason / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60 transition">
                    <td className="p-3.5 pl-5">
                      <div className="font-bold text-gray-900">
                        {r.teacherName} {r.teacherSurname}
                      </div>
                      <div className="text-[11px] text-blue-800">{r.subject}</div>
                    </td>
                    <td className="p-3.5 font-mono font-bold text-emerald-900">
                      {r.clockInTime || '--:--'}
                    </td>
                    <td className="p-3.5 font-mono font-bold text-gray-800">
                      {r.clockOutTime || '--:--'}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          r.status === 'present'
                            ? 'bg-emerald-100 text-emerald-800'
                            : r.status === 'late'
                            ? 'bg-amber-100 text-amber-800'
                            : r.status === 'early_departure'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {r.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3.5 pr-5 max-w-xs truncate">
                      {r.earlyClockInReason || r.earlyClockOutReason ? (
                        <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded font-medium text-[11px]">
                          {r.earlyClockInReason || r.earlyClockOutReason}
                        </span>
                      ) : (
                        <span className="text-gray-400">Regular</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
