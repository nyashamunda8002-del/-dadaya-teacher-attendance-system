/**
 * Report Export Utility for Dadaya High School
 * Generates official downloadable PDF documents (via jsPDF & autoTable)
 * and Microsoft Access / Excel compatible CSV data files.
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AttendanceRecord, User, SchoolSettings } from '../types';

export interface TermAttendanceSummary {
  termName: string;
  startDate: string;
  endDate: string;
  academicYear: string;
  totalSchoolDays: number;
  recordsCount: number;
  presentDays: number;
  lateDays: number;
  earlyDepartureDays: number;
  absentDays: number;
  attendanceRate: number; // 0 to 100
  punctualityRate: number; // 0 to 100
  totalHoursWorked: number;
  teacherSummaries?: {
    userId: string;
    teacherName: string;
    teacherSurname: string;
    ecNumber: string;
    subject: string;
    present: number;
    late: number;
    absent: number;
    rate: number;
    hours: number;
  }[];
}

/**
 * Downloads Microsoft Access / Excel compatible dataset
 */
export function exportToAccessAndExcelCSV(
  headers: string[],
  rows: (string | number)[][],
  filename: string
): void {
  // \uFEFF Byte Order Mark ensures Microsoft Excel & Access interpret UTF-8 encoding properly
  const csvContent =
    '\uFEFF' +
    [
      headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(','),
      ...rows.map((row) =>
        row
          .map((cell) => {
            const str = cell === null || cell === undefined ? '' : String(cell);
            return `"${str.replace(/"/g, '""')}"`;
          })
          .join(',')
      ),
    ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates and downloads an official Teacher Individual Attendance PDF Report
 */
export function exportTeacherAttendancePDF(
  records: AttendanceRecord[],
  teacher: User,
  schoolSettings: SchoolSettings,
  reportTitle: string = 'Teacher Attendance Report',
  dateRangeText?: string
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Header Banner
  doc.setFillColor(6, 78, 59); // Emerald 900
  doc.rect(0, 0, pageWidth, 28, 'F');

  // School Crest Accent Box
  doc.setFillColor(236, 253, 245); // Emerald 50
  doc.roundedRect(12, 5, 18, 18, 2, 2, 'F');
  doc.setTextColor(6, 78, 59);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('DHS', 17, 16);

  // School Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text(schoolSettings.schoolName.toUpperCase(), 35, 12);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(167, 243, 208); // Emerald 200
  doc.text(
    `Ministry of Primary & Secondary Education • Academic Session ${schoolSettings.academicYear}`,
    35,
    18
  );
  doc.text('Official Teacher Timesheet & Biometric / Geofence Attendance Ledger', 35, 23);

  // Document Sub-Header & Metadata
  doc.setTextColor(30, 41, 59); // Slate 800
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(reportTitle.toUpperCase(), 14, 38);

  // Teacher Info Card (Left Column)
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 43, 90, 26, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('EDUCATOR DETAILS', 18, 48);

  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(`${teacher.name} ${teacher.surname}`, 18, 54);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(`EC / ID: ${teacher.ecNumber || teacher.employeeId || 'DHS-T001'}`, 18, 59);
  doc.text(`Subject / Dept: ${teacher.subject || teacher.department || 'General Faculty'}`, 18, 64);

  // Performance Summary Card (Right Column)
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(108, 43, 88, 26, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('ATTENDANCE AUDIT SUMMARY', 112, 48);

  const present = records.filter((r) => r.status === 'present' || r.status === 'early_departure').length;
  const late = records.filter((r) => r.status === 'late').length;
  const totalMins = records.reduce((acc, r) => acc + (r.totalWorkingMinutes || 0), 0);
  const totalHours = (totalMins / 60).toFixed(1);
  const punctuality = records.length > 0 ? Math.round((present / records.length) * 100) : 100;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(`Total Logged Sessions: ${records.length}`, 112, 54);
  doc.text(`On-Time: ${present}  •  Late: ${late}`, 112, 59);
  doc.text(`Total Hours: ${totalHours} hrs  •  Punctuality Rate: ${punctuality}%`, 112, 64);

  // Date Generated Subtitle
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  const dateSub = dateRangeText || `Report Generated: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`;
  doc.text(dateSub, 14, 74);

  // Attendance Records Table
  const tableHeaders = ['Date', 'Clock In', 'Clock Out', 'Duration', 'Status', 'Geofence / Reason'];
  const tableData = records.map((r) => [
    r.date,
    r.clockInTime || '--',
    r.clockOutTime || '--',
    r.totalWorkingMinutes ? `${Math.floor(r.totalWorkingMinutes / 60)}h ${r.totalWorkingMinutes % 60}m` : '--',
    (r.status || 'present').toUpperCase(),
    r.earlyClockInReason || r.earlyClockOutReason || (r.locationVerified ? 'Campus Verified (100m)' : 'Standard Log'),
  ]);

  if (tableData.length === 0) {
    tableData.push(['No records', '--', '--', '--', '--', 'No attendance entries logged']);
  }

  autoTable(doc, {
    head: [tableHeaders],
    body: tableData,
    startY: 77,
    theme: 'grid',
    headStyles: {
      fillColor: [6, 78, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (data) => {
      // Signature Section at Bottom
      const pageH = doc.internal.pageSize.getHeight();
      
      doc.setDrawColor(203, 213, 225);
      doc.line(14, pageH - 24, 80, pageH - 24);
      doc.line(130, pageH - 24, 196, pageH - 24);

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text('Teacher Signature', 14, pageH - 19);
      doc.text('Headmaster / Stamp & Verification', 130, pageH - 19);

      doc.setFontSize(6.5);
      doc.text(
        `Dadaya High School Attendance Portal • Confidential MoPSE Official Document • Page ${doc.getNumberOfPages()}`,
        14,
        pageH - 10
      );
    },
  });

  const cleanSurname = (teacher.surname || 'Teacher').replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`Dadaya_Teacher_Attendance_${cleanSurname}_${new Date().toISOString().split('T')[0]}.pdf`);
}

/**
 * Generates and downloads an official Master Administrative Attendance Report PDF
 */
export function exportAdminMasterReportPDF(
  records: AttendanceRecord[],
  users: User[],
  schoolSettings: SchoolSettings,
  title: string = 'Master Attendance Ledger & Faculty Audit',
  periodText?: string
): void {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Top Header Banner
  doc.setFillColor(30, 58, 138); // Blue 900
  doc.rect(0, 0, pageWidth, 26, 'F');

  // Crest badge
  doc.setFillColor(239, 246, 255);
  doc.roundedRect(12, 4, 18, 18, 2, 2, 'F');
  doc.setTextColor(30, 58, 138);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('DHS', 17, 15);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(schoolSettings.schoolName.toUpperCase(), 35, 11);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(191, 219, 254);
  doc.text(
    `Official Institutional Attendance Register • Academic Year ${schoolSettings.academicYear} • Ministry of Primary & Secondary Education`,
    35,
    17
  );
  doc.text('Institutional Compliance, Punctuality Ledger, and Geofence Verification Report', 35, 22);

  // Subtitle & Statistics Bar
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(title.toUpperCase(), 14, 34);

  const registeredTeachers = users.filter((u) => u.role === 'teacher');
  const presentCount = records.filter((r) => r.status === 'present' || r.status === 'early_departure').length;
  const lateCount = records.filter((r) => r.status === 'late').length;
  const punctualityRate = records.length > 0 ? Math.round((presentCount / records.length) * 100) : 100;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  const periodLabel = periodText || `Report Date: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`;
  doc.text(
    `${periodLabel}  |  Total Faculty: ${registeredTeachers.length}  |  Total Clocked Logs: ${records.length}  |  On-Time: ${presentCount}  |  Late: ${lateCount}  |  Institutional Punctuality: ${punctualityRate}%`,
    14,
    40
  );

  const tableHeaders = ['Date', 'EC Number', 'Teacher Full Name', 'Department / Subject', 'Clock In', 'Clock Out', 'Duration', 'Status', 'Geofence Verification'];
  const tableData = records.map((r) => {
    const matchedUser = users.find((u) => u.id === r.userId);
    const ec = matchedUser?.ecNumber || matchedUser?.employeeId || 'DHS-T001';
    return [
      r.date,
      ec,
      `${r.teacherName} ${r.teacherSurname}`,
      r.subject || 'Faculty',
      r.clockInTime || '--',
      r.clockOutTime || '--',
      r.totalWorkingMinutes ? `${Math.floor(r.totalWorkingMinutes / 60)}h ${r.totalWorkingMinutes % 60}m` : '--',
      (r.status || 'present').toUpperCase(),
      r.locationVerified ? 'Campus Verified (100m)' : 'Standard Log',
    ];
  });

  if (tableData.length === 0) {
    tableData.push(['--', '--', 'No records logged for selected period', '--', '--', '--', '--', '--', '--']);
  }

  autoTable(doc, {
    head: [tableHeaders],
    body: tableData,
    startY: 44,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (data) => {
      const pageH = doc.internal.pageSize.getHeight();
      
      doc.setDrawColor(203, 213, 225);
      doc.line(14, pageH - 20, 90, pageH - 20);
      doc.line(200, pageH - 20, 280, pageH - 20);

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text('Prepared by: Administration Office', 14, pageH - 15);
      doc.text('Headmaster / Deputy Head Certification & Stamp', 200, pageH - 15);

      doc.setFontSize(6.5);
      doc.text(
        `Dadaya High School Master Attendance Ledger • Confidential MoPSE Record • Page ${doc.getNumberOfPages()}`,
        14,
        pageH - 8
      );
    },
  });

  doc.save(`Dadaya_Master_Attendance_Report_${new Date().toISOString().split('T')[0]}.pdf`);
}

/**
 * Generates and downloads official Academic Term Attendance Dossier PDF
 */
export function exportTermlyAttendancePDF(
  summary: TermAttendanceSummary,
  schoolSettings: SchoolSettings,
  user?: User | null
): void {
  const isIndividualTeacher = user && user.role === 'teacher';
  
  const doc = new jsPDF({
    orientation: isIndividualTeacher ? 'portrait' : 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Primary Header
  const primaryColor = isIndividualTeacher ? [6, 78, 59] : [30, 58, 138];
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Crest
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(12, 5, 18, 18, 2, 2, 'F');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('DHS', 17, 16);

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text(schoolSettings.schoolName.toUpperCase(), 35, 12);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(226, 232, 240);
  doc.text(
    `Official Academic Term Report • ${summary.termName} (${summary.academicYear}) • Ministry of Primary & Secondary Education`,
    35,
    18
  );
  doc.text(`Official Term Dates: ${summary.startDate} to ${summary.endDate}`, 35, 23);

  // Term Analytics Cards
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(
    isIndividualTeacher
      ? `TERMLY ATTENDANCE REPORT — ${user?.name} ${user?.surname}`
      : `TERMLY FACULTY ATTENDANCE DOSSIER — ${summary.termName.toUpperCase()}`,
    14,
    38
  );

  // KPI Boxes
  const startY = 42;
  const boxWidth = (pageWidth - 28 - 12) / 4;

  const kpis = [
    { label: 'Term Days', value: `${summary.totalSchoolDays} Days` },
    { label: 'Present Sessions', value: `${summary.presentDays} Days` },
    { label: 'Late Clock-Ins', value: `${summary.lateDays} Sessions` },
    { label: 'Punctuality Index', value: `${summary.punctualityRate}%` },
  ];

  kpis.forEach((kpi, idx) => {
    const x = 14 + idx * (boxWidth + 4);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, startY, boxWidth, 18, 2, 2, 'FD');

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.label.toUpperCase(), x + 4, startY + 6);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(kpi.value, x + 4, startY + 14);
  });

  // Table
  if (isIndividualTeacher) {
    // Single Teacher Report Table
    const tableHeaders = ['Metric / Category', 'Value / Statistics', 'MoPSE Compliance Note'];
    const tableData = [
      ['Academic Term Period', `${summary.startDate} to ${summary.endDate}`, 'Official Term Session'],
      ['Total Required Term Days', `${summary.totalSchoolDays} School Days`, 'Excluding Weekends & Public Holidays'],
      ['Present On-Time Days', `${summary.presentDays} Days`, 'Full compliance with 07:30 bell'],
      ['Late Arrival Occurrences', `${summary.lateDays} Days`, 'Clocked in after 07:45 grace threshold'],
      ['Excused Leave Days', `${summary.absentDays} Days`, 'Approved department leave'],
      ['Total Logged Working Hours', `${summary.totalHoursWorked.toFixed(1)} Hours`, 'Instructional & supervision time'],
      ['Overall Punctuality Score', `${summary.punctualityRate}%`, summary.punctualityRate >= 90 ? 'Grade A (Exemplary)' : 'Standard Standing'],
    ];

    autoTable(doc, {
      head: [tableHeaders],
      body: tableData,
      startY: startY + 24,
      theme: 'grid',
      headStyles: {
        fillColor: [6, 78, 59],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8.5,
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [30, 41, 59],
      },
      margin: { left: 14, right: 14 },
      didDrawPage: (data) => {
        const pageH = doc.internal.pageSize.getHeight();
        doc.setDrawColor(203, 213, 225);
        doc.line(14, pageH - 24, 80, pageH - 24);
        doc.line(130, pageH - 24, 196, pageH - 24);

        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text('Teacher Signature', 14, pageH - 19);
        doc.text('Headmaster Stamp & Signature', 130, pageH - 19);

        doc.setFontSize(6.5);
        doc.text(
          `Dadaya High School Termly Attendance Report • Page ${doc.getNumberOfPages()}`,
          14,
          pageH - 10
        );
      },
    });
  } else {
    // School-wide faculty table
    const tableHeaders = ['EC Number', 'Teacher Full Name', 'Department / Subject', 'Present', 'Late', 'Absent / Leave', 'Total Hours', 'Attendance Rate %', 'Status'];
    const tableData = (summary.teacherSummaries || []).map((t) => [
      t.ecNumber,
      `${t.teacherName} ${t.teacherSurname}`,
      t.subject,
      `${t.present} d`,
      `${t.late} d`,
      `${t.absent} d`,
      `${t.hours.toFixed(1)} h`,
      `${t.rate}%`,
      t.rate >= 90 ? 'EXEMPLARY' : t.rate >= 75 ? 'SATISFACTORY' : 'ATTENTION REQUIRED',
    ]);

    if (tableData.length === 0) {
      tableData.push(['--', 'No teacher summaries available for this term', '--', '--', '--', '--', '--', '--', '--']);
    }

    autoTable(doc, {
      head: [tableHeaders],
      body: tableData,
      startY: startY + 24,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 58, 138],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: [30, 41, 59],
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      margin: { left: 14, right: 14 },
      didDrawPage: (data) => {
        const pageH = doc.internal.pageSize.getHeight();
        doc.setDrawColor(203, 213, 225);
        doc.line(14, pageH - 20, 90, pageH - 20);
        doc.line(200, pageH - 20, 280, pageH - 20);

        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text('Prepared by: Deputy Headmaster / Registrar', 14, pageH - 15);
        doc.text('Headmaster Signature & School Stamp', 200, pageH - 15);

        doc.setFontSize(6.5);
        doc.text(
          `Dadaya High School Termly Institutional Register • Confidential MoPSE Record • Page ${doc.getNumberOfPages()}`,
          14,
          pageH - 8
        );
      },
    });
  }

  const cleanTerm = summary.termName.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`Dadaya_Termly_Report_${cleanTerm}_${summary.academicYear}.pdf`);
}
