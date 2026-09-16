/**
 * Student Attendance PDF Generator for Dadaya High School
 * Implements the exact official Ministry of Primary and Secondary Education (MoPSE)
 * register layout matching the official institutional format:
 *
 * | CLASS |       GIRLS       |       BOYS        |       TOTAL       |
 * |       | BOARDERS |  DAY   | BOARDERS |  DAY   | ACTUAL | POSSIBLE |
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { StudentAttendanceRecord, SchoolClass, SchoolSettings } from '../types';

export interface DailyAttendanceExportOptions {
  records: StudentAttendanceRecord[];
  classes: SchoolClass[];
  date: string;
  schoolSettings: SchoolSettings;
  reportTitle?: string;
  generatedBy?: string;
}

export function exportDailyStudentAttendancePDF(options: DailyAttendanceExportOptions): void {
  const {
    records,
    classes,
    date,
    schoolSettings,
    reportTitle = 'Daily Student Attendance Register',
    generatedBy = 'Dadaya High School Administration',
  } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Top Institutional Header Banner (Dadaya Emerald)
  doc.setFillColor(6, 78, 59); // Emerald 900
  doc.rect(0, 0, pageWidth, 28, 'F');

  // School Crest Accent Box
  doc.setFillColor(236, 253, 245); // Emerald 50
  doc.roundedRect(12, 5, 18, 18, 2, 2, 'F');
  doc.setTextColor(6, 78, 59);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('DHS', 17, 16);

  // School Title & MoPSE Endorsement
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(schoolSettings.schoolName.toUpperCase(), 34, 11);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(167, 243, 208); // Emerald 200
  doc.text(
    `Ministry of Primary & Secondary Education • Academic Session ${schoolSettings.academicYear || '2026'}`,
    34,
    17
  );
  doc.text('Official Daily Boarding & Day Scholar Enrollment Ledger', 34, 22);

  // Document Title & Date Badge
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(reportTitle.toUpperCase(), 14, 37);

  // Date card on top right
  const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text(`Register Date: ${formattedDate}`, 14, 43);

  // Map each class to its attendance record on this date (or zeros if not recorded yet)
  let sumGBoarders = 0;
  let sumGDay = 0;
  let sumBBoarders = 0;
  let sumBDay = 0;
  let sumActual = 0;
  let sumPossible = 0;

  // Prepare table data rows
  const tableRows: (string | number)[][] = [];

  // Group or sort classes
  const sortedClasses = [...classes].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

  sortedClasses.forEach((cls) => {
    const record = records.find(
      (r) => r.date === date && r.className.toLowerCase().trim() === cls.name.toLowerCase().trim()
    );

    const gb = record ? record.girlsBoarders : 0;
    const gd = record ? record.girlsDay : 0;
    const bb = record ? record.boysBoarders : 0;
    const bd = record ? record.boysDay : 0;
    const act = record ? record.actualTotal : gb + gd + bb + bd;
    const pos = record ? record.possibleTotal : cls.capacity || 45;

    sumGBoarders += gb;
    sumGDay += gd;
    sumBBoarders += bb;
    sumBDay += bd;
    sumActual += act;
    sumPossible += pos;

    tableRows.push([cls.name, gb, gd, bb, bd, act, pos]);
  });

  // Also include any records for classes not in the default classes list
  records
    .filter((r) => r.date === date)
    .forEach((r) => {
      const alreadyIncluded = sortedClasses.some((c) => c.name.toLowerCase().trim() === r.className.toLowerCase().trim());
      if (!alreadyIncluded) {
        sumGBoarders += r.girlsBoarders;
        sumGDay += r.girlsDay;
        sumBBoarders += r.boysBoarders;
        sumBDay += r.boysDay;
        sumActual += r.actualTotal;
        sumPossible += r.possibleTotal;
        tableRows.push([r.className, r.girlsBoarders, r.girlsDay, r.boysBoarders, r.boysDay, r.actualTotal, r.possibleTotal]);
      }
    });

  // Calculate Overall School Attendance Rate
  const attendanceRatePct = sumPossible > 0 ? ((sumActual / sumPossible) * 100).toFixed(1) : '0.0';

  // Summary Stat Pill on top
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(pageWidth - 85, 32, 71, 14, 2, 2, 'FD');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('OVERALL ATTENDANCE RATE', pageWidth - 82, 37);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(6, 78, 59);
  doc.text(`${attendanceRatePct}%`, pageWidth - 82, 43);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`(${sumActual} / ${sumPossible} Students)`, pageWidth - 55, 43);

  // Exact Headers Matching the Provided Image Specification
  // Row 1: CLASS (span 2), GIRLS (span 2), BOYS (span 2), TOTAL (span 2)
  // Row 2: BOARDERS, DAY, BOARDERS, DAY, ACTUAL, POSSIBLE
  autoTable(doc, {
    startY: 48,
    head: [
      [
        { content: 'CLASS', rowSpan: 2, styles: { valign: 'middle', halign: 'left', fontStyle: 'bold' } },
        { content: 'GIRLS', colSpan: 2, styles: { halign: 'center', fontStyle: 'bold' } },
        { content: 'BOYS', colSpan: 2, styles: { halign: 'center', fontStyle: 'bold' } },
        { content: 'TOTAL', colSpan: 2, styles: { halign: 'center', fontStyle: 'bold' } },
      ],
      [
        { content: 'BOARDERS', styles: { halign: 'center', fontSize: 7.5 } },
        { content: 'DAY', styles: { halign: 'center', fontSize: 7.5 } },
        { content: 'BOARDERS', styles: { halign: 'center', fontSize: 7.5 } },
        { content: 'DAY', styles: { halign: 'center', fontSize: 7.5 } },
        { content: 'ACTUAL', styles: { halign: 'center', fontSize: 7.5, fontStyle: 'bold' } },
        { content: 'POSSIBLE', styles: { halign: 'center', fontSize: 7.5, fontStyle: 'bold' } },
      ],
    ],
    body: tableRows,
    foot: [
      [
        { content: 'TOTAL', styles: { fontStyle: 'bold', halign: 'left' } },
        { content: String(sumGBoarders), styles: { halign: 'center', fontStyle: 'bold' } },
        { content: String(sumGDay), styles: { halign: 'center', fontStyle: 'bold' } },
        { content: String(sumBBoarders), styles: { halign: 'center', fontStyle: 'bold' } },
        { content: String(sumBDay), styles: { halign: 'center', fontStyle: 'bold' } },
        { content: String(sumActual), styles: { halign: 'center', fontStyle: 'bold', textColor: [6, 78, 59] } },
        { content: String(sumPossible), styles: { halign: 'center', fontStyle: 'bold' } },
      ],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [6, 78, 59], // Emerald 900
      textColor: [255, 255, 255],
      lineWidth: 0.2,
      lineColor: [203, 213, 225],
      fontSize: 8,
      cellPadding: 2,
    },
    bodyStyles: {
      textColor: [15, 23, 42],
      lineWidth: 0.15,
      lineColor: [226, 232, 240],
      fontSize: 8,
      cellPadding: 2,
    },
    columnStyles: {
      0: { halign: 'left', fontStyle: 'bold', cellWidth: 38 },
      1: { halign: 'center', cellWidth: 23 },
      2: { halign: 'center', cellWidth: 23 },
      3: { halign: 'center', cellWidth: 23 },
      4: { halign: 'center', cellWidth: 23 },
      5: { halign: 'center', fontStyle: 'bold', cellWidth: 26 },
      6: { halign: 'center', fontStyle: 'bold', cellWidth: 26 },
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      lineWidth: 0.3,
      lineColor: [100, 116, 139],
      fontSize: 8.5,
      cellPadding: 2.5,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 14, right: 14 },
  });

  // Obtain position after table
  const finalY = (doc as any).lastAutoTable.finalY || 180;

  // Add Official Institutional Signatures Section
  const sigY = Math.min(finalY + 12, pageHeight - 35);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);

  // Column 1: Deputy Headmaster
  doc.line(14, sigY + 12, 68, sigY + 12);
  doc.text('Senior Master / Deputy Head', 14, sigY + 16);
  doc.text('Date: ....................................', 14, sigY + 21);

  // Column 2: Headmaster / School Stamp
  doc.line(78, sigY + 12, 132, sigY + 12);
  doc.text('Headmaster Signature & Stamp', 78, sigY + 16);
  doc.text('Date: ....................................', 78, sigY + 21);

  // Column 3: Contact Help Center badge
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(142, sigY, 54, 22, 2, 2, 'FD');
  doc.setTextColor(22, 101, 52);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('📞 CONTACT HELP CENTER', 146, sigY + 5);
  doc.setFontSize(10);
  doc.text('0711335606', 146, sigY + 11);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Direct Support & Attendance Help', 146, sigY + 16);

  // Footer on page bottom
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Generated by Dadaya High School Portal on ${new Date().toLocaleString()} • Help Center: 0711335606`,
    14,
    pageHeight - 6
  );

  // Trigger download
  doc.save(`Dadaya_Student_Attendance_Register_${date}.pdf`);
}

/**
 * Single Class Attendance PDF (for teacher section)
 */
