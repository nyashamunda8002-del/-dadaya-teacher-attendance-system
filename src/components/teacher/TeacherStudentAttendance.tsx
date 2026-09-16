import React, { useState, useMemo } from 'react';
import {
  Users,
  GraduationCap,
  Calendar,
  Download,
  Search,
  Plus,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { exportSingleClassAttendancePDF } from '../../utils/studentAttendancePdf';
import { StudentAttendanceRecord } from '../../types';

export const TeacherStudentAttendance: React.FC = () => {
  const {
    currentUser,
    studentAttendanceRecords,
    classes,
    selectedTeacherClass,
    setSelectedTeacherClass,
    saveStudentAttendance,
    schoolSettings,
  } = useApp();

  // If teacher has assigned classes from admin, use first as default if none selected
  const assignedClasses = currentUser?.assignedClasses || [];

  const [inputClassName, setInputClassName] = useState<string>(selectedTeacherClass || '');
  const [isChangingClass, setIsChangingClass] = useState<boolean>(!selectedTeacherClass);

  // Form state
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [girlsBoarders, setGirlsBoarders] = useState<number | ''>('');
  const [girlsDay, setGirlsDay] = useState<number | ''>('');
  const [boysBoarders, setBoysBoarders] = useState<number | ''>('');
  const [boysDay, setBoysDay] = useState<number | ''>('');
  const [possibleTotal, setPossibleTotal] = useState<number | ''>('');
  const [notes, setNotes] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Search date for history view
  const [searchDate, setSearchDate] = useState<string>('');

  // Active class name
  const currentClass = selectedTeacherClass;

  // Find class capacity from classes list if available
  const matchedSchoolClass = classes.find(
    (c) => c.name.toLowerCase().trim() === currentClass.toLowerCase().trim()
  );

  // When selected date changes or class changes, check if attendance is already recorded for that date
  const existingRecordForDate = useMemo(() => {
    if (!currentClass || !selectedDate) return null;
    return studentAttendanceRecords.find(
      (r) =>
        r.className.toLowerCase().trim() === currentClass.toLowerCase().trim() &&
        r.date === selectedDate
    );
  }, [studentAttendanceRecords, currentClass, selectedDate]);

  // Load existing values into form when switching dates or on initial load
  React.useEffect(() => {
    if (existingRecordForDate) {
      setGirlsBoarders(existingRecordForDate.girlsBoarders);
      setGirlsDay(existingRecordForDate.girlsDay);
      setBoysBoarders(existingRecordForDate.boysBoarders);
      setBoysDay(existingRecordForDate.boysDay);
      setPossibleTotal(existingRecordForDate.possibleTotal);
      setNotes(existingRecordForDate.notes || '');
    } else {
      setGirlsBoarders('');
      setGirlsDay('');
      setBoysBoarders('');
      setBoysDay('');
      setPossibleTotal(matchedSchoolClass?.capacity || 45);
      setNotes('');
    }
    setStatusMessage(null);
  }, [existingRecordForDate, selectedDate, currentClass, matchedSchoolClass]);

  // Calculations
  const numGB = Number(girlsBoarders) || 0;
  const numGD = Number(girlsDay) || 0;
  const numBB = Number(boysBoarders) || 0;
  const numBD = Number(boysDay) || 0;
  const actualTotal = numGB + numGD + numBB + numBD;
  const targetPossible = Number(possibleTotal) || actualTotal || 45;
  const attendanceRate = targetPossible > 0 ? ((actualTotal / targetPossible) * 100).toFixed(1) : '0.0';

  // Filter history for this class
  const classRecords = useMemo(() => {
    if (!currentClass) return [];
    return studentAttendanceRecords
      .filter(
        (r) => r.className.toLowerCase().trim() === currentClass.toLowerCase().trim()
      )
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [studentAttendanceRecords, currentClass]);

  const filteredHistory = useMemo(() => {
    if (!searchDate) return classRecords;
    return classRecords.filter((r) => r.date.includes(searchDate));
  }, [classRecords, searchDate]);

  // Register or Change Class
  const handleRegisterOrChangeClass = (classNameToSet: string) => {
    const clean = classNameToSet.trim();
    if (!clean) return;
    setSelectedTeacherClass(clean);
    setInputClassName(clean);
    setIsChangingClass(false);
    setStatusMessage({
      type: 'success',
      text: `Registered to manage ${clean}. You can now record daily attendance.`,
    });
  };

  // Handle Save
  const handleSaveAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentClass) {
      setStatusMessage({ type: 'error', text: 'Please enter and register a class first.' });
      return;
    }

    if (numGB < 0 || numGD < 0 || numBB < 0 || numBD < 0) {
      setStatusMessage({ type: 'error', text: 'Attendance counts cannot be negative.' });
      return;
    }

    const teacherName = currentUser ? `${currentUser.name} ${currentUser.surname}` : 'Teacher';

    const res = await saveStudentAttendance({
      className: currentClass,
      teacherId: currentUser?.id || 'tch-current',
      teacherName,
      date: selectedDate,
      girlsBoarders: numGB,
      girlsDay: numGD,
      boysBoarders: numBB,
      boysDay: numBD,
      actualTotal,
      possibleTotal: targetPossible,
      notes: notes.trim(),
    });

    if (res.success) {
      setStatusMessage({
        type: 'success',
        text: `Daily attendance for ${currentClass} on ${selectedDate} saved successfully!`,
      });
    } else {
      setStatusMessage({ type: 'error', text: res.message });
    }
  };

  // Download PDF
  const handleDownloadPDF = () => {
    if (!currentClass) return;
    exportSingleClassAttendancePDF({
      className: currentClass,
      records: classRecords,
      dateRangeText: searchDate ? `Search Date: ${searchDate}` : 'All Recorded Sessions',
      schoolSettings,
      teacherName: currentUser ? `${currentUser.name} ${currentUser.surname}` : undefined,
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Class Status */}
      <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 text-white p-6 rounded-2xl shadow-lg border border-emerald-700/50">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-700/60 rounded-xl border border-emerald-500/30">
              <GraduationCap className="w-8 h-8 text-emerald-300" />
            </div>
            <div>
              <span className="text-xs uppercase font-bold tracking-widest text-emerald-300">
                Teacher Section • Student Attendance
              </span>
              <h2 className="text-2xl font-bold">
                {currentClass ? `Class: ${currentClass}` : 'Register Class Attendance'}
              </h2>
              <p className="text-xs text-emerald-100/80 mt-0.5">
                Record daily numbers of Boys & Girls (Boarders & Day Scholars), search by date, and download MoPSE PDF registers.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {currentClass && (
              <button
                onClick={() => setIsChangingClass(true)}
                className="flex items-center gap-2 px-3.5 py-2 bg-emerald-700/70 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold border border-emerald-500/40 transition-colors shadow-xs"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Change Class</span>
              </button>
            )}

            {classRecords.length > 0 && (
              <button
                onClick={handleDownloadPDF}
                className="flex items-center gap-2 px-4 py-2 bg-white text-emerald-900 hover:bg-emerald-50 rounded-xl text-xs font-bold transition-all shadow-md"
              >
                <Download className="w-4 h-4 text-emerald-700" />
                <span>Download PDF Register</span>
              </button>
            )}
          </div>
        </div>

        {/* Assigned Classes Quick Picker Chips */}
        {assignedClasses.length > 0 && (
          <div className="mt-4 pt-4 border-t border-emerald-700/40 flex flex-wrap items-center gap-2">
            <span className="text-xs text-emerald-200 font-medium">Allocated to you:</span>
            {assignedClasses.map((clsName) => (
              <button
                key={clsName}
                onClick={() => handleRegisterOrChangeClass(clsName)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  currentClass.toLowerCase() === clsName.toLowerCase()
                    ? 'bg-emerald-400 text-emerald-950 shadow-sm'
                    : 'bg-emerald-900/80 text-emerald-200 hover:bg-emerald-700 border border-emerald-600/40'
                }`}
              >
                {clsName}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 2. Class Selection / Change Modal Card */}
      {(!currentClass || isChangingClass) && (
        <div className="bg-white border-2 border-emerald-400/50 p-6 rounded-2xl shadow-md animate-in fade-in duration-200">
          <div className="flex items-center gap-3 mb-4">
            <Layers className="w-5 h-5 text-emerald-700" />
            <div>
              <h3 className="font-bold text-slate-800 text-base">
                {currentClass ? 'Switch or Change Class' : 'Register Class to Manage'}
              </h3>
              <p className="text-xs text-slate-500">
                Enter your class name (e.g., Form 1A, Form 3 Science, Lower 6 Arts) or choose from school classes.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Enter class name (e.g. Form 3 Science, Form 1B)..."
                value={inputClassName}
                onChange={(e) => setInputClassName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRegisterOrChangeClass(inputClassName);
                }}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              />
            </div>

            <button
              onClick={() => handleRegisterOrChangeClass(inputClassName)}
              disabled={!inputClassName.trim()}
              className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-md transition-all whitespace-nowrap"
            >
              {currentClass ? 'Update Class' : 'Register Class'}
            </button>

            {currentClass && (
              <button
                onClick={() => setIsChangingClass(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium text-sm transition-colors"
              >
                Cancel
              </button>
            )}
          </div>

          {/* Quick suggestions from school classes */}
          <div className="mt-4 pt-3 border-t border-slate-100">
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">
              Popular Dadaya High School Classes:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {classes.slice(0, 10).map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setInputClassName(c.name);
                    handleRegisterOrChangeClass(c.name);
                  }}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-100 hover:text-emerald-800 text-slate-700 rounded-lg text-xs font-medium transition-colors"
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. Daily Attendance Registration Form */}
      {currentClass && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                Daily Attendance Entry
              </span>
              <h3 className="text-lg font-bold text-slate-900">
                Record Roll Call for {currentClass}
              </h3>
            </div>

            {/* Date Selector */}
            <div className="flex items-center gap-2">
              <label htmlFor="reg-date" className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                <span>Attendance Date:</span>
              </label>
              <input
                id="reg-date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {selectedDate !== todayStr && (
                <button
                  onClick={() => setSelectedDate(todayStr)}
                  className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-md text-xs font-bold hover:bg-emerald-200"
                >
                  Today
                </button>
              )}
            </div>
          </div>

          <form onSubmit={handleSaveAttendance} className="p-6 space-y-6">
            {/* Status notification */}
            {statusMessage && (
              <div
                className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  statusMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {statusMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{statusMessage.text}</span>
              </div>
            )}

            {existingRecordForDate && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>
                    Existing attendance record loaded for {selectedDate} (by {existingRecordForDate.teacherName}). Editing will update this entry.
                  </span>
                </div>
              </div>
            )}

            {/* Attendance Category Inputs (Matching Picture: GIRLS Boarders/Day, BOYS Boarders/Day) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* GIRLS SECTION */}
              <div className="p-5 bg-pink-50/50 rounded-2xl border border-pink-200/80 space-y-4">
                <div className="flex items-center justify-between border-b border-pink-200/60 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-pink-500" />
                    <h4 className="font-bold text-slate-800 text-sm">GIRLS ENROLLMENT</h4>
                  </div>
                  <span className="text-xs font-bold text-pink-700 bg-pink-100 px-2.5 py-0.5 rounded-full">
                    Total Girls: {numGB + numGD}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Boarders
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="0"
                      value={girlsBoarders}
                      onChange={(e) =>
                        setGirlsBoarders(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))
                      }
                      className="w-full px-3.5 py-2.5 bg-white border border-pink-300 rounded-xl text-base font-bold text-slate-800 text-center focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Day Scholars
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="0"
                      value={girlsDay}
                      onChange={(e) =>
                        setGirlsDay(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))
                      }
                      className="w-full px-3.5 py-2.5 bg-white border border-pink-300 rounded-xl text-base font-bold text-slate-800 text-center focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>
                </div>
              </div>

              {/* BOYS SECTION */}
              <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-200/80 space-y-4">
                <div className="flex items-center justify-between border-b border-blue-200/60 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <h4 className="font-bold text-slate-800 text-sm">BOYS ENROLLMENT</h4>
                  </div>
                  <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full">
                    Total Boys: {numBB + numBD}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Boarders
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="0"
                      value={boysBoarders}
                      onChange={(e) =>
                        setBoysBoarders(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))
                      }
                      className="w-full px-3.5 py-2.5 bg-white border border-blue-300 rounded-xl text-base font-bold text-slate-800 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Day Scholars
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="0"
                      value={boysDay}
                      onChange={(e) =>
                        setBoysDay(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))
                      }
                      className="w-full px-3.5 py-2.5 bg-white border border-blue-300 rounded-xl text-base font-bold text-slate-800 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Live Totals & Possible Card (MoPSE Total: Actual & Possible) */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div className="p-3 bg-white rounded-xl border border-slate-200/80">
                  <span className="text-xs text-slate-500 font-medium">Total Boarders</span>
                  <div className="text-lg font-black text-slate-800 mt-1">{numGB + numBB}</div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200/80">
                  <span className="text-xs text-slate-500 font-medium">Total Day Scholars</span>
                  <div className="text-lg font-black text-slate-800 mt-1">{numGD + numBD}</div>
                </div>

                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <span className="text-xs text-emerald-700 font-bold uppercase tracking-wider">
                    Actual Present
                  </span>
                  <div className="text-2xl font-black text-emerald-900 mt-0.5">{actualTotal}</div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200/80 text-left">
                  <label className="text-xs text-slate-600 font-semibold block mb-1">
                    Possible Total (Class Size)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    placeholder="45"
                    value={possibleTotal}
                    onChange={(e) =>
                      setPossibleTotal(e.target.value === '' ? '' : parseInt(e.target.value) || 0)
                    }
                    className="w-full px-2.5 py-1 text-sm font-bold text-slate-900 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <div className="text-[10px] text-emerald-700 font-bold mt-1">
                    Attendance Rate: {attendanceRate}%
                  </div>
                </div>
              </div>
            </div>

            {/* Notes / Remarks */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Remarks / Reasons for Absences (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. 2 day scholars absent due to heavy rains; 1 boarder in clinic..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="submit"
                className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{existingRecordForDate ? 'Update Daily Attendance' : 'Save Daily Attendance'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 4. Search and History Section */}
      {currentClass && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Attendance Register History ({currentClass})
              </h3>
              <p className="text-xs text-slate-500">
                Search recorded daily attendance by date, view breakdown, or download PDF.
              </p>
            </div>

            {/* Search by date */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="date"
                  value={searchDate}
                  onChange={(e) => setSearchDate(e.target.value)}
                  className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {searchDate && (
                <button
                  onClick={() => setSearchDate('')}
                  className="px-2.5 py-1 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {filteredHistory.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No attendance records found</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {searchDate
                  ? `No attendance logged for ${searchDate}. Try clearing the date search.`
                  : `Start by recording today's roll call above.`}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">DATE</th>
                    <th className="p-3 text-center" colSpan={2}>
                      GIRLS (B / D)
                    </th>
                    <th className="p-3 text-center" colSpan={2}>
                      BOYS (B / D)
                    </th>
                    <th className="p-3 text-center">ACTUAL</th>
                    <th className="p-3 text-center">POSSIBLE</th>
                    <th className="p-3 text-center">RATE</th>
                    <th className="p-3">REMARKS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredHistory.map((rec) => {
                    const rate =
                      rec.possibleTotal > 0
                        ? ((rec.actualTotal / rec.possibleTotal) * 100).toFixed(0) + '%'
                        : '-';
                    return (
                      <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 font-semibold text-slate-800 whitespace-nowrap">
                          {rec.date}
                        </td>
                        <td className="p-3 text-center text-pink-700 font-bold">
                          {rec.girlsBoarders} <span className="text-slate-400 font-normal">/</span> {rec.girlsDay}
                        </td>
                        <td className="p-3 text-center" />
                        <td className="p-3 text-center text-blue-700 font-bold">
                          {rec.boysBoarders} <span className="text-slate-400 font-normal">/</span> {rec.boysDay}
                        </td>
                        <td className="p-3 text-center" />
                        <td className="p-3 text-center font-bold text-emerald-800">
                          {rec.actualTotal}
                        </td>
                        <td className="p-3 text-center font-medium text-slate-600">
                          {rec.possibleTotal}
                        </td>
                        <td className="p-3 text-center">
                          <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-emerald-100 text-emerald-800">
                            {rate}
                          </span>
                        </td>
                        <td className="p-3 text-slate-500 max-w-[180px] truncate">
                          {rec.notes || '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
