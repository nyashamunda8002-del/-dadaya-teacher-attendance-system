import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText,
  Calendar,
  Download,
  Printer,
  ChevronRight,
  CheckCircle2,
  X,
  Building2,
  CalendarDays,
  FileSpreadsheet,
  Award,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SchoolCrest } from '../common/SchoolCrest';
import {
  exportTeacherAttendancePDF,
  exportToAccessAndExcelCSV,
} from '../../utils/reportExport';
import { TermlyReportsView } from '../common/TermlyReportsView';
import { triggerHaptic } from '../../utils/haptics';

export const TeacherReports: React.FC = () => {
  const { currentUser, attendanceRecords, schoolSettings } = useApp();
  const [activeSubTab, setActiveSubTab] = useState<'standard' | 'termly'>('standard');
  const [selectedReportType, setSelectedReportType] = useState<'daily' | 'weekly' | 'monthly' | 'yearly' | null>(null);

  const myRecords = attendanceRecords.filter((r) => r.userId === currentUser?.id);

  // Filter records based on selected period
  const getFilteredRecords = (type: 'daily' | 'weekly' | 'monthly' | 'yearly') => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const thisMonthStr = todayStr.substring(0, 7);
    const thisYearStr = todayStr.substring(0, 4);

    if (type === 'daily') {
      return myRecords.filter((r) => r.date === todayStr);
    }
    if (type === 'weekly') {
      const past7 = new Date();
      past7.setDate(past7.getDate() - 7);
      const past7Str = past7.toISOString().split('T')[0];
      return myRecords.filter((r) => r.date >= past7Str);
    }
    if (type === 'monthly') {
      return myRecords.filter((r) => r.date.startsWith(thisMonthStr));
    }
    return myRecords.filter((r) => r.date.startsWith(thisYearStr));
  };

  const handlePrint = () => {
    triggerHaptic('light');
    window.print();
  };

  const handleDownloadPDF = (type: 'daily' | 'weekly' | 'monthly' | 'yearly' = selectedReportType || 'monthly') => {
    if (!currentUser) return;
    triggerHaptic('light');
    const recs = getFilteredRecords(type);
    const title = `${type.toUpperCase()} ATTENDANCE REPORT`;
    exportTeacherAttendancePDF(recs, currentUser, schoolSettings, title);
  };

  const handleDownloadCSV = (type: 'daily' | 'weekly' | 'monthly' | 'yearly' = selectedReportType || 'monthly') => {
    if (!currentUser) return;
    triggerHaptic('light');
    const recs = getFilteredRecords(type);
    const headers = [
      'Date',
      'Teacher Name',
      'EC Number',
      'Subject',
      'Clock In',
      'Clock Out',
      'Status',
      'Duration (Minutes)',
      'Campus Verified',
      'Reason / Note',
    ];
    const rows = recs.map((r) => [
      r.date,
      `${r.teacherName} ${r.teacherSurname}`,
      currentUser.ecNumber || currentUser.employeeId || 'DHS-T001',
      r.subject || currentUser.subject || 'Faculty',
      r.clockInTime || 'N/A',
      r.clockOutTime || 'N/A',
      r.status,
      r.totalWorkingMinutes || 0,
      r.locationVerified ? 'Yes (Within 100m)' : 'No',
      r.earlyClockInReason || r.earlyClockOutReason || '',
    ]);

    exportToAccessAndExcelCSV(
      headers,
      rows,
      `Dadaya_Teacher_Report_${type}_${currentUser.surname}_${Date.now()}.csv`
    );
  };

  const reportCards = [
    {
      type: 'daily' as const,
      title: 'Daily Attendance Report',
      desc: "View today's clock in/out timestamps, duration & geofence validation",
      icon: FileText,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      type: 'weekly' as const,
      title: 'Weekly Attendance Report',
      desc: 'View weekly 5-day cycle summary, cumulative hours & punctuality',
      icon: Calendar,
      color: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    {
      type: 'monthly' as const,
      title: 'Monthly MoPSE Register Report',
      desc: 'Official monthly breakdown conforming to Ministry statutory register',
      icon: FileText,
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    },
    {
      type: 'yearly' as const,
      title: 'Annual Attendance Dossier',
      desc: 'Complete annual attendance audit for academic performance appraisal',
      icon: CalendarDays,
      color: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Top Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-gray-900">Attendance Reports & Exports</h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
              PDF & Access Compatible
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Download official printable PDFs, MS Access / Excel datasets, and Termly summaries for {currentUser?.name} {currentUser?.surname}
          </p>
        </div>

        {/* View Switcher: Standard Reports vs Termly Reports */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl">
          <button
            onClick={() => {
              triggerHaptic('selection');
              setActiveSubTab('standard');
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition ${
              activeSubTab === 'standard'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            General Reports
          </button>
          <button
            onClick={() => {
              triggerHaptic('selection');
              setActiveSubTab('termly');
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 ${
              activeSubTab === 'termly'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Termly Reports</span>
          </button>
        </div>
      </div>

      {activeSubTab === 'termly' ? (
        <TermlyReportsView />
      ) : (
        <>
          {/* Quick Export Master Dataset Card */}
          <div className="bg-gradient-to-r from-emerald-900 to-teal-900 text-white rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-300" />
                <h3 className="font-bold text-base">Export All Personal Attendance Records</h3>
              </div>
              <p className="text-xs text-emerald-100 max-w-xl">
                Generate an official all-time downloadable PDF or Microsoft Access / Excel compatible CSV file of all your attendance logs.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => handleDownloadCSV('yearly')}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl font-bold text-xs flex items-center gap-2 transition text-white cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
                <span>Export Access / CSV</span>
              </button>
              <button
                onClick={() => handleDownloadPDF('yearly')}
                className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-black text-xs flex items-center gap-2 shadow-sm transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download All PDF</span>
              </button>
            </div>
          </div>

          {/* Reports Menu List */}
          <div className="space-y-3.5">
            {reportCards.map((rc) => {
              const Icon = rc.icon;
              const recs = getFilteredRecords(rc.type);
              return (
                <motion.div
                  key={rc.type}
                  whileHover={{ scale: 1.006 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setSelectedReportType(rc.type)}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between cursor-pointer hover:border-emerald-400 transition"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${rc.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-gray-900">{rc.title}</h3>
                        <span className="px-2 py-0.2 rounded-md bg-slate-100 text-slate-700 font-mono text-[10px] font-bold">
                          {recs.length} Logged
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{rc.desc}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadPDF(rc.type);
                      }}
                      className="p-2 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition"
                      title="Direct PDF Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </>
      )}

      {/* Report Modal / Preview */}
      <AnimatePresence>
        {selectedReportType && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="bg-emerald-900 text-white p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <SchoolCrest size="sm" />
                  <div>
                    <h3 className="font-bold text-base uppercase">
                      {selectedReportType.toUpperCase()} ATTENDANCE REPORT
                    </h3>
                    <p className="text-emerald-300 text-xs font-mono">
                      Dadaya High School Official Academic Record
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedReportType(null)}
                  className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Printable Body */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
                {/* School Header Banner */}
                <div className="border-b border-gray-200 pb-4 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-black text-gray-900 uppercase">
                      {schoolSettings.schoolName}
                    </h4>
                    <p className="text-gray-500">Academic Year: {schoolSettings.academicYear}</p>
                    <p className="text-gray-500">Generated: {new Date().toLocaleDateString('en-GB')}</p>
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-gray-900 text-sm">
                      {currentUser?.name} {currentUser?.surname}
                    </p>
                    <p className="text-emerald-700 font-semibold">{currentUser?.subject || 'Teacher'}</p>
                    <p className="text-gray-500 font-mono">EC / ID: {currentUser?.employeeId || 'DHS-T001'}</p>
                  </div>
                </div>

                {/* Table of Records */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-bold text-gray-800 uppercase tracking-wider">
                      Attendance Log Entries ({getFilteredRecords(selectedReportType).length} records)
                    </h5>
                  </div>
                  {getFilteredRecords(selectedReportType).length === 0 ? (
                    <p className="p-4 bg-slate-50 rounded-xl text-center text-gray-500">
                      No attendance records logged for this period.
                    </p>
                  ) : (
                    <div className="overflow-x-auto border border-gray-200 rounded-xl">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 text-[11px] text-gray-600 uppercase border-b border-gray-200">
                          <tr>
                            <th className="p-2.5">Date</th>
                            <th className="p-2.5">Clock In</th>
                            <th className="p-2.5">Clock Out</th>
                            <th className="p-2.5">Status</th>
                            <th className="p-2.5">Duration</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {getFilteredRecords(selectedReportType).map((r) => (
                            <tr key={r.id} className="hover:bg-slate-50/50">
                              <td className="p-2.5 font-medium">{r.date}</td>
                              <td className="p-2.5 font-mono">{r.clockInTime || '--'}</td>
                              <td className="p-2.5 font-mono">{r.clockOutTime || '--'}</td>
                              <td className="p-2.5">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                                  {r.status}
                                </span>
                              </td>
                              <td className="p-2.5 font-mono">
                                {r.totalWorkingMinutes ? `${r.totalWorkingMinutes} mins` : '--'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3 flex-wrap">
                <button
                  onClick={() => handleDownloadCSV(selectedReportType)}
                  className="px-4 py-2 bg-white border border-slate-300 rounded-xl text-slate-700 font-bold text-xs hover:bg-slate-50 flex items-center gap-1.5 transition cursor-pointer"
                  title="Export formatted for Microsoft Access and Excel"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                  <span>Export Access / CSV</span>
                </button>
                <button
                  onClick={() => handleDownloadPDF(selectedReportType)}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download PDF</span>
                </button>
                <button
                  onClick={handlePrint}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