export function exportSingleClassAttendancePDF(options: {
  className: string;
  records: StudentAttendanceRecord[];
  dateRangeText?: string;
  schoolSettings: SchoolSettings;
  teacherName?: string;
}): void {
  const { className, records, dateRangeText = 'All Recorded Dates', schoolSettings, teacherName } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Top Header Banner
  doc.setFillColor(6, 78, 59); // Emerald 900
  doc.rect(0, 0, pageWidth, 28, 'F');

  // School Crest Accent
  doc.setFillColor(236, 253, 245);
  doc.roundedRect(12, 5, 18, 18, 2, 2, 'F');
  doc.setTextColor(6, 78, 59);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('DHS', 17, 16);

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(schoolSettings.schoolName.toUpperCase(), 34, 11);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(167, 243, 208);
  doc.text(`Class Register • ${className} • Academic Year ${schoolSettings.academicYear || '2026'}`, 34, 17);
  doc.text('Ministry of Primary & Secondary Education Official Register', 34, 22);

  // Class Info Banner
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`ATTENDANCE RECORD FOR ${className.toUpperCase()}`, 14, 37);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Period: ${dateRangeText} ${teacherName ? `• Registered Teacher: ${teacherName}` : ''}`, 14, 43);

  // Prepare table data rows
  const sortedRecords = [...records].sort((a, b) => b.date.localeCompare(a.date));

  let totalGBoarders = 0;
  let totalGDay = 0;
  let totalBBoarders = 0;
  let totalBDay = 0;
  let totalActual = 0;
  let totalPossible = 0;

  const bodyRows = sortedRecords.map((r) => {
    totalGBoarders += r.girlsBoarders;
    totalGDay += r.girlsDay;
    totalBBoarders += r.boysBoarders;
    totalBDay += r.boysDay;
    totalActual += r.actualTotal;
    totalPossible += r.possibleTotal;

    const rate = r.possibleTotal > 0 ? ((r.actualTotal / r.possibleTotal) * 100).toFixed(0) + '%' : '-';
    return [r.date, r.girlsBoarders, r.girlsDay, r.boysBoarders, r.boysDay, r.actualTotal, r.possibleTotal, rate];
  });

  // Table with the identical official columns
  autoTable(doc, {
    startY: 48,
    head: [
      [
        { content: 'DATE', rowSpan: 2, styles: { valign: 'middle', halign: 'left', fontStyle: 'bold' } },
        { content: 'GIRLS', colSpan: 2, styles: { halign: 'center', fontStyle: 'bold' } },
        { content: 'BOYS', colSpan: 2, styles: { halign: 'center', fontStyle: 'bold' } },
        { content: 'TOTAL', colSpan: 2, styles: { halign: 'center', fontStyle: 'bold' } },
        { content: 'RATE', rowSpan: 2, styles: { valign: 'middle', halign: 'center', fontStyle: 'bold' } },
      ],
      [
        { content: 'BOARDERS', styles: { halign: 'center', fontSize: 7.5 } },
        { content: 'DAY', styles: { halign: 'center', fontSize: 7.5 } },
        { content: 'BOARDERS', styles: { halign: 'center', fontSize: 7.5 } },
        { content: 'DAY', styles: { halign: 'center', fontSize: 7.5 } },
        { content: 'ACTUAL', styles: { halign: 'center', fontSize: 7.5, fontStyle: 'bold' } },
        { content: 'POSSIBLE', styles: { halign: 'center', fontSize: 7.5, fontStyle: 'bold' } },
      ],
    ],
    body: bodyRows,
    foot: [
      [
        { content: 'AVERAGE / SUM', styles: { fontStyle: 'bold', halign: 'left' } },
        { content: String(totalGBoarders), styles: { halign: 'center', fontStyle: 'bold' } },
        { content: String(totalGDay), styles: { halign: 'center', fontStyle: 'bold' } },
        { content: String(totalBBoarders), styles: { halign: 'center', fontStyle: 'bold' } },
        { content: String(totalBDay), styles: { halign: 'center', fontStyle: 'bold' } },
        { content: String(totalActual), styles: { halign: 'center', fontStyle: 'bold', textColor: [6, 78, 59] } },
        { content: String(totalPossible), styles: { halign: 'center', fontStyle: 'bold' } },
        {
          content: totalPossible > 0 ? ((totalActual / totalPossible) * 100).toFixed(1) + '%' : '-',
          styles: { halign: 'center', fontStyle: 'bold' },
        },
      ],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [6, 78, 59],
      textColor: [255, 255, 255],
      fontSize: 8,
      cellPadding: 2,
    },
    bodyStyles: {
      textColor: [15, 23, 42],
      fontSize: 8,
      cellPadding: 2,
    },
    columnStyles: {
      0: { halign: 'left', cellWidth: 32 },
      1: { halign: 'center', cellWidth: 22 },
      2: { halign: 'center', cellWidth: 22 },
      3: { halign: 'center', cellWidth: 22 },
      4: { halign: 'center', cellWidth: 22 },
      5: { halign: 'center', fontStyle: 'bold', cellWidth: 22 },
      6: { halign: 'center', fontStyle: 'bold', cellWidth: 22 },
      7: { halign: 'center', fontStyle: 'bold', cellWidth: 18 },
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontSize: 8,
      cellPadding: 2.5,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 14, right: 14 },
  });

  const finalY = (doc as any).lastAutoTable.finalY || 180;
  const sigY = Math.min(finalY + 12, pageHeight - 35);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);

  doc.line(14, sigY + 12, 68, sigY + 12);
  doc.text('Class Teacher Signature', 14, sigY + 16);

  doc.line(78, sigY + 12, 132, sigY + 12);
  doc.text('Senior Master / Deputy Head', 78, sigY + 16);

  // Help center box
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(142, sigY, 54, 22, 2, 2, 'FD');
  doc.setTextColor(22, 101, 52);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('📞 CONTACT HELP CENTER', 146, sigY + 5);
  doc.setFontSize(10);
  doc.text('0711335606', 146, sigY + 11);

  doc.save(`Dadaya_${className.replace(/\s+/g, '_')}_Attendance_Register.pdf`);
}
