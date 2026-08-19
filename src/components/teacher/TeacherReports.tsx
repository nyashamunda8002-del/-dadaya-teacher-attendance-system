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
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SchoolCrest } from '../common/SchoolCrest';

export const TeacherReports: React.FC = () => {
  const { currentUser, attendanceRecords, schoolSettings } = useApp();
  const [selectedReportType, setSelectedReportType] = useState<'daily' | 'weekly' | 'monthly' | 'yearly' | null>(null);

  const myRecords = attendanceRecords.filter((r) => r.userId === currentUser?.id);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCSV = () => {
    if (!currentUser) return;
    const headers = ['Date', 'Teacher', 'Subject', 'Clock In', 'Clock Out', 'Status', 'Duration (Minutes)', 'Early Reason'];
    const rows = myRecords.map((r) => [
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
    link.setAttribute('download', `Dadaya_Attendance_Report_${currentUser.surname}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const reportCards = [
    {
      type: 'daily' as const,
      title: 'Daily Report',
      desc: 'View daily attendance report & timestamp logs',
      icon: FileText,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      type: 'weekly' as const,
      title: 'Weekly Report',
      desc: 'View weekly attendance & hours summary',
      icon: Calendar,
      color: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    {
      type: 'monthly' as const,
      title: 'Monthly Report',
      desc: 'View monthly attendance breakdown & statistics',
      icon: FileText,
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    },
    {
      type: 'yearly' as const,
      title: 'Yearly Report',
      desc: 'View annual attendance dossier & compliance record',
      icon: Calendar,
      color: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
        <h2 className="text-xl font-bold text-gray-900">Attendance Reports</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Generate, preview and download official attendance summaries for {currentUser?.name} {currentUser?.surname}
        </p>
      </div>

      {/* Reports Menu List matching wireframe screen #7 */}
      <div className="space-y-3.5">
        {reportCards.map((rc) => {
          const Icon = rc.icon;
          return (
            <motion.div
              key={rc.type}
              whileHover={{ scale: 1.008 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => setSelectedReportType(rc.type)}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between cursor-pointer hover:border-emerald-300 transition"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${rc.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">{rc.title}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{rc.desc}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </motion.div>
          );
        })}
      </div>

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
                  <h5 className="font-bold text-gray-800 uppercase tracking-wider mb-2">
                    Attendance Log Entries
                  </h5>
                  {myRecords.length === 0 ? (
                    <p className="p-4 bg-slate-50 rounded-xl text-center text-gray-500">
                      No attendance records logged yet.
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
                          {myRecords.map((r) => (
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
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  onClick={handleDownloadCSV}
                  className="px-4 py-2 bg-white border border-slate-300 rounded-xl text-slate-700 font-bold text-xs hover:bg-slate-50 flex items-center gap-1.5 transition"
                >
                  <Download className="w-4 h-4 text-emerald-700" />
                  <span>Export CSV</span>
                </button>
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Report</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
