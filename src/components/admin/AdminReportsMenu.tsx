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
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SchoolCrest } from '../common/SchoolCrest';

export const AdminReportsMenu: React.FC = () => {
  const { users, attendanceRecords, schoolSettings } = useApp();
  const [selectedReport, setSelectedReport] = useState<string | null>(null);

  const reportItems = [
    {
      id: 'daily',
      title: 'Daily Report',
      desc: 'View daily attendance report & roll call',
      icon: FileText,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      id: 'weekly',
      title: 'Weekly Report',
      desc: 'View weekly attendance report & department stats',
      icon: Calendar,
      color: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    {
      id: 'monthly',
      title: 'Monthly Report',
      desc: 'View monthly attendance summary & compliance',
      icon: Layers,
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    },
    {
      id: 'yearly',
      title: 'Yearly Report',
      desc: 'View yearly attendance audit & annual review',
      icon: Calendar,
      color: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    },
    {
      id: 'custom',
      title: 'Custom Report',
      desc: 'Generate custom report with department & date range',
      icon: Sliders,
      color: 'bg-amber-50 text-amber-700 border-amber-200',
    },
  ];

  const handleReportClick = (id: string) => {
    setSelectedReport(id);
  };

  const handleExportCSV = () => {
    const headers = ['Date', 'Teacher', 'Subject', 'Clock In', 'Clock Out', 'Status', 'Duration (Mins)', 'Early Reason'];
    const rows = attendanceRecords.map((r) => [
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
    link.setAttribute('download', `Dadaya_Master_Report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header matching wireframe screen #7 */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
        <h2 className="text-xl font-bold text-gray-900">Administrative Reports</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Generate official institutional attendance digests and faculty audit summaries for {schoolSettings.schoolName}
        </p>
      </div>

      {/* Menu Cards List */}
      <div className="space-y-3.5">
        {reportItems.map((item) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.id}
              whileHover={{ scale: 1.008 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => handleReportClick(item.id)}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between cursor-pointer hover:border-emerald-500 transition"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${item.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-gray-900">{item.title}</h3>
                    {(item as any).badge && (
                      <span className="px-2 py-0.2 rounded-md bg-emerald-100 text-emerald-900 font-extrabold text-[9px] uppercase tracking-wide border border-emerald-300">
                        {(item as any).badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </motion.div>
          );
        })}
      </div>

      {/* Report Modal */}
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
                    <p className="text-gray-500">Total Registered Faculty: {users.filter(u => u.role === 'teacher').length}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">Institutional Dossier</p>
                    <p className="text-gray-500 font-mono">Date: {new Date().toLocaleDateString('en-GB')}</p>
                  </div>
                </div>

                <div>
                  <h5 className="font-bold text-gray-800 uppercase tracking-wider mb-2">
                    Faculty Attendance Log Snapshot
                  </h5>
                  {attendanceRecords.length === 0 ? (
                    <p className="p-4 bg-slate-50 rounded-xl text-center text-gray-500">
                      No records logged yet.
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
                          {attendanceRecords.slice(0, 10).map((r) => (
                            <tr key={r.id}>
                              <td className="p-2.5 font-medium">{r.date}</td>
                              <td className="p-2.5 font-bold text-gray-900">{r.teacherName} {r.teacherSurname}</td>
                              <td className="p-2.5 font-mono">{r.clockInTime || '--'}</td>
                              <td className="p-2.5 font-mono">{r.clockOutTime || '--'}</td>
                              <td className="p-2.5 uppercase font-bold text-emerald-800">{r.status}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  onClick={handleExportCSV}
                  className="px-4 py-2 bg-white border border-slate-300 rounded-xl text-slate-700 font-bold text-xs hover:bg-slate-50 flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4 text-emerald-700" />
                  <span>Download Master CSV</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-blue-900 hover:bg-blue-950 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Dossier</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
