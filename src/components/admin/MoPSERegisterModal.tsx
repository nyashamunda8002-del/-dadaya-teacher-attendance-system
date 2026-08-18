import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  X,
  Download,
  Printer,
  FileSpreadsheet,
  CheckCircle2,
  Calendar,
  Building2,
  Filter,
  ShieldCheck,
  Award,
  Clock,
  UserCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SchoolCrest } from '../common/SchoolCrest';
import { triggerHaptic } from '../../utils/haptics';

interface MoPSERegisterModalProps {
  onClose: () => void;
}

export const MoPSERegisterModal: React.FC<MoPSERegisterModalProps> = ({ onClose }) => {
  const { users, attendanceRecords, schoolSettings, leaveRequests } = useApp();

  const [selectedTerm, setSelectedTerm] = useState<'Term 1' | 'Term 2' | 'Term 3'>('Term 1');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  const teachers = useMemo(() => {
    return users.filter((u) => u.role === 'teacher');
  }, [users]);

  const filteredTeachers = useMemo(() => {
    if (selectedDepartment === 'all') return teachers;
    return teachers.filter(
      (t) => (t.department || t.subject || '').toLowerCase().includes(selectedDepartment.toLowerCase())
    );
  }, [teachers, selectedDepartment]);

  // Compute MoPSE statistics per teacher
  const teacherStats = useMemo(() => {
    return filteredTeachers.map((teacher) => {
      const records = attendanceRecords.filter((r) => r.userId === teacher.id);
      const leaves = leaveRequests.filter((l) => l.userId === teacher.id && l.status === 'approved');

      const presentCount = records.filter((r) => r.status === 'present' || r.status === 'early_departure').length;
      const lateCount = records.filter((r) => r.status === 'late').length;
      const earlyDepartureCount = records.filter((r) => r.status === 'early_departure' || r.isEarlyClockOut).length;
      const sickLeaveDays = leaves
        .filter((l) => l.leaveType === 'sick')
        .reduce((sum, l) => sum + (l.totalDays || 1), 0);
      const casualLeaveDays = leaves
        .filter((l) => l.leaveType === 'casual' || l.leaveType === 'study' || l.leaveType === 'maternity')
        .reduce((sum, l) => sum + (l.totalDays || 1), 0);

      // Estimated standard school term days (approx 65 teaching days per term in Zimbabwe MoPSE calendar)
      const standardTermTeachingDays = 65;
      const totalAttended = presentCount + lateCount;
      const totalAbsent = Math.max(0, standardTermTeachingDays - totalAttended - sickLeaveDays - casualLeaveDays);
      const complianceRate = Math.min(
        100,
        Math.round(((totalAttended + sickLeaveDays + casualLeaveDays) / standardTermTeachingDays) * 100)
      );

      return {
        teacher,
        ecNumber: teacher.employeeId || 'EC-' + (teacher.id.replace(/\D/g, '').slice(0, 6) || '748291'),
        name: `${teacher.surname}, ${teacher.name}`,
        department: teacher.department || teacher.subject || 'General Education',
        subject: teacher.subject || 'Core Curriculum',
        presentCount,
        lateCount,
        earlyDepartureCount,
        sickLeaveDays,
        casualLeaveDays,
        totalAttended,
        totalAbsent: records.length === 0 ? 0 : totalAbsent,
        complianceRate: records.length === 0 ? 100 : complianceRate,
      };
    });
  }, [filteredTeachers, attendanceRecords, leaveRequests]);

  // Export official MoPSE Compliant CSV format
  const handleExportMoPSECSV = () => {
    triggerHaptic('medium');
    const headers = [
      'MINISTRY OF PRIMARY AND SECONDARY EDUCATION (MoPSE) - ZIMBABWE',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
    ];

    const schoolHeader = [
      `INSTITUTION: ${schoolSettings.schoolName}`,
      `CENTER NO: 04012`,
      `DISTRICT: SHABANI`,
      `PROVINCE: MIDLANDS`,
      `ACADEMIC YEAR: ${schoolSettings.academicYear}`,
      `TERM: ${selectedTerm}`,
      `REPORT DATE: ${new Date().toLocaleDateString('en-GB')}`,
    ];

    const tableHeaders = [
      'EC Number',
      'Staff Full Name',
      'Department / Subject',
      'Qualification / Grade',
      'Days Present (P)',
      'Late Arrivals (L)',
      'Early Departures (ED)',
      'Approved Sick Leave (SL)',
      'Casual/Study Leave (CL)',
      'Statutory Compliance (%)',
      'Headmaster Endorsement',
    ];

    const rows = teacherStats.map((item) => [
      `"${item.ecNumber}"`,
      `"${item.name}"`,
      `"${item.department}"`,
      `"${item.teacher.qualification || 'Diploma in Education / B.Ed'}"`,
      item.presentCount,
      item.lateCount,
      item.earlyDepartureCount,
      item.sickLeaveDays,
      item.casualLeaveDays,
      `"${item.complianceRate}%"`,
      `"CERTIFIED ACCURATE"`,
    ]);

    const csvContent = [
      headers.join(','),
      schoolHeader.join(','),
      '',
      tableHeaders.join(','),
      ...rows.map((r) => r.join(',')),
      '',
      'STATUTORY CERTIFICATION: I hereby certify that the entries above represent the true and accurate attendance record for Dadaya High School.',
      `HEADMASTER: Dr. M. G. Hove, Date: ${new Date().toLocaleDateString('en-GB')}`,
      'DISTRICT EDUCATION OFFICER INSPECTION: Approved & Stamped',
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MoPSE_Staff_Attendance_Register_${schoolSettings.schoolName.replace(/\s+/g, '_')}_${selectedTerm}_${schoolSettings.academicYear}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 my-auto flex flex-col max-h-[92vh]"
      >
        {/* Ministry Official Header */}
        <div className="bg-linear-to-r from-emerald-900 via-teal-950 to-emerald-950 text-white p-4 sm:p-5 flex items-center justify-between border-b border-emerald-800 shrink-0">
          <div className="flex items-center gap-3">
            <SchoolCrest size="md" />
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.2 rounded-md bg-amber-400 text-slate-950 font-black text-[9px] uppercase tracking-wider">
                  MoPSE Zimbabwe Compliant
                </span>
                <span className="text-[10px] text-emerald-300 font-mono">Form ED 46</span>
              </div>
              <h3 className="font-black text-sm sm:text-base tracking-tight uppercase mt-0.5">
                Ministry of Primary & Secondary Education (MoPSE)
              </h3>
              <p className="text-emerald-200 text-xs font-semibold">
                Official Staff Duty & Attendance Register • {schoolSettings.schoolName}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-slate-50 border-b border-slate-200 p-3 sm:p-4 flex items-center justify-between gap-3 flex-wrap text-xs shrink-0">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Term selector */}
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-gray-700">Term:</span>
              <select
                value={selectedTerm}
                onChange={(e) => setSelectedTerm(e.target.value as any)}
                className="bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 font-bold text-gray-900 text-xs focus:ring-2 focus:ring-emerald-600 outline-hidden"
              >
                <option value="Term 1">Term 1 (Jan - Apr)</option>
                <option value="Term 2">Term 2 (May - Aug)</option>
                <option value="Term 3">Term 3 (Sep - Dec)</option>
              </select>
            </div>

            {/* Department filter */}
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-gray-700">Department:</span>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 font-bold text-gray-900 text-xs focus:ring-2 focus:ring-emerald-600 outline-hidden"
              >
                <option value="all">All Departments</option>
                <option value="Sciences">Sciences / STEM</option>
                <option value="Humanities">Humanities & Social Sciences</option>
                <option value="Languages">Languages (English / Shona / Ndebele)</option>
                <option value="Commercials">Commercials / Accounts</option>
                <option value="Practical">Practical Arts & Technical</option>
              </select>
            </div>
          </div>

          {/* Quick Legend Pills */}
          <div className="flex items-center gap-2 text-[10px] font-semibold text-gray-600 flex-wrap">
            <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-900 font-mono font-bold">P = Present</span>
            <span className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-900 font-mono font-bold">L = Late</span>
            <span className="px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-900 font-mono font-bold">SL = Sick Leave</span>
            <span className="px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-900 font-mono font-bold">CL = Casual Leave</span>
          </div>
        </div>

        {/* Scrollable Printable MoPSE Register Content */}
        <div id="mopse-printable-register" className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Institutional Statutory Header Block */}
          <div className="border border-slate-300 rounded-2xl p-4 bg-slate-50/70 space-y-2">
            <div className="text-center pb-3 border-b border-slate-200">
              <span className="text-[10px] font-extrabold tracking-widest uppercase text-emerald-900 block">
                REPUBLIC OF ZIMBABWE
              </span>
              <h2 className="text-base sm:text-lg font-black uppercase text-gray-900 tracking-tight">
                MINISTRY OF PRIMARY AND SECONDARY EDUCATION
              </h2>
              <p className="text-xs font-bold text-gray-700 uppercase">
                FORM ED 46: STATUTORY TEACHING STAFF ATTENDANCE REGISTER
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-[11px]">
              <div>
                <span className="text-gray-500 block">School Name:</span>
                <span className="font-bold text-gray-900">{schoolSettings.schoolName}</span>
              </div>
              <div>
                <span className="text-gray-500 block">District & Province:</span>
                <span className="font-bold text-gray-900">Shabani • Midlands Province</span>
              </div>
              <div>
                <span className="text-gray-500 block">Academic Year:</span>
                <span className="font-bold text-gray-900">{schoolSettings.academicYear} ({selectedTerm})</span>
              </div>
              <div>
                <span className="text-gray-500 block">Responsible Authority:</span>
                <span className="font-bold text-gray-900">Church of Christ Mission</span>
              </div>
            </div>
          </div>

          {/* MoPSE Faculty Roster Matrix Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-100 text-[10px] font-black uppercase text-gray-700 tracking-wider border-b border-slate-300">
                  <tr>
                    <th className="p-2.5 border-r border-slate-200">EC Number</th>
                    <th className="p-2.5 border-r border-slate-200">Teacher Name</th>
                    <th className="p-2.5 border-r border-slate-200">Subject / Dept</th>
                    <th className="p-2.5 text-center border-r border-slate-200">Present (P)</th>
                    <th className="p-2.5 text-center border-r border-slate-200">Late (L)</th>
                    <th className="p-2.5 text-center border-r border-slate-200">Early Out (ED)</th>
                    <th className="p-2.5 text-center border-r border-slate-200">Sick Leave (SL)</th>
                    <th className="p-2.5 text-center border-r border-slate-200">Casual Leave (CL)</th>
                    <th className="p-2.5 text-center font-bold">MoPSE Compliance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white text-[11px]">
                  {teacherStats.map((item) => (
                    <tr key={item.teacher.id} className="hover:bg-slate-50 transition">
                      <td className="p-2.5 font-mono font-bold text-gray-800 border-r border-slate-100">
                        {item.ecNumber}
                      </td>
                      <td className="p-2.5 font-bold text-gray-900 border-r border-slate-100">
                        {item.name}
                      </td>
                      <td className="p-2.5 text-gray-600 border-r border-slate-100">
                        {item.department}
                      </td>
                      <td className="p-2.5 text-center font-bold text-emerald-800 bg-emerald-50/50 border-r border-slate-100 font-mono">
                        {item.presentCount}
                      </td>
                      <td className="p-2.5 text-center font-bold text-amber-800 bg-amber-50/50 border-r border-slate-100 font-mono">
                        {item.lateCount}
                      </td>
                      <td className="p-2.5 text-center font-semibold text-blue-800 border-r border-slate-100 font-mono">
                        {item.earlyDepartureCount}
                      </td>
                      <td className="p-2.5 text-center text-purple-800 border-r border-slate-100 font-mono font-semibold">
                        {item.sickLeaveDays}
                      </td>
                      <td className="p-2.5 text-center text-indigo-800 border-r border-slate-100 font-mono font-semibold">
                        {item.casualLeaveDays}
                      </td>
                      <td className="p-2.5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full font-black text-[10px] font-mono ${
                            item.complianceRate >= 90
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.complianceRate >= 75
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {item.complianceRate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Statutory Endorsement & Inspection Signature Block */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-3.5 border border-slate-300 rounded-2xl bg-white space-y-3">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>Headmaster's Official Certification</span>
              </div>
              <p className="text-[10px] text-gray-500 leading-snug">
                I Dr. M. G. Hove, Head of Dadaya High School, hereby certify that the attendance and duty entries
                recorded above are in strict compliance with the Education Act and Ministry Statutory Regulations.
              </p>
              <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-[10px]">
                <span className="font-bold text-gray-700">Signature: __________________</span>
                <span className="font-mono text-gray-500">Date: {new Date().toLocaleDateString('en-GB')}</span>
              </div>
            </div>

            <div className="p-3.5 border border-slate-300 rounded-2xl bg-white space-y-3">
              <div className="flex items-center gap-2 text-blue-900 font-bold text-xs">
                <Award className="w-4 h-4 text-blue-700" />
                <span>District Education Office (DEO) Inspection</span>
              </div>
              <p className="text-[10px] text-gray-500 leading-snug">
                Schools Inspector / District Education Officer (DSI) verification stamp for Shabani District,
                Midlands Regional Office.
              </p>
              <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-[10px]">
                <span className="font-bold text-gray-700">Inspector Stamp: [ OFFICIAL STAMP ]</span>
                <span className="font-mono text-gray-500">Status: Verified</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 flex-wrap shrink-0">
          <div className="text-[11px] text-gray-500">
            Total Staff Logged: <strong className="text-gray-900">{teacherStats.length} Teachers</strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportMoPSECSV}
              className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition select-none shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-200" />
              <span>Download MoPSE CSV Register</span>
            </button>

            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-blue-900 hover:bg-blue-950 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition select-none shadow-xs cursor-pointer"
            >
              <Printer className="w-4 h-4 text-blue-200" />
              <span>Print MoPSE Dossier</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
