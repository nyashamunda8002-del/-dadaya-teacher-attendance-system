import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText,
  Calendar,
  Layers,
  ChevronRight,
  Download,
  Printer,
  X,
  Sliders,
  CalendarDays,
  FileSpreadsheet,
  Award,
  Sparkles,
  Users,
  Building2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SchoolCrest } from '../common/SchoolCrest';
import {
  exportAdminMasterReportPDF,
  exportToAccessAndExcelCSV,
} from '../../utils/reportExport';
import { TermlyReportsView } from '../common/TermlyReportsView';
import { triggerHaptic } from '../../utils/haptics';

export const AdminReportsMenu: React.FC = () => {
  const { users, attendanceRecords, schoolSettings } = useApp();
  const [activeTab, setActiveTab] = useState<'standard' | 'termly'>('standard');
  const [selectedReport, setSelectedReport] = useState<string | null>(null);

  const registeredTeachers = users.filter((u) => u.role === 'teacher');

  const reportItems = [
    {
      id: 'daily',
      title: 'Daily Faculty Attendance Ledger',
      desc: "Instant roll-call, timestamps & campus geofence audits for today",
      icon: FileText,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      id: 'weekly',
      title: 'Weekly Attendance Performance Digest',
      desc: 'Weekly 5-day cycle summary, cumulative hours & departmental stats',
      icon: Calendar,
      color: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    {
      id: 'monthly',
      title: 'Monthly MoPSE Statutory Register',
      desc: 'Official monthly compliance report aligned with Ministry standards',
      icon: Layers,
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    },
    {
      id: 'yearly',
      title: 'Annual Institutional Audit Dossier',
      desc: 'Full-year faculty attendance audit, compliance ratings & hours ledger',
      icon: CalendarDays,
      color: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    },
  ];

  const getFilteredRecords = (type: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const monthStr = todayStr.substring(0, 7);
    const yearStr = todayStr.substring(0, 4);

    if (type === 'daily') {
      return attendanceRecords.filter((r) => r.date === todayStr);
    }
    if (type === 'weekly') {
      const past7 = new Date();
      past7.setDate(past7.getDate() - 7);
      const past7Str = past7.toISOString().split('T')[0];
      return attendanceRecords.filter((r) => r.date >= past7Str);
    }
    if (type === 'monthly') {
      return attendanceRecords.filter((r) => r.date.startsWith(monthStr));
    }
    return attendanceRecords.filter((r) => r.date.startsWith(yearStr));
  };

  const handleExportPDF = (type: string = selectedReport || 'monthly') => {
    triggerHaptic('light');
    const recs = getFilteredRecords(type);
    const title = `${type.toUpperCase()} INSTITUTIONAL ATTENDANCE REPORT`;
    exportAdminMasterReportPDF(recs, users, schoolSettings, title);
  };

  const handleExportCSV = (type: string = selectedReport || 'monthly') => {
    triggerHaptic('light');
    const recs = getFilteredRecords(type);
    const headers = [
      'Date',
      'EC Number',
      'Teacher Name',
      'Department / Subject',
      'Clock In Time',
      'Clock Out Time',
      'Duration (Minutes)',
      'Status',
      'Geofence Verified',
      'Early / Late Reason',
    ];
    const rows = recs.map((r) => {
      const u = users.find((usr) => usr.id === r.userId);
      return [
        r.date,
        u?.ecNumber || u?.employeeId || 'DHS-T001',
        `${r.teacherName} ${r.teacherSurname}`,
        r.subject || u?.subject || 'Faculty',
        r.clockInTime || 'N/A',
        r.clockOutTime || 'N/A',
        r.totalWorkingMinutes || 0,
        r.status,
        r.locationVerified ? 'Yes (Within 100m)' : 'No',
        r.earlyClockInReason || r.earlyClockOutReason || '',
      ];
    });

    exportToAccessAndExcelCSV(
      headers,
      rows,
      `Dadaya_Institutional_Attendance_${type}_${Date.now()}.csv`
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-gray-900">Administrative Reports & Exports</h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-300">
              Institutional Master Audits
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Generate and export official institutional attendance dossiers for {schoolSettings.schoolName}
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl">
          <button
            onClick={() => {
              triggerHaptic('selection');
              setActiveTab('standard');
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition ${
              activeTab === 'standard'
                ? 'bg-blue-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Periodic Reports
          </button>
          <button
            onClick={() => {
              triggerHaptic('selection');
              setActiveTab('termly');
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 ${
              activeTab === 'termly'
                ? 'bg-blue-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Termly Reports</span>
          </button>
        </div>
      </div>

      {activeTab === 'termly' ? (
        <TermlyReportsView />
      ) : (
        <>
          {/* Quick Export Master Ledger Card */}
          <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-blue-300" />
                <h3 className="font-bold text-base">Export All Institutional Records</h3>
              </div>
              <p className="text-xs text-blue-100 max-w-xl">
                Download full institutional attendance ledger for all {registeredTeachers.length} teachers formatted for Microsoft Access, Excel, or official MoPSE PDF submission.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => handleExportCSV('yearly')}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl font-bold text-xs flex items-center gap-2 transition text-white cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-blue-300" />
                <span>Export Access / CSV</span>
              </button>
              <button
                onClick={() => handleExportPDF('yearly')}
                className="px-4 py-2.5 bg-blue-500 hover:bg-blue-400 text-slate-950 rounded-xl font-black text-xs flex items-center gap-2 shadow-sm transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Master PDF</span>
              </button>
            </div>
          </div>

          {/* Menu Cards List */}
          <div className="space-y-3.5">
            {reportItems.map((item) => {
              const Icon = item.icon;
              const recs = getFilteredRecords(item.id);
              return (
                <motion.div
                  key={item.id}
                  whileHover={{ scale: 1.006 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setSelectedReport(item.id)}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between cursor-pointer hover:border-blue-400 transition"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${item.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-gray-900">{item.title}</h3>
                        <span className="px-2 py-0.2 rounded-md bg-slate-100 text-slate-700 font-mono text-[10px] font-bold">
                          {recs.length} Logs
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExportPDF(item.id);
                      }}
                      className="p-2 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition"
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

      {/* Report Modal Preview */}
      <AnimatePresence>
        {selectedReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col"
            >
              <div className="bg-blue-900 text-white p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <SchoolCrest size="sm" />
                  <div>
                    <h3 className="font-bold text-base uppercase">
                      {selectedReport.toUpperCase()} ADMINISTRATIVE REPORT
                    </h3>
                    <p className="text-blue-200 text-xs font-mono">
                      Dadaya High School Official Academic Ledger
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
                <div className="border-b border-gray-200 pb-4 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-black text-gray-900 uppercase">
                      {schoolSettings.schoolName}
                    </h4>
                    <p className="text-gray-500">Academic Year: {schoolSettings.academicYear}</p>
                    <p className="text-gray-500">
                      Total Registered Faculty: {registeredTeachers.length}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">Institutional Dossier</p>
                    <p className="text-gray-500 font-mono">
                      Date: {new Date().toLocaleDateString('en-GB')}
                    </p>
                  </div>
                </div>

                <div>
                  <h5 className="font-bold text-gray-800 uppercase tracking-wider mb-2">
                    Faculty Attendance Log Snapshot ({getFilteredRecords(selectedReport).length} records)
                  </h5>
                  {getFilteredRecords(selectedReport).length === 0 ? (
                    <p className="p-4 bg-slate-50 rounded-xl text-center text-gray-500">
                      No records logged for this period.
                    </p>
                  ) : (
                    <div className="overflow-x-auto border border-gray-200 rounded-xl">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 text-[11px] text-gray-600 uppercase border-b border-gray-200">
                          <tr>
                            <th className="p-2.5">Date</th>
                            <th className="p-2.5">Teacher</th>
                            <th className="p-2.5">In</th>
                            <th className="p-2.5">Out</th>
                            <th className="p-2.5">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {getFilteredRecords(selectedReport).slice(0, 15).map((r) => (
                            <tr key={r.id}>
                              <td className="p-2.5 font-medium">{r.date}</td>
                              <td className="p-2.5 font-bold text-gray-900">
                                {r.teacherName} {r.teacherSurname}
                              </td>
                              <td className="p-2.5 font-mono">{r.clockInTime || '--'}</td>
                              <td className="p-2.5 font-mono">{r.clockOutTime || '--'}</td>
                              <td className="p-2.5 uppercase font-bold text-emerald-800">
                                {r.status}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3 flex-wrap">
                <button
                  onClick={() => handleExportCSV(selectedReport)}
                  className="px-4 py-2 bg-white border border-slate-300 rounded-xl text-slate-700 font-bold text-xs hover:bg-slate-50 flex items-center gap-1.5 transition cursor-pointer"
                  title="Export formatted for Microsoft Access and Excel"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                  <span>Export Access / CSV</span>
                </button>
                <button
                  onClick={() => handleExportPDF(selectedReport)}
                  className="px-4 py-2 bg-blue-800 hover:bg-blue-900 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Master PDF</span>
                </button>
                <button
                  onClick={() => window.print()}
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
