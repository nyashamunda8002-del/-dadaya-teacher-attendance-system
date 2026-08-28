import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  CalendarDays,
  Download,
  Printer,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Building2,
  UserCheck,
  TrendingUp,
  Award,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SchoolCrest } from '../common/SchoolCrest';
import {
  getStandardSchoolTerms,
  getZimbabwePublicHolidays,
  SchoolTerm,
} from '../../utils/zimbabweCalendar';
import {
  exportTermlyAttendancePDF,
  exportToAccessAndExcelCSV,
  TermAttendanceSummary,
} from '../../utils/reportExport';
import { triggerHaptic } from '../../utils/haptics';

export const TermlyReportsView: React.FC = () => {
  const { currentUser, users, attendanceRecords, schoolSettings } = useApp();
  const isAdmin = currentUser?.role === 'admin';

  const [selectedTermKey, setSelectedTermKey] = useState<'Term 1' | 'Term 2' | 'Term 3' | 'Full Year'>('Term 1');
  const [selectedYear, setSelectedYear] = useState<number>(Number(schoolSettings.academicYear) || 2026);

  const availableTerms = useMemo(() => getStandardSchoolTerms(selectedYear), [selectedYear]);

  // Current active term configuration
  const currentTermConfig: SchoolTerm = useMemo(() => {
    if (selectedTermKey === 'Full Year') {
      return {
        term: 'Full Year',
        name: `Full Academic Year (${selectedYear})`,
        startDate: `${selectedYear}-01-13`,
        endDate: `${selectedYear}-12-04`,
        year: selectedYear,
        description: 'Complete academic session including Terms 1, 2, and 3.',
      };
    }
    const found = availableTerms.find((t) => t.term === selectedTermKey);
    return (
      found || {
        term: selectedTermKey,
        name: `${selectedTermKey} (${selectedYear})`,
        startDate: schoolSettings.termStartDate || `${selectedYear}-01-13`,
        endDate: schoolSettings.termEndDate || `${selectedYear}-04-10`,
        year: selectedYear,
        description: schoolSettings.termNotes || 'Official academic term session',
      }
    );
  }, [selectedTermKey, selectedYear, availableTerms, schoolSettings]);

  // Holidays falling within this term
  const termHolidays = useMemo(() => {
    const allHolidays = getZimbabwePublicHolidays(selectedYear);
    return allHolidays.filter((h) => h.date >= currentTermConfig.startDate && h.date <= currentTermConfig.endDate);
  }, [selectedYear, currentTermConfig]);

  // Attendance records falling within this term date range
  const termRecords = useMemo(() => {
    return attendanceRecords.filter(
      (r) => r.date >= currentTermConfig.startDate && r.date <= currentTermConfig.endDate
    );
  }, [attendanceRecords, currentTermConfig]);

  // Teacher specific records or all records for admin
  const userTermRecords = useMemo(() => {
    if (isAdmin) return termRecords;
    return termRecords.filter((r) => r.userId === currentUser?.id);
  }, [isAdmin, termRecords, currentUser]);

  // Registered Teachers
  const teachersList = useMemo(() => users.filter((u) => u.role === 'teacher'), [users]);

  // Compute school days in term (approx 60-65 working days per term in Zim)
  const totalSchoolDays = useMemo(() => {
    const start = new Date(currentTermConfig.startDate);
    const end = new Date(currentTermConfig.endDate);
    let count = 0;
    const cur = new Date(start);
    while (cur <= end) {
      const day = cur.getDay();
      if (day >= 1 && day <= 5) {
        // Exclude holidays
        const curIso = cur.toISOString().split('T')[0];
        const isHol = termHolidays.some((h) => h.date === curIso);
        if (!isHol) count++;
      }
      cur.setDate(cur.getDate() + 1);
    }
    return Math.max(count, selectedTermKey === 'Full Year' ? 180 : 60);
  }, [currentTermConfig, termHolidays, selectedTermKey]);

  // Summary Metrics Computation
  const termSummary: TermAttendanceSummary = useMemo(() => {
    const presentDays = userTermRecords.filter(
      (r) => r.status === 'present' || r.status === 'early_departure'
    ).length;
    const lateDays = userTermRecords.filter((r) => r.status === 'late').length;
    const earlyDepartureDays = userTermRecords.filter((r) => r.status === 'early_departure').length;
    const totalWorkingMins = userTermRecords.reduce((acc, r) => acc + (r.totalWorkingMinutes || 0), 0);
    const totalHoursWorked = totalWorkingMins / 60;

    const loggedCount = userTermRecords.length;
    const punctualityRate = loggedCount > 0 ? Math.round((presentDays / loggedCount) * 100) : 100;
    const attendanceRate = totalSchoolDays > 0 ? Math.min(100, Math.round((loggedCount / totalSchoolDays) * 100)) : 100;
    const absentDays = Math.max(0, totalSchoolDays - loggedCount);

    // Per-teacher breakdown for Admin view
    const teacherSummaries = teachersList.map((t) => {
      const tRecs = termRecords.filter((r) => r.userId === t.id);
      const tPresent = tRecs.filter((r) => r.status === 'present' || r.status === 'early_departure').length;
      const tLate = tRecs.filter((r) => r.status === 'late').length;
      const tHours = tRecs.reduce((acc, r) => acc + (r.totalWorkingMinutes || 0), 0) / 60;
      const tRate = totalSchoolDays > 0 ? Math.min(100, Math.round((tRecs.length / totalSchoolDays) * 100)) : 0;
      const tAbsent = Math.max(0, totalSchoolDays - tRecs.length);

      return {
        userId: t.id,
        teacherName: t.name,
        teacherSurname: t.surname,
        ecNumber: t.ecNumber || t.employeeId || 'DHS-T001',
        subject: t.subject || t.department || 'Faculty',
        present: tPresent,
        late: tLate,
        absent: tAbsent,
        rate: tRate,
        hours: tHours,
      };
    });

    return {
      termName: currentTermConfig.term,
      startDate: currentTermConfig.startDate,
      endDate: currentTermConfig.endDate,
      academicYear: String(selectedYear),
      totalSchoolDays,
      recordsCount: loggedCount,
      presentDays,
      lateDays,
      earlyDepartureDays,
      absentDays,
      attendanceRate,
      punctualityRate,
      totalHoursWorked,
      teacherSummaries,
    };
  }, [userTermRecords, totalSchoolDays, teachersList, termRecords, currentTermConfig, selectedYear]);

  // Export handlers
  const handleDownloadPDF = () => {
    triggerHaptic('light');
    exportTermlyAttendancePDF(termSummary, schoolSettings, currentUser);
  };

  const handleDownloadCSV = () => {
    triggerHaptic('light');
    if (!isAdmin) {
      // Teacher CSV export
      const headers = ['Term', 'Date', 'Teacher', 'EC Number', 'Subject', 'Clock In', 'Clock Out', 'Duration (Mins)', 'Status', 'Reason'];
      const rows = userTermRecords.map((r) => [
        currentTermConfig.term,
        r.date,
        `${currentUser?.name} ${currentUser?.surname}`,
        currentUser?.ecNumber || currentUser?.employeeId || 'DHS-T001',
        currentUser?.subject || 'Faculty',
        r.clockInTime || 'N/A',
        r.clockOutTime || 'N/A',
        r.totalWorkingMinutes || 0,
        r.status,
        r.earlyClockInReason || r.earlyClockOutReason || '',
      ]);
      exportToAccessAndExcelCSV(
        headers,
        rows,
        `Dadaya_Term_${currentTermConfig.term}_${currentUser?.surname}_${selectedYear}.csv`
      );
    } else {
      // Admin Master Term CSV export
      const headers = [
        'Academic Term',
        'Year',
        'EC Number',
        'Teacher Full Name',
        'Department / Subject',
        'Term School Days',
        'Present Days',
        'Late Days',
        'Absent / Leave Days',
        'Total Hours Worked',
        'Attendance Rate %',
      ];
      const rows = (termSummary.teacherSummaries || []).map((t) => [
        currentTermConfig.term,
        selectedYear,
        t.ecNumber,
        `${t.teacherName} ${t.teacherSurname}`,
        t.subject,
        termSummary.totalSchoolDays,
        t.present,
        t.late,
        t.absent,
        t.hours.toFixed(1),
        `${t.rate}%`,
      ]);
      exportToAccessAndExcelCSV(
        headers,
        rows,
        `Dadaya_Institutional_Term_${currentTermConfig.term}_Master_${selectedYear}.csv`
      );
    }
  };

  const handlePrint = () => {
    triggerHaptic('light');
    window.print();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <SchoolCrest size="md" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  Academic Termly Reports
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  MoPSE Zimbabwe Calendar
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {isAdmin
                  ? `Comprehensive institutional term evaluations and faculty compliance ledgers`
                  : `Personal term dossier and official MoPSE attendance record for ${currentUser?.name} ${currentUser?.surname}`}
              </p>
            </div>
          </div>

          {/* Download & Export Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleDownloadCSV}
              className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl shadow-2xs flex items-center gap-1.5 transition cursor-pointer"
              title="Export as Microsoft Access and Excel compatible CSV"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              <span>Export CSV / Access</span>
            </button>

            <button
              onClick={handleDownloadPDF}
              className={`px-4 py-2 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition cursor-pointer ${
                isAdmin ? 'bg-blue-800 hover:bg-blue-900' : 'bg-emerald-700 hover:bg-emerald-800'
              }`}
            >
              <Download className="w-4 h-4" />
              <span>Download Official PDF</span>
            </button>

            <button
              onClick={handlePrint}
              className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              title="Print Termly Report"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Term & Year Filter Selector Tabs */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl">
            {(['Term 1', 'Term 2', 'Term 3', 'Full Year'] as const).map((tKey) => {
              const isActive = selectedTermKey === tKey;
              return (
                <button
                  key={tKey}
                  onClick={() => {
                    triggerHaptic('selection');
                    setSelectedTermKey(tKey);
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition ${
                    isActive
                      ? isAdmin
                        ? 'bg-blue-800 text-white shadow-xs'
                        : 'bg-emerald-800 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  {tKey}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Academic Year:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value={2026}>2026</option>
              <option value={2025}>2025</option>
              <option value={2027}>2027</option>
            </select>
          </div>
        </div>
      </div>

      {/* Term Details & Holiday Notice Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                {currentTermConfig.name}
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-2">
                Official Term Session Period
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {currentTermConfig.description}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono font-bold text-slate-900">
                {currentTermConfig.startDate} → {currentTermConfig.endDate}
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {termSummary.totalSchoolDays} Required School Days
              </p>
            </div>
          </div>

          {/* Holidays within this term */}
          {termHolidays.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-100">
              <p className="text-[11px] font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Zimbabwe Public Holidays in this Term (No Clocking Required):</span>
              </p>
              <div className="flex flex-wrap gap-1.5">
                {termHolidays.map((h) => (
                  <span
                    key={h.date}
                    className="px-2.5 py-0.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[10px] font-bold"
                    title={h.description}
                  >
                    🇿🇼 {h.name} ({h.date})
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Punctuality Grade Card */}
        <div className="bg-gradient-to-br from-emerald-800 to-teal-900 text-white rounded-3xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-200 uppercase tracking-wide">
              {isAdmin ? 'Institutional Compliance' : 'Punctuality Grade'}
            </span>
            <Award className="w-5 h-5 text-amber-300" />
          </div>

          <div className="my-2">
            <div className="text-3xl font-black text-white font-mono">
              {termSummary.punctualityRate}%
            </div>
            <p className="text-xs text-emerald-100 mt-0.5 font-medium">
              {termSummary.punctualityRate >= 90
                ? 'Exemplary Standing (Grade A)'
                : termSummary.punctualityRate >= 75
                ? 'Satisfactory Attendance (Grade B)'
                : 'Attention Required'}
            </p>
          </div>

          <div className="text-[11px] text-emerald-200/80 pt-2 border-t border-emerald-700/50 flex justify-between">
            <span>Total Hours:</span>
            <span className="font-mono font-bold text-white">{termSummary.totalHoursWorked.toFixed(1)} hrs</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase">Term School Days</span>
            <CalendarDays className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {termSummary.totalSchoolDays}
          </div>
          <span className="text-[10px] text-slate-500">Official sessions</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase">Days Present</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 font-mono">
            {termSummary.presentDays}
          </div>
          <span className="text-[10px] text-emerald-700 font-semibold">
            On-time attendance
          </span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase">Late Clock-Ins</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-700 font-mono">
            {termSummary.lateDays}
          </div>
          <span className="text-[10px] text-amber-700 font-semibold">After 07:45 threshold</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase">Total Hours</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-800 font-mono">
            {termSummary.totalHoursWorked.toFixed(0)}h
          </div>
          <span className="text-[10px] text-blue-700 font-semibold">Instruction & duty</span>
        </div>
      </div>

      {/* Main Term Table Section */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {isAdmin ? 'Staff Faculty Term Attendance Roster' : 'Term Daily Attendance Logs'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {isAdmin
                ? `Performance and punctuality audit for all ${teachersList.length} faculty members`
                : `Official logs recorded during ${currentTermConfig.name}`}
            </p>
          </div>

          <span className="text-xs font-mono text-slate-500 bg-slate-100 px-3 py-1 rounded-xl">
            {isAdmin ? `${teachersList.length} Teachers` : `${userTermRecords.length} Logged Entries`}
          </span>
        </div>

        {isAdmin ? (
          /* Admin View: Teacher Summary Table */
          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] text-slate-600 uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3">EC Number</th>
                  <th className="p-3">Teacher Name</th>
                  <th className="p-3">Department / Subject</th>
                  <th className="p-3 text-center">Present</th>
                  <th className="p-3 text-center">Late</th>
                  <th className="p-3 text-center">Absent</th>
                  <th className="p-3 text-center">Total Hours</th>
                  <th className="p-3 text-right">Attendance Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(termSummary.teacherSummaries || []).length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-slate-500">
                      No teacher records found for this term.
                    </td>
                  </tr>
                ) : (
                  (termSummary.teacherSummaries || []).map((t) => (
                    <tr key={t.userId} className="hover:bg-slate-50/70 transition">
                      <td className="p-3 font-mono font-bold text-slate-700">{t.ecNumber}</td>
                      <td className="p-3 font-bold text-slate-900">
                        {t.teacherName} {t.teacherSurname}
                      </td>
                      <td className="p-3 text-slate-600">{t.subject}</td>
                      <td className="p-3 text-center font-bold text-emerald-700">{t.present} d</td>
                      <td className="p-3 text-center font-bold text-amber-700">{t.late} d</td>
                      <td className="p-3 text-center font-bold text-slate-500">{t.absent} d</td>
                      <td className="p-3 text-center font-mono font-medium">{t.hours.toFixed(1)} h</td>
                      <td className="p-3 text-right">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                            t.rate >= 90
                              ? 'bg-emerald-100 text-emerald-800'
                              : t.rate >= 75
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {t.rate}%
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* Teacher View: Individual Daily Logs */
          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] text-slate-600 uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Clock In</th>
                  <th className="p-3">Clock Out</th>
                  <th className="p-3">Duration</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Campus Geofence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {userTermRecords.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-500">
                      No attendance logged for {currentTermConfig.name} yet.
                    </td>
                  </tr>
                ) : (
                  userTermRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/70 transition">
                      <td className="p-3 font-semibold text-slate-900">{r.date}</td>
                      <td className="p-3 font-mono font-bold text-emerald-800">{r.clockInTime || '--'}</td>
                      <td className="p-3 font-mono font-bold text-rose-800">{r.clockOutTime || '--'}</td>
                      <td className="p-3 font-mono">
                        {r.totalWorkingMinutes
                          ? `${Math.floor(r.totalWorkingMinutes / 60)}h ${r.totalWorkingMinutes % 60}m`
                          : '--'}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            r.status === 'present'
                              ? 'bg-emerald-100 text-emerald-800'
                              : r.status === 'late'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="p-3 text-[11px] text-slate-500">
                        {r.locationVerified ? '✓ Within 100m Campus' : 'Standard Log'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
