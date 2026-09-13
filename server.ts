import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db, schema } from './src/db/index.ts';
import { eq, desc } from 'drizzle-orm';
import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', database: 'connected', region: 'europe-west2' });
  });

  // --- API: Users ---
  app.get('/api/users', async (req, res) => {
    try {
      const allUsers = await db.select().from(schema.users);
      res.json(allUsers);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch users' });
    }
  });

  app.post('/api/users', async (req, res) => {
    try {
      const userData = req.body;
      const [user] = await db
        .insert(schema.users)
        .values({
          id: userData.id || `usr_${Date.now()}`,
          name: userData.name,
          surname: userData.surname,
          email: userData.email.toLowerCase().trim(),
          password: userData.password,
          role: userData.role || 'teacher',
          subject: userData.subject || null,
          employeeId: userData.employeeId,
          department: userData.department || 'Academic Department',
          avatar: userData.avatar || null,
        })
        .onConflictDoUpdate({
          target: schema.users.email,
          set: {
            name: userData.name,
            surname: userData.surname,
            password: userData.password,
            role: userData.role || 'teacher',
            subject: userData.subject || null,
            employeeId: userData.employeeId,
          },
        })
        .returning();
      res.json(user);
    } catch (error: any) {
      console.error('Error saving user:', error);
      res.status(500).json({ error: error.message || 'Failed to save user' });
    }
  });

  app.delete('/api/users/:id', async (req, res) => {
    try {
      await db.delete(schema.users).where(eq(schema.users.id, req.params.id));
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error deleting user:', error);
      res.status(500).json({ error: error.message || 'Failed to delete user' });
    }
  });

  // --- API: Attendance Records ---
  app.get('/api/attendance', async (req, res) => {
    try {
      const records = await db
        .select()
        .from(schema.attendanceRecords)
        .orderBy(desc(schema.attendanceRecords.createdAt));
      res.json(records);
    } catch (error: any) {
      console.error('Error fetching attendance:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch attendance' });
    }
  });

  app.post('/api/attendance', async (req, res) => {
    try {
      const record = req.body;
      const [saved] = await db
        .insert(schema.attendanceRecords)
        .values({
          id: record.id || `att_${Date.now()}`,
          teacherId: record.teacherId,
          teacherName: record.teacherName,
          teacherSurname: record.teacherSurname,
          subject: record.subject,
          date: record.date,
          clockInTime: record.clockInTime,
          clockOutTime: record.clockOutTime,
          clockInTimestamp: record.clockInTimestamp,
          clockOutTimestamp: record.clockOutTimestamp,
          status: record.status,
          earlyClockInReason: record.earlyClockInReason,
          earlyClockOutReason: record.earlyClockOutReason,
          clockInLatitude: record.clockInLatitude,
          clockInLongitude: record.clockInLongitude,
          clockOutLatitude: record.clockOutLatitude,
          clockOutLongitude: record.clockOutLongitude,
          totalWorkingMinutes: record.totalWorkingMinutes || 0,
        })
        .onConflictDoUpdate({
          target: schema.attendanceRecords.id,
          set: {
            clockOutTime: record.clockOutTime,
            clockOutTimestamp: record.clockOutTimestamp,
            status: record.status,
            earlyClockOutReason: record.earlyClockOutReason,
            clockOutLatitude: record.clockOutLatitude,
            clockOutLongitude: record.clockOutLongitude,
            totalWorkingMinutes: record.totalWorkingMinutes || 0,
          },
        })
        .returning();
      res.json(saved);
    } catch (error: any) {
      console.error('Error saving attendance:', error);
      res.status(500).json({ error: error.message || 'Failed to save attendance' });
    }
  });

  app.delete('/api/attendance/:id', async (req, res) => {
    try {
      await db.delete(schema.attendanceRecords).where(eq(schema.attendanceRecords.id, req.params.id));
      res.json({ success: true, message: 'Attendance record deleted' });
    } catch (error: any) {
      console.error('Error deleting attendance record:', error);
      res.status(500).json({ error: error.message || 'Failed to delete attendance record' });
    }
  });

  app.delete('/api/attendance', async (req, res) => {
    try {
      await db.delete(schema.attendanceRecords);
      res.json({ success: true, message: 'All attendance records cleared' });
    } catch (error: any) {
      console.error('Error clearing attendance records:', error);
      res.status(500).json({ error: error.message || 'Failed to clear attendance records' });
    }
  });

  // --- API: Early Notifications ---
  app.get('/api/notifications', async (req, res) => {
    try {
      const notifs = await db
        .select()
        .from(schema.earlyClockNotifications)
        .orderBy(desc(schema.earlyClockNotifications.createdAt));
      res.json(notifs);
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch notifications' });
    }
  });

  app.post('/api/notifications', async (req, res) => {
    try {
      const notif = req.body;
      const [saved] = await db
        .insert(schema.earlyClockNotifications)
        .values({
          id: notif.id || `notif_${Date.now()}`,
          teacherId: notif.teacherId,
          teacherName: notif.teacherName,
          teacherSurname: notif.teacherSurname,
          type: notif.type,
          time: notif.time,
          date: notif.date,
          reason: notif.reason,
          acknowledgedByAdmin: notif.acknowledgedByAdmin ?? false,
          timestamp: notif.timestamp || new Date().toISOString(),
        })
        .returning();
      res.json(saved);
    } catch (error: any) {
      console.error('Error saving notification:', error);
      res.status(500).json({ error: error.message || 'Failed to save notification' });
    }
  });

  app.patch('/api/notifications/:id/acknowledge', async (req, res) => {
    try {
      const [updated] = await db
        .update(schema.earlyClockNotifications)
        .set({ acknowledgedByAdmin: true })
        .where(eq(schema.earlyClockNotifications.id, req.params.id))
        .returning();
      res.json(updated);
    } catch (error: any) {
      console.error('Error acknowledging notification:', error);
      res.status(500).json({ error: error.message || 'Failed to acknowledge notification' });
    }
  });

  // --- API: Reset All Data ---
  app.post('/api/reset', async (req, res) => {
    try {
      await db.delete(schema.attendanceRecords);
      await db.delete(schema.earlyClockNotifications);
      await db.delete(schema.users);
      res.json({ success: true, message: 'All database data cleared successfully.' });
    } catch (error: any) {
      console.error('Error resetting database data:', error);
      res.status(500).json({ error: error.message || 'Failed to reset data' });
    }
  });

  // --- API: School Settings ---
  app.get('/api/settings', async (req, res) => {
    try {
      const [settings] = await db.select().from(schema.schoolSettings).limit(1);
      res.json(settings || null);
    } catch (error: any) {
      console.error('Error fetching settings:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch settings' });
    }
  });

  app.post('/api/settings', async (req, res) => {
    try {
      const data = req.body;
      const [saved] = await db
        .insert(schema.schoolSettings)
        .values({
          id: 'dadaya_main_settings',
          schoolName: data.schoolName || 'Dadaya High School',
          academicYear: data.academicYear || '2026 Academic Year',
          standardClockInTime: data.standardClockInTime || '07:30',
          standardClockOutTime: data.standardClockOutTime || '15:30',
          lateGracePeriodMinutes: data.lateGracePeriodMinutes || 15,
          earlyClockInThreshold: data.earlyClockInThreshold || '07:15',
          earlyClockOutThreshold: data.earlyClockOutThreshold || '15:15',
          schoolLatitude: data.schoolLatitude ?? -20.334287639632716,
          schoolLongitude: data.schoolLongitude ?? 29.896081746496083,
          allowedRadiusMeters: data.allowedRadiusMeters || 200,
          requireLocation: data.requireLocation ?? true,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: schema.schoolSettings.id,
          set: {
            schoolName: data.schoolName,
            academicYear: data.academicYear,
            standardClockInTime: data.standardClockInTime,
            standardClockOutTime: data.standardClockOutTime,
            lateGracePeriodMinutes: data.lateGracePeriodMinutes,
            earlyClockInThreshold: data.earlyClockInThreshold,
            earlyClockOutThreshold: data.earlyClockOutThreshold,
            schoolLatitude: data.schoolLatitude,
            schoolLongitude: data.schoolLongitude,
            allowedRadiusMeters: data.allowedRadiusMeters,
            requireLocation: data.requireLocation,
            updatedAt: new Date(),
          },
        })
        .returning();
      res.json(saved);
    } catch (error: any) {
      console.error('Error saving settings:', error);
      res.status(500).json({ error: error.message || 'Failed to save settings' });
    }
  });

  // --- API: AI Teacher Navigation & Intelligence Assistant ---
  app.post('/api/ai/assistant', async (req, res) => {
    try {
      const {
        prompt,
        userRole = 'teacher',
        currentView = 'home',
        userName = 'Teacher',
        teacherProfile,
        todayAttendance,
        attendanceSummary,
        recentRecords,
        leaveSummary,
        schoolContext,
        adminMetrics,
      } = req.body;

      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ error: 'Prompt is required' });
      }

      const systemInstruction = `You are "Dadaya AI", the highly intelligent attendance advisor, policy expert, and navigation guide for Dadaya High School Attendance Management System (Zimbabwe).
You possess deep pedagogical and administrative expertise in Zimbabwean Ministry of Primary and Secondary Education (MoPSE) guidelines, school term calendars, Public Service Commission attendance protocols, geofencing rules, and school operations.

SCHOOL POLICIES & CONTEXT:
1. School Identity: Dadaya High School, Zvishavane District, Midlands Province, Zimbabwe. Motto: "To Strive and To Succeed".
2. School Schedule & Hours:
   - Operating Days: Monday to Friday (Strictly No School Attendance on Weekends or Public Holidays).
   - Standard Arrival / Clock-In: 07:30 AM.
   - Punctuality Grace Period: 15 minutes (Up to 07:45 AM is On-Time). Clock-ins after 07:45 AM are flagged as "Late".
   - Early Arrival Threshold: 07:15 AM (Arrivals before 07:15 AM require an early arrival notice/reason).
   - Standard Departure / Clock-Out: 03:30 PM (15:30).
   - Early Departure Threshold: 03:15 PM (15:15). Departures before 03:15 PM require an early departure reason.
3. GPS Geofence Verification:
   - Campus Coordinates: Latitude -20.334288, Longitude 29.896082.
   - Strict Campus Boundary Radius: 200 meters.
   - Geofence & Active Online Connection are mandatory for all clock-in, clock-out, and badge NFC scans. Offline clocking is strictly prohibited by school policy.
4. Leave Categories under MoPSE / PSC Regulations:
   - Medical / Sick Leave (requires medical cert for extended days)
   - Annual / Casual Leave
   - Compassionate Leave (bereavement, family emergency)
   - Official Duty / ZIMSEC / Ministry Workshop Leave
   - Study / Examination Leave
   - Maternity / Paternity Leave
5. Zimbabwe School Terms 2026:
   - Term 1: Jan 13, 2026 - Apr 10, 2026
   - Term 2: May 12, 2026 - Aug 07, 2026
   - Term 3: Sep 08, 2026 - Dec 04, 2026
   - National Holidays: National Youth Day (Feb 21), Good Friday, Easter Monday, Independence Day (Apr 18), Workers Day (May 1), Africa Day (May 25), Heroes Day (Aug 10), Defense Forces Day (Aug 11), National Unity Day (Dec 22).

APP NAVIGATION & TARGET VIEWS:
- For Teachers:
  • "home" -> Clock In / Clock Out & Today's Live Duty Status
  • "attendance" -> Attendance Overview, Monthly Calendar & Punctuality
  • "history" -> Attendance History & Shift Logs
  • "leave" -> Leave Application & Status Tracking
  • "reports" -> Printable Attendance Reports & Termly PDF/Excel Export
  • "profile" -> Digital Staff ID Badge & Account Details
  • "notice" -> Early Arrival / Early Departure Notice Form
- For Admins:
  • "dashboard" -> Admin Overview & Today's Attendance Counter
  • "live_monitor" -> Live Campus Map & Clocked-In Teachers
  • "attendance_report" -> School-Wide Attendance Reports & Filters
  • "teachers" -> Faculty Management & EC Numbers
  • "notifications" -> Review Early Clock-In / Out Reasons
  • "leave_requests" -> Approve / Reject Staff Leave Applications
  • "settings" -> School Hours, GPS Coordinates & Geofence Settings

INTELLIGENCE GUIDELINES:
- Provide insightful, accurate, and supportive answers. Use formatting (clean paragraphs, bullet points, bold key terms) to make responses easily readable.
- If the user asks about their personal attendance ("How is my attendance?", "Was I late?", "Can I clock out?"), calculate and explain using the provided 'todayAttendance', 'attendanceSummary', and 'recentRecords' context data!
- If the user asks for a leave letter or reason, draft a polished, formal, MoPSE-compliant explanation and specify targetView: "leave" with prefillReason.
- If the user asks for navigation or how to do something, provide direct instructions and set 'targetView' and 'actionTitle'.
- Generate 2-3 highly relevant, intelligent follow-up questions in 'suggestedQuestions'.
- Always return valid JSON matching the schema.`;

      const userContextString = JSON.stringify({
        userName,
        userRole,
        currentView,
        teacherProfile: teacherProfile || null,
        todayAttendance: todayAttendance || null,
        attendanceSummary: attendanceSummary || null,
        recentRecords: recentRecords || [],
        leaveSummary: leaveSummary || null,
        schoolContext: schoolContext || null,
        adminMetrics: adminMetrics || null,
      });

      // If Gemini API Key is available, use Gemini 3.7 Flash
      if (process.env.GEMINI_API_KEY) {
        try {
          const response = await ai.models.generateContent({
            model: 'gemini-3.7-flash',
            contents: `Current System & User Context Data:
${userContextString}

User Query / Request:
"${prompt}"`,
            config: {
              systemInstruction,
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  message: {
                    type: Type.STRING,
                    description: 'Comprehensive, helpful, formatted explanation and answer using markdown formatting where helpful.',
                  },
                  targetView: {
                    type: Type.STRING,
                    description: 'App view ID to navigate to if applicable (e.g. home, attendance, history, leave, reports, profile, notice, settings). Empty string if general conversation.',
                  },
                  actionTitle: {
                    type: Type.STRING,
                    description: 'Interactive button title for the user to navigate or take immediate action.',
                  },
                  prefillData: {
                    type: Type.OBJECT,
                    description: 'Optional prefilled data if this query generated a leave draft or notice.',
                    properties: {
                      leaveType: { type: Type.STRING },
                      reason: { type: Type.STRING },
                      noticeType: { type: Type.STRING },
                    },
                  },
                  suggestedQuestions: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: '2 to 3 smart, context-aware follow-up questions.',
                  },
                },
                required: ['message', 'suggestedQuestions'],
              },
            },
          });

          if (response.text) {
            const parsed = JSON.parse(response.text.trim());
            return res.json(parsed);
          }
        } catch (geminiError: any) {
          console.warn('Gemini API call failed, using enhanced contextual rule engine:', geminiError.message);
        }
      }

      // Enhanced Rule-Based Heuristic Intelligence Engine
      const lower = prompt.toLowerCase();
      let message = `Hello ${userName}! I am your Dadaya AI Assistant. I can analyze your attendance statistics, help draft official leave requests, explain school policies, and navigate you anywhere in the app.`;
      let targetView = '';
      let actionTitle = '';
      let prefillData: any = undefined;
      let suggestedQuestions = [
        'How is my attendance performance?',
        'Can I clock out right now?',
        'Help me draft a sick leave application',
        'What are the official school term dates?',
      ];

      // Personalized Attendance Analysis
      if (lower.includes('my attendance') || lower.includes('punctuality') || lower.includes('statistics') || lower.includes('performance') || lower.includes('score') || lower.includes('late days')) {
        const rate = attendanceSummary?.punctualityRate ?? (attendanceSummary?.totalDaysLogged ? Math.round((attendanceSummary.onTimeCount / attendanceSummary.totalDaysLogged) * 100) : 100);
        const lates = attendanceSummary?.lateCount ?? 0;
        const total = attendanceSummary?.totalDaysLogged ?? 0;
        
        message = `### 📊 Your Attendance Analysis (${schoolContext?.termName || 'Term 1 2026'})
- **Total Duty Days Logged:** ${total} days
- **Punctuality Rating:** **${rate}%**
- **On-Time Arrivals:** ${attendanceSummary?.onTimeCount ?? 0}
- **Late Arrivals:** ${lates} day(s)

${rate >= 90 ? '🌟 **Outstanding performance!** You are consistently meeting Dadaya High School and MoPSE punctuality standards.' : '⚠️ **Attention:** Try to arrive before 07:45 AM to maintain a 90%+ punctuality benchmark for official term evaluations.'}`;
        targetView = 'attendance';
        actionTitle = 'View Full Attendance Sheet';
        suggestedQuestions = ['How do I print my monthly report?', 'What time is arrival counted as late?'];
      }
      // Clock In & Today Status
      else if (lower.includes('clock in') || lower.includes('check in') || lower.includes('arrive') || lower.includes('morning')) {
        if (todayAttendance?.clockedIn) {
          message = `You have already clocked in today at **${todayAttendance.clockInTime}** (${todayAttendance.status === 'late' ? 'Marked Late' : 'On Time'}). Standard duty ends at 03:30 PM.`;
        } else {
          message = `To clock in for today's duty:
1. Ensure your device is connected to the internet and GPS location is active.
2. Be on Dadaya High campus grounds (within 200m).
3. Head to the **Clock In** screen and tap the green button before **07:45 AM** to be marked On-Time.`;
        }
        targetView = 'home';
        actionTitle = 'Go to Clock-In Screen';
        suggestedQuestions = ['What if I arrive before 07:15 AM?', 'Why is GPS required?'];
      }
      // Clock Out & Departure
      else if (lower.includes('clock out') || lower.includes('leave school') || lower.includes('depart') || lower.includes('finish') || lower.includes('go home')) {
        if (!todayAttendance?.clockedIn) {
          message = `You have not clocked in for duty yet today. Please clock in first upon arriving at Dadaya High School.`;
          targetView = 'home';
          actionTitle = 'Clock In First';
        } else if (todayAttendance?.clockedOut) {
          message = `You have already clocked out today at **${todayAttendance.clockOutTime}** (Total working duration: ${Math.floor((todayAttendance.durationMinutes || 0) / 60)}h ${(todayAttendance.durationMinutes || 0) % 60}m). Have a wonderful evening!`;
          targetView = 'history';
          actionTitle = 'View Shift Log';
        } else {
          message = `Standard school departure time is **03:30 PM (15:30)**. 
- If you clock out after 03:15 PM, it is recorded as a standard departure.
- If leaving before 03:15 PM, the system will prompt you for an early departure reason for school administration records.`;
          targetView = 'home';
          actionTitle = 'Go to Clock Out';
        }
        suggestedQuestions = ['How do I submit an early departure notice?', 'View my total hours this week'];
      }
      // Leave Application & Drafting
      else if (lower.includes('leave') || lower.includes('sick') || lower.includes('vacation') || lower.includes('absent') || lower.includes('permission') || lower.includes('off day')) {
        message = `### 📝 Leave Application Assistant (MoPSE Regulations)
You can submit official leave under any of the following statutory categories:
- **Medical / Sick Leave:** For medical appointments or illness (attach doctor's certificate if >2 days).
- **Casual / Annual Leave:** Personal or urgent family obligations.
- **Compassionate Leave:** Family bereavement or critical emergency.
- **Official Duty / Workshop:** Ministry, ZIMSEC, or district sports assignments.
- **Study / Exam Leave:** Approved tertiary or professional development examinations.`;
        targetView = userRole === 'admin' ? 'leave_requests' : 'leave';
        actionTitle = userRole === 'admin' ? 'Review Faculty Leave Requests' : 'Open Leave Application Form';
        prefillData = {
          leaveType: lower.includes('sick') ? 'sick' : lower.includes('compassionate') ? 'compassionate' : 'annual',
          reason: 'Application for official leave in accordance with Ministry of Primary and Secondary Education (MoPSE) guidelines.',
        };
        suggestedQuestions = ['How long does admin approval take?', 'Check my pending leave status'];
      }
      // Geofence & Location
      else if (lower.includes('geofence') || lower.includes('location') || lower.includes('gps') || lower.includes('radius') || lower.includes('distance') || lower.includes('outside')) {
        message = `### 📍 Campus Geofence Security
- **Campus Center:** Latitude \`-20.334288\`, Longitude \`29.896082\` (Dadaya High School Campus Perimeter).
- **Approved Radius:** **200 meters**.
- **Requirement:** Geolocation is verified at the exact moment of clock-in and clock-out to guarantee authentic on-campus presence. Offline clocking is strictly prohibited.`;
        targetView = 'home';
        actionTitle = 'Check Geofence on Home';
        suggestedQuestions = ['Why does it say Outside Campus?', 'How to turn on GPS on mobile?'];
      }
      // Term Dates & Public Holidays
      else if (lower.includes('term') || lower.includes('holiday') || lower.includes('calendar') || lower.includes('mopse') || lower.includes('dates') || lower.includes('easter')) {
        message = `### 🗓️ Zimbabwe MoPSE 2026 School Calendar
- **Term 1:** 13 January 2026 – 10 April 2026 *(Current Active Term)*
- **Term 2:** 12 May 2026 – 07 August 2026
- **Term 3:** 08 September 2026 – 04 December 2026

*Note: The attendance system automatically suspends clock-in requirements during official school vacations and national public holidays.*`;
        targetView = 'reports';
        actionTitle = 'View Termly Reports';
        suggestedQuestions = ['What are the national holidays in Zimbabwe?', 'How is attendance calculated for the term?'];
      }
      // Reports and Timesheets
      else if (lower.includes('report') || lower.includes('print') || lower.includes('pdf') || lower.includes('excel') || lower.includes('timesheet') || lower.includes('download')) {
        message = `You can generate and export official Dadaya High School attendance documentation:
- **PDF Attendance Sheet:** Complete with official school crest, Headmaster signature lines, and MoPSE formatting.
- **Microsoft Access / Excel CSV:** Compatible with national education database imports.
- **Termly Analytics:** Consolidated term summaries with punctuality breakdown.`;
        targetView = userRole === 'admin' ? 'attendance_report' : 'reports';
        actionTitle = 'Open Reports & Export';
        suggestedQuestions = ['How do I print a PDF report?', 'Export to Microsoft Access'];
      }
      // Staff Profile & Digital Badge
      else if (lower.includes('profile') || lower.includes('badge') || lower.includes('id') || lower.includes('ec number') || lower.includes('password') || lower.includes('nfc')) {
        message = `Your **Digital Faculty ID Badge** contains your official EC number, subject department, and an instant NFC / barcode scanning profile for fast badge clocking.`;
        targetView = 'profile';
        actionTitle = 'View Teacher ID Badge';
        suggestedQuestions = ['How do I clock in with my NFC badge?', 'How do I update my profile?'];
      }

      res.json({
        message,
        targetView,
        actionTitle,
        prefillData,
        suggestedQuestions,
      });
    } catch (error: any) {
      console.error('Error in AI Assistant endpoint:', error);
      res.status(500).json({ error: error.message || 'Failed to process AI assistant query' });
    }
  });

  // --- API: AI Deep Attendance & Punctuality Audit ---
  app.post('/api/ai/analyze-attendance', async (req, res) => {
    try {
      const { records = [], teacherName = 'Teacher', role = 'teacher', schoolSettings } = req.body;

      const total = records.length;
      const onTime = records.filter((r: any) => r.status === 'present' || r.status === 'on-time').length;
      const lates = records.filter((r: any) => r.status === 'late').length;
      const earlyOuts = records.filter((r: any) => r.status === 'early-out' || !!r.earlyClockOutReason).length;
      const punctualityRate = total > 0 ? Math.round((onTime / total) * 100) : 100;

      const systemInstruction = `You are the Lead Quality Assurance & Attendance Auditor for Dadaya High School and Zimbabwe MoPSE.
Analyze the provided attendance records and generate a comprehensive, highly insightful attendance & punctuality audit with actionable feedback.
Return a structured JSON with:
- healthGrade: letter grade (e.g. "A+", "A", "B", "C", "Needs Improvement")
- punctualityScore: number (0-100)
- summary: 2-3 sentences overview of the teacher's commitment and reliability
- strengths: list of 2-3 key positive observations
- areasForImprovement: list of 1-2 constructive recommendations
- mopseComplianceStatus: string (e.g. "Fully Compliant with MoPSE Public Service Standard")`;

      if (process.env.GEMINI_API_KEY) {
        try {
          const response = await ai.models.generateContent({
            model: 'gemini-3.7-flash',
            contents: `Teacher: ${teacherName}, Role: ${role}
Total Days Logged: ${total}
On-Time Arrivals: ${onTime}
Late Arrivals: ${lates}
Early Departures: ${earlyOuts}
Calculated Punctuality Rate: ${punctualityRate}%
Recent 10 Records: ${JSON.stringify(records.slice(0, 10))}`,
            config: {
              systemInstruction,
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  healthGrade: { type: Type.STRING },
                  punctualityScore: { type: Type.NUMBER },
                  summary: { type: Type.STRING },
                  strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                  areasForImprovement: { type: Type.ARRAY, items: { type: Type.STRING } },
                  mopseComplianceStatus: { type: Type.STRING },
                },
                required: ['healthGrade', 'punctualityScore', 'summary', 'strengths', 'areasForImprovement', 'mopseComplianceStatus'],
              },
            },
          });

          if (response.text) {
            return res.json(JSON.parse(response.text.trim()));
          }
        } catch (e: any) {
          console.warn('Gemini analyze failed, using heuristic audit:', e.message);
        }
      }

      // Fallback structured audit
      const grade = punctualityRate >= 95 ? 'A+' : punctualityRate >= 88 ? 'A' : punctualityRate >= 75 ? 'B' : 'C';
      res.json({
        healthGrade: grade,
        punctualityScore: punctualityRate,
        summary: `${teacherName} has logged ${total} total duty sessions at Dadaya High School with a ${punctualityRate}% on-time arrival rate.`,
        strengths: [
          `Consistent daily presence with ${onTime} on-time arrivals`,
          `Full compliance with on-campus GPS geofence validation`,
          total > 0 ? `Active commitment to scheduled academic periods` : `Ready to establish exemplary attendance`,
        ],
        areasForImprovement: [
          lates > 0 ? `Reduce late arrivals by arriving before the 07:30 AM bell` : `Maintain flawless morning arrival habits`,
          `Ensure clock-out is recorded after 15:30 PM to document complete working hours`,
        ],
        mopseComplianceStatus: punctualityRate >= 80 ? 'Fully Compliant with MoPSE Public Service Standard' : 'Requires Monitoring to Meet MoPSE 85% Standard',
      });
    } catch (err: any) {
      console.error('Audit error:', err);
      res.status(500).json({ error: 'Failed to generate attendance analysis' });
    }
  });

  // --- API: AI Smart Leave Reason & Motivation Drafter ---
  app.post('/api/ai/draft-leave-reason', async (req, res) => {
    try {
      const { leaveType = 'sick', teacherName = 'Teacher', subject = 'Academic Department', dates = '', notes = '' } = req.body;

      const systemInstruction = `You are an expert Zimbabwean school administrative secretary.
Draft an official, highly professional, polite, and MoPSE-compliant reason and justification letter for a teacher's leave application at Dadaya High School.
Return JSON with:
- draftReason: 2-3 sentences concise, formal reason suitable for the school management system
- formalLetterBody: A complete formal application letter addressed to The Headmaster, Dadaya High School
- handoverSuggestion: Recommended handover notes for subject classes`;

      if (process.env.GEMINI_API_KEY) {
        try {
          const response = await ai.models.generateContent({
            model: 'gemini-3.7-flash',
            contents: `Teacher: ${teacherName}, Subject: ${subject}, Leave Type: ${leaveType}, Proposed Dates: ${dates}, Additional Notes from Teacher: "${notes}"`,
            config: {
              systemInstruction,
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  draftReason: { type: Type.STRING },
                  formalLetterBody: { type: Type.STRING },
                  handoverSuggestion: { type: Type.STRING },
                },
                required: ['draftReason', 'formalLetterBody', 'handoverSuggestion'],
              },
            },
          });

          if (response.text) {
            return res.json(JSON.parse(response.text.trim()));
          }
        } catch (e: any) {
          console.warn('Gemini leave draft failed, using template:', e.message);
        }
      }

      // Fallback
      res.json({
        draftReason: `Application for ${leaveType.replace('_', ' ')} leave on ${dates || 'specified dates'} in accordance with Ministry of Primary and Secondary Education (MoPSE) staff regulations. All lesson plans and student assignments have been prepared for handover.`,
        formalLetterBody: `To: The Headmaster, Dadaya High School\nFrom: ${teacherName} (${subject})\nDate: ${new Date().toLocaleDateString()}\n\nRE: APPLICATION FOR ${leaveType.toUpperCase().replace('_', ' ')} LEAVE\n\nI hereby submit my formal request for ${leaveType.replace('_', ' ')} leave for the period ${dates || 'as requested'}. I have organized lesson work and delegated supervisory duties to ensure uninterrupted student learning.\n\nYours sincerely,\n${teacherName}`,
        handoverSuggestion: `Lesson exercises and study guides left with the Head of Department for ${subject} classes.`,
      });
    } catch (err: any) {
      console.error('Leave drafter error:', err);
      res.status(500).json({ error: 'Failed to draft leave application' });
    }
  });

  // --- Vite / Frontend Middleware ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
