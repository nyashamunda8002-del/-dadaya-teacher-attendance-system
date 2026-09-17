import React, { useState, useMemo } from 'react';
import {
  GraduationCap,
  Calendar,
  Download,
  Search,
  Filter,
  Users,
  CheckCircle2,
  Clock,
  Printer,
  Sparkles,
  Edit3,
  Plus,
} from 'lucide-react';
import { useApp, DEFAULT_CLASSES } from '../../context/AppContext';
import { exportDailyStudentAttendancePDF } from '../../utils/studentAttendancePdf';

export const AdminStudentAttendance: React.FC = () => {
  const {
    studentAttendanceRecords,
    classes,
    saveStudentAttendance,
    schoolSettings,
    currentUser,
  } = useApp();

  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [formFilter, setFormFilter] = useState<string>('all');

  // Quick edit modal or inline edit state
  const [editingClass, setEditingClass] = useState<string | null>(null);
  const [editGB, setEditGB] = useState<number>(0);
  const [editGD, setEditGD] = useState<number>(0);
  const [editBB, setEditBB] = useState<number>(0);
  const [editBD, setEditBD] = useState<number>(0);
  const [editPossible, setEditPossible] = useState<number>(45);

  // Group classes and merge with attendance on selectedDate
  const tableData = useMemo(() => {
    // Sort classes in canonical Dadaya stream order
    const defaultOrder = DEFAULT_CLASSES.map((c) => c.name.toLowerCase());
    const sorted = [...classes].sort((a, b) => {
      const idxA = defaultOrder.indexOf(a.name.toLowerCase());
      const idxB = defaultOrder.indexOf(b.name.toLowerCase());
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.name.localeCompare(b.name, undefined, { numeric: true });
    });

    return sorted
      .filter((cls) => {
        if (formFilter !== 'all' && cls.formLevel !== formFilter) return false;
        if (searchTerm && !cls.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        return true;
      })
      .map((cls) => {
        const record = studentAttendanceRecords.find(
          (r) =>
            r.date === selectedDate &&
            r.className.toLowerCase().trim() === cls.name.toLowerCase().trim()
        );

        const gb = record ? record.girlsBoarders : 0;
        const gd = record ? record.girlsDay : 0;
        const bb = record ? record.boysBoarders : 0;
        const bd = record ? record.boysDay : 0;
        const actual = record ? record.actualTotal : 0;
        const possible = record ? record.possibleTotal : cls.capacity || 45;
        const hasSubmitted = !!record;

        return {
          classId: cls.id,
          className: cls.name,
          formLevel: cls.formLevel,
          assignedTeacher: cls.assignedTeacherName || 'Not Assigned',
          girlsBoarders: gb,
          girlsDay: gd,
          boysBoarders: bb,
          boysDay: bd,
          actualTotal: actual,
          possibleTotal: possible,
          hasSubmitted,
          notes: record?.notes,
        };
      });
  }, [classes, studentAttendanceRecords, selectedDate, formFilter, searchTerm]);

  // Aggregate Totals for Summary Row
  const totals = useMemo(() => {
    return tableData.reduce(
      (acc, row) => {
        acc.girlsBoarders += row.girlsBoarders;
        acc.girlsDay += row.girlsDay;
        acc.boysBoarders += row.boysBoarders;
        acc.boysDay += row.boysDay;
        acc.actual += row.actualTotal;
        acc.possible += row.possibleTotal;
        if (row.hasSubmitted) acc.submittedClasses += 1;
        return acc;
      },
      {
        girlsBoarders: 0,
        girlsDay: 0,
        boysBoarders: 0,
        boysDay: 0,
        actual: 0,
        possible: 0,
        submittedClasses: 0,
      }
    );
  }, [tableData]);

  const totalRate =
    totals.possible > 0 ? ((totals.actual / totals.possible) * 100).toFixed(1) : '0.0';

  // Trigger PDF download with the exact image headings
  const handleDownloadPDF = () => {
    exportDailyStudentAttendancePDF({
      records: studentAttendanceRecords,
      classes,
      date: selectedDate,
      schoolSettings,
      reportTitle: 'Daily Student Attendance Register (Official MoPSE Ledger)',
      generatedBy: currentUser ? `${currentUser.name} ${currentUser.surname}` : 'Dadaya High Administration',
    });
  };

  const handleStartEdit = (row: (typeof tableData)[0]) => {
    setEditingClass(row.className);
    setEditGB(row.girlsBoarders);
    setEditGD(row.girlsDay);
    setEditBB(row.boysBoarders);
    setEditBD(row.boysDay);
    setEditPossible(row.possibleTotal || 45);
  };

  const handleSaveEdit = async () => {
    if (!editingClass) return;
    await saveStudentAttendance({
      className: editingClass,
      teacherId: currentUser?.id || 'admin',
      teacherName: currentUser ? `${currentUser.name} ${currentUser.surname} (Admin)` : 'Administration',
      date: selectedDate,
      girlsBoarders: editGB,
      girlsDay: editGD,
      boysBoarders: editBB,
      boysDay: editBD,
      actualTotal: editGB + editGD + editBB + editBD,
      possibleTotal: editPossible,
      notes: 'Admin manual roll-call adjustment',
    });
    setEditingClass(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-slate-900 text-white p-6 rounded-2xl shadow-lg border border-emerald-700/50">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-700/60 rounded-xl border border-emerald-500/30">
              <GraduationCap className="w-8 h-8 text-emerald-300" />
            </div>
            <div>
              <span className="text-xs uppercase font-bold tracking-widest text-emerald-300">
                Administration Portal • Student Roll Call
              </span>
              <h2 className="text-2xl font-bold">Daily Student Attendance Register</h2>
              <p className="text-xs text-emerald-100/80 mt-0.5">
                Official Ministry institutional roll call ledger displaying boarders, day scholars, and downloadable PDF with certified MoPSE headings.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 px-4 py-2.5 bg-white text-emerald-900 hover:bg-emerald-50 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
            >
              <Download className="w-4 h-4 text-emerald-700" />
              <span>Download PDF (Official Headings)</span>
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-emerald-700/40">
          <div className="p-3 bg-emerald-950/50 rounded-xl border border-emerald-700/30">
            <span className="text-[11px] text-emerald-300 font-medium">Classes Submitted</span>
            <div className="text-xl font-black text-white mt-0.5">
              {totals.submittedClasses} <span className="text-xs text-emerald-400 font-normal">/ {tableData.length}</span>
            </div>
          </div>

          <div className="p-3 bg-emerald-950/50 rounded-xl border border-emerald-700/30">
            <span className="text-[11px] text-emerald-300 font-medium">Boarders Present</span>
            <div className="text-xl font-black text-white mt-0.5">
              {totals.girlsBoarders + totals.boysBoarders}
            </div>
          </div>

          <div className="p-3 bg-emerald-950/50 rounded-xl border border-emerald-700/30">
            <span className="text-[11px] text-emerald-300 font-medium">Day Scholars Present</span>
            <div className="text-xl font-black text-white mt-0.5">
              {totals.girlsDay + totals.boysDay}
            </div>
          </div>

          <div className="p-3 bg-emerald-950/50 rounded-xl border border-emerald-700/30">
            <span className="text-[11px] text-emerald-300 font-medium">School Attendance Rate</span>
            <div className="text-xl font-black text-emerald-300 mt-0.5">
              {totalRate}%
            </div>
          </div>
        </div>
      </div>

      {/* Date & Filter Controls */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Date Selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-700" />
            <span className="text-xs font-bold text-slate-700">Date:</span>
          </div>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          {selectedDate !== todayStr && (
            <button
              onClick={() => setSelectedDate(todayStr)}
              className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold hover:bg-emerald-200"
            >
              Today
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search class name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <select
            value={formFilter}
            onChange={(e) => setFormFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Form Levels</option>
            <option value="Form 1">Form 1</option>
            <option value="Form 2">Form 2</option>
            <option value="Form 3">Form 3</option>
            <option value="Form 4">Form 4</option>
            <option value="Lower 6">Lower 6</option>
            <option value="Upper 6">Upper 6</option>
          </select>
        </div>
      </div>

      {/* Main Official Register Table matching picture layout */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">
            Official Attendance Ledger for {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-GB', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </h3>
          <span className="text-xs text-slate-500">
            Matching MoPSE National Institutional Headings
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-center border-collapse">
            <thead>
              {/* Row 1 Headings from Image */}
              <tr className="bg-emerald-900 text-white font-bold border-b border-emerald-800">
                <th
                  rowSpan={2}
                  className="p-3 text-left border-r border-emerald-800/60 min-w-[140px]"
                >
                  CLASS
                </th>
                <th colSpan={2} className="p-2 border-r border-emerald-800/60 bg-emerald-950/40">
                  GIRLS
                </th>
                <th colSpan={2} className="p-2 border-r border-emerald-800/60 bg-emerald-950/40">
                  BOYS
                </th>
                <th colSpan={2} className="p-2 bg-emerald-950/60">
                  TOTAL
                </th>
                <th rowSpan={2} className="p-3 border-l border-emerald-800/60 min-w-[80px]">
                  ACTION
                </th>
              </tr>
              {/* Row 2 Subheadings from Image */}
              <tr className="bg-emerald-800 text-emerald-100 font-semibold text-[11px] border-b border-slate-300">
                <th className="p-2 border-r border-emerald-700/50">BOARDERS</th>
                <th className="p-2 border-r border-emerald-700/50">DAY</th>
                <th className="p-2 border-r border-emerald-700/50">BOARDERS</th>
                <th className="p-2 border-r border-emerald-700/50">DAY</th>
                <th className="p-2 border-r border-emerald-700/50 font-bold text-white bg-emerald-900/50">
                  ACTUAL
                </th>
                <th className="p-2 font-bold text-white bg-emerald-900/50">POSSIBLE</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {tableData.map((row, idx) => (
                <tr
                  key={row.classId}
                  className={`${
                    idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                  } hover:bg-emerald-50/40 transition-colors`}
                >
                  <td className="p-3 text-left font-bold text-slate-800 border-r border-slate-200">
                    <div className="flex items-center justify-between gap-2">
                      <span>{row.className}</span>
                      {row.hasSubmitted ? (
                        <span className="w-2 h-2 rounded-full bg-emerald-500" title="Submitted" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-slate-300" title="Pending" />
                      )}
                    </div>
                  </td>
                  <td className="p-2.5 text-slate-700 border-r border-slate-200">{row.girlsBoarders}</td>
                  <td className="p-2.5 text-slate-700 border-r border-slate-200">{row.girlsDay}</td>
                  <td className="p-2.5 text-slate-700 border-r border-slate-200">{row.boysBoarders}</td>
                  <td className="p-2.5 text-slate-700 border-r border-slate-200">{row.boysDay}</td>
                  <td className="p-2.5 font-bold text-emerald-800 bg-emerald-50/40 border-r border-slate-200">
                    {row.actualTotal}
                  </td>
                  <td className="p-2.5 font-semibold text-slate-600 bg-emerald-50/40 border-r border-slate-200">
                    {row.possibleTotal}
                  </td>
                  <td className="p-2.5">
                    <button
                      onClick={() => handleStartEdit(row)}
                      className="px-2.5 py-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors"
                    >
                      {row.hasSubmitted ? 'Edit' : 'Record'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>

            {/* Bottom Total Row matching image */}
            <tfoot>
              <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300 text-[12px]">
                <td className="p-3 text-left border-r border-slate-300">TOTAL</td>
                <td className="p-2.5 border-r border-slate-300">{totals.girlsBoarders}</td>
                <td className="p-2.5 border-r border-slate-300">{totals.girlsDay}</td>
                <td className="p-2.5 border-r border-slate-300">{totals.boysBoarders}</td>
                <td className="p-2.5 border-r border-slate-300">{totals.boysDay}</td>
                <td className="p-2.5 text-emerald-900 bg-emerald-100 border-r border-slate-300 font-black">
                  {totals.actual}
                </td>
                <td className="p-2.5 text-slate-800 bg-emerald-100 border-r border-slate-300 font-black">
                  {totals.possible}
                </td>
                <td className="p-2.5 text-center text-xs text-emerald-800">
                  {totalRate}% Rate
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Admin Quick Entry / Edit Modal */}
      {editingClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="bg-emerald-900 p-5 text-white">
              <h3 className="font-bold text-lg">Record / Adjust Roll Call: {editingClass}</h3>
              <p className="text-xs text-emerald-200">Date: {selectedDate}</p>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-pink-50 rounded-xl border border-pink-200 space-y-3">
                  <h4 className="text-xs font-bold text-pink-800 uppercase">Girls</h4>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Boarders</label>
                    <input
                      type="number"
                      min="0"
                      value={editGB}
                      onChange={(e) => setEditGB(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 text-sm font-bold bg-white border border-pink-300 rounded-lg text-center"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Day</label>
                    <input
                      type="number"
                      min="0"
                      value={editGD}
                      onChange={(e) => setEditGD(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 text-sm font-bold bg-white border border-pink-300 rounded-lg text-center"
                    />
                  </div>
                </div>

                <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 space-y-3">
                  <h4 className="text-xs font-bold text-blue-800 uppercase">Boys</h4>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Boarders</label>
                    <input
                      type="number"
                      min="0"
                      value={editBB}
                      onChange={(e) => setEditBB(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 text-sm font-bold bg-white border border-blue-300 rounded-lg text-center"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Day</label>
                    <input
                      type="number"
                      min="0"
                      value={editBD}
                      onChange={(e) => setEditBD(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 text-sm font-bold bg-white border border-blue-300 rounded-lg text-center"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <span className="text-xs text-slate-500">Actual Total</span>
                  <div className="text-xl font-black text-emerald-900 mt-1">
                    {editGB + editGD + editBB + editBD}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Possible Total (Class Size)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editPossible}
                    onChange={(e) => setEditPossible(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm font-bold border border-slate-300 rounded-xl"
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setEditingClass(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-md"
              >
                Save Attendance
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
