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
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SchoolCrest } from '../common/SchoolCrest';
import {
  exportAdminMasterReportPDF,
  exportToAccessAndExcelCSV,
} from '../../utils/reportExport';
import { triggerHaptic } from '../../utils/haptics';

export const AdminAttendanceReport: React.FC = () => {
  const { users, attendanceRecords, schoolSettings, clearAttendanceRecords, deleteAttendanceRecord, setActiveView } = useApp();

  const [reportType, setReportType] = useState<'Daily' | 'Weekly' | 'Monthly' | 'Yearly'>('Daily');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');

  const registeredTeachers = users.filter((u) => u.role === 'teacher');

  // Filter records by date and search
  const filteredRecords = attendanceRecords.filter((rec) => {
    if (reportType === 'Daily' && rec.date !== selectedDate) return false;
    if (reportType === 'Monthly' && !rec.date.startsWith(selectedDate.substring(0, 7))) return false;
    if (reportType === 'Yearly' && !rec.date.startsWith(selectedDate.substring(0, 4))) return false;
    if (reportType === 'Weekly') {
      const target = new Date(selectedDate);
      const past7 = new Date(target);
      past7.setDate(past7.getDate() - 7);
      const past7Str = past7.toISOString().split('T')[0];
      if (rec.date < past7Str || rec.date > selectedDate) return false;
    }

    const fullStr = `${rec.teacherName} ${rec.teacherSurname} ${rec.subject}`.toLowerCase();
    return fullStr.includes(searchQuery.toLowerCase());
  });

  const presentCount = filteredRecords.filter((r) => r.status === 'present' || r.status === 'early_departure').length;
  const lateCount = filteredRecords.filter((r) => r.status === 'late').length;
  const totalCount = registeredTeachers.length || (presentCount + lateCount);
  const absentCount = Math.max(0, totalCount - (presentCount + lateCount));

  const handleExportPDF = () => {
    triggerHaptic('light');
    const title = `${reportType.toUpperCase()} FACULTY ATTENDANCE REPORT`;
    const periodText = `Report Period: ${reportType} (${selectedDate})`;
    exportAdminMasterReportPDF(filteredRecords, users, schoolSettings, title, periodText);
  };

  const handleExportCSV = () => {
    triggerHaptic('light');
    const headers = [
      'Date',
      'EC Number',
      'Teacher Name',
      'Subject / Department',
      'In Time',
      'Out Time',
      'Status',
      'Duration (Mins)',
      'Campus Verified',
      'Early Reason / Note',
    ];
    const rows = filteredRecords.map((r) => {
      const u = users.find((usr) => usr.id === r.userId);
      return [
        r.date,
        u?.ecNumber || u?.employeeId || 'DHS-T001',
        `${r.teacherName} ${r.teacherSurname}`,
        r.subject || u?.subject || 'Faculty',
        r.clockInTime || 'N/A',
        r.clockOutTime || 'N/A',
        r.status,
        r.totalWorkingMinutes || 0,
        r.locationVerified ? 'Yes (Within 100m)' : 'No',
        r.earlyClockInReason || r.earlyClockOutReason || '',
      ];
    });

    exportToAccessAndExcelCSV(
      headers,
      rows,
      `Dadaya_Admin_Attendance_${reportType}_${selectedDate}.csv`
    );
  };

  const handlePrint = () => {
    triggerHaptic('light');
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
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-gray-900">Attendance Report</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                  Institutional Master
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Comprehensive attendance logs for {schoolSettings.schoolName}
              </p>
            </div>
          </div>

          {/* Export Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                triggerHaptic('selection');
                setActiveView('admin-reports');
              }}
              className="px-3.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 font-bold text-xs rounded-xl shadow-2xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-indigo-700" />
              <span>Termly Reports</span>
            </button>

            {attendanceRecords.length > 0 && (
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete all clocked in attendance records? This action cannot be undone.')) {
                    clearAttendanceRecords();
                  }
                }}
                className="px-3.5 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-xs rounded-xl shadow-2xs flex items-center gap-1.5 transition cursor-pointer"
                title="Remove all attendance records"
              >
                <Trash2 className="w-4 h-4 text-red-600" />
                <span>Clear</span>
              </button>
            )}

            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl shadow-2xs flex items-center gap-1.5 transition cursor-pointer"
              title="Export formatted for Microsoft Access and Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              <span>Export CSV / Access</span>
            </button>

            <button
              onClick={handleExportPDF}
              className="px-4 py-2.5 bg-blue-800 hover:bg-blue-900 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>

            <button
              onClick={handlePrint}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
              title="Print view"
            >
              <Printer className="w-4 h-4" />
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
              <option value="Weekly">Weekly (Last 7 Days)</option>
              <option value="Monthly">Monthly Report</option>
              <option value="Yearly">Yearly Report</option>
            </select>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
              Target Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-700/30"
            />
          </div>

          {/* Search Box */}
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
              Search Staff
            </label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Name or subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-700/30"
              />
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase">Total Faculty</span>
            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {totalCount}
          </div>
          <span className="text-[10px] text-slate-500">Registered staff</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase">Present / On-Time</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 font-mono">
            {presentCount}
          </div>
          <span className="text-[10px] text-emerald-700 font-semibold">
            {totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0}% compliance
          </span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase">Late Clock-Ins</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-700 font-mono">
            {lateCount}
          </div>
          <span className="text-[10px] text-amber-700 font-semibold">After grace period</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase">Unclocked / Absent</span>
            <AlertCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-700 font-mono">
            {absentCount}
          </div>
          <span className="text-[10px] text-rose-700 font-semibold">No record logged</span>
        </div>
      </div>

      {/* Attendance Records Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-900">
            Attendance Log Entries ({filteredRecords.length})
          </h3>
          <span className="text-xs font-mono text-gray-500 bg-slate-100 px-2.5 py-1 rounded-xl">
            {reportType} View: {selectedDate}
          </span>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            <FileText className="w-10 h-10 mx-auto text-gray-300 mb-2" />
            <p className="font-semibold text-sm">No attendance records found</p>
            <p className="text-xs text-gray-400 mt-1">
              Try adjusting the date, report period, or search query.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-gray-200 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] text-gray-600 uppercase border-b border-gray-200">
                <tr>
                  <th className="p-3">Teacher</th>
                  <th className="p-3">Subject</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">In Time</th>
                  <th className="p-3">Out Time</th>
                  <th className="p-3">Duration</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3">
                      <div className="font-bold text-gray-900">
                        {rec.teacherName} {rec.teacherSurname}
                      </div>
                      <div className="text-[10px] text-gray-500 font-mono">
                        {rec.locationVerified ? '✓ Geofence Verified (100m)' : 'Standard'}
                      </div>
                    </td>
                    <td className="p-3 text-gray-600 font-medium">{rec.subject}</td>
                    <td className="p-3 text-gray-700 font-mono">{rec.date}</td>
                    <td className="p-3 font-mono font-bold text-emerald-800">
                      {rec.clockInTime || '--'}
                    </td>
                    <td className="p-3 font-mono font-bold text-rose-800">
                      {rec.clockOutTime || '--'}
                    </td>
                    <td className="p-3 font-mono text-gray-700">
                      {rec.totalWorkingMinutes
                        ? `${Math.floor(rec.totalWorkingMinutes / 60)}h ${rec.totalWorkingMinutes % 60}m`
                        : '--'}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          rec.status === 'present'
                            ? 'bg-emerald-100 text-emerald-800'
                            : rec.status === 'late'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {rec.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {deleteAttendanceRecord && (
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete attendance record for ${rec.teacherName} on ${rec.date}?`)) {
                              deleteAttendanceRecord(rec.id);
                            }
                          }}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
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
