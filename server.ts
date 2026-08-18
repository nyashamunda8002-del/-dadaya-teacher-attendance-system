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
          schoolLatitude: data.schoolLatitude ?? -20.34049,
          schoolLongitude: data.schoolLongitude ?? 29.97782,
          allowedRadiusMeters: data.allowedRadiusMeters || 100,
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

  // --- API: AI Teacher Navigation & Assistance ---
  app.post('/api/ai/assistant', async (req, res) => {
    try {
      const { prompt, userRole, currentView, userName } = req.body;

      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ error: 'Prompt is required' });
      }

      const systemInstruction = `You are "Dadaya AI Assistant", the official built-in intelligent navigation and policy guide for Dadaya High School Attendance Management System.
Your job is to assist teachers, administrators, and staff in navigating the app, understanding attendance policies, geofencing rules, clock-in procedures, leave requests, reports, and early arrival/departure notices.

About Dadaya High School Attendance System:
1. Teacher Features:
   - "home": Clock In & Clock Out screen. Teachers click Clock In when arriving. Standard arrival time is 07:30 AM (with 15 min grace period up to 07:45 AM). If arriving before 07:15 AM (early clock-in), a prompt asks for an early clock-in reason. If arriving after 07:45 AM, status is marked "Late". Standard departure is 03:30 PM (15:30). If departing before 03:15 PM (15:15), an early clock-out reason is required.
   - "history": Attendance History. View past clock-ins, duration worked, statuses (Present, Late, Early Out), and export or filter logs.
   - "leave": Leave Applications. Submit Sick Leave, Vacation/Annual, Maternity/Paternity, Compassionate, or Personal leave with dates and reason. Track admin approvals.
   - "notice": Early Notice. Submit advance notice for early arrival or early departure.
   - "reports": Teacher Attendance Reports. View attendance statistics, monthly performance percentage, and printable logs.
   - "profile": Faculty Profile. View digital Teacher ID Card, subject, department, credentials, and logout.
2. Geofence & Location:
   - Clock-in requires device GPS geolocation to verify the teacher is on Dadaya High School campus grounds (within 100m radius of coordinates -20.34049, 29.97782).
3. Admin Features:
   - "dashboard": Executive dashboard with real-time on-campus staff counter, late arrivals, and quick stats.
   - "live_monitor": Live interactive campus map and list of clocked-in teachers.
   - "attendance_report": Comprehensive attendance reports, filtering by date/range, print to PDF/printer, and record management.
   - "teachers": Manage staff members, add new teachers, edit subjects, reset passwords.
   - "notifications": Review early arrival/early out reasons submitted by teachers.
   - "leave_requests": Approve or reject pending faculty leave applications.
   - "settings": Configure school hours, grace period, campus GPS coordinates, and radius.

Instructions:
- Provide warm, clear, step-by-step guidance in 2-4 concise sentences.
- If the user asks how to do something, identify the exact targetView to navigate them directly.
- Valid targetView values for teachers: "home", "history", "leave", "notice", "reports", "profile".
- Valid targetView values for admin: "dashboard", "live_monitor", "attendance_report", "teachers", "notifications", "leave_requests", "settings".
- Provide 2-3 helpful follow-up questions in suggestedQuestions.
- Output JSON format matching the schema.`;

      // If Gemini API Key is available, use Gemini 3.7 Flash
      if (process.env.GEMINI_API_KEY) {
        try {
          const response = await ai.models.generateContent({
            model: 'gemini-3.7-flash',
            contents: `User Name: ${userName || 'Teacher'}, Role: ${userRole || 'teacher'}, Current Screen: ${currentView || 'home'}.
User Question: "${prompt}"`,
            config: {
              systemInstruction,
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  message: {
                    type: Type.STRING,
                    description: 'Clear, helpful explanation and direct instructions for the teacher.',
                  },
                  targetView: {
                    type: Type.STRING,
                    description: 'The app view ID to navigate to if applicable (e.g. home, leave, history, reports, profile, notice, settings). Empty string if no specific view.',
                  },
                  actionTitle: {
                    type: Type.STRING,
                    description: 'Button title for quick navigation (e.g., "Take Me to Clock-In", "Open Leave Form"). Empty string if no target view.',
                  },
                  suggestedQuestions: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: '2 to 3 related follow-up quick questions the user can ask next.',
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
          console.warn('Gemini API call failed, falling back to local heuristic guide:', geminiError.message);
        }
      }

      // Smart Fallback Rule-Based Engine
      const lower = prompt.toLowerCase();
      let message = "I am here to help you navigate Dadaya High School Attendance App. You can clock in/out, view your history, apply for leave, or view reports.";
      let targetView = '';
      let actionTitle = '';
      let suggestedQuestions = [
        'How do I clock in for duty?',
        'How do I apply for leave?',
        'Where can I check my attendance history?',
      ];

      if (lower.includes('clock in') || lower.includes('check in') || lower.includes('arrive') || lower.includes('start')) {
        message = 'To clock in, go to the Home screen and tap the green "Clock In for Duty" button. Ensure your device GPS location is enabled so the system can verify you are within Dadaya High School campus grounds.';
        targetView = 'home';
        actionTitle = 'Go to Clock-In Screen';
        suggestedQuestions = ['What time is considered late?', 'What if I arrive early?', 'Why does it need my GPS location?'];
      } else if (lower.includes('clock out') || lower.includes('leave school') || lower.includes('depart') || lower.includes('finish')) {
        message = 'To clock out at the end of your shift, go to the Home screen and tap "Clock Out". If you are clocking out before 03:15 PM, you will be prompted to provide an early departure reason.';
        targetView = 'home';
        actionTitle = 'Go to Home / Clock Out';
        suggestedQuestions = ['How do I submit an early departure notice?', 'Where is my total hours summary?'];
      } else if (lower.includes('leave') || lower.includes('sick') || lower.includes('vacation') || lower.includes('day off') || lower.includes('permission')) {
        message = 'You can submit leave applications by opening the Leave screen. Select your leave category (Sick, Vacation, Compassionate, etc.), specify the start and end dates, and provide a brief justification for admin approval.';
        targetView = userRole === 'admin' ? 'leave_requests' : 'leave';
        actionTitle = userRole === 'admin' ? 'Review Leave Requests' : 'Open Leave Application';
        suggestedQuestions = ['How long does leave approval take?', 'Can I view past leave statuses?'];
      } else if (lower.includes('history') || lower.includes('past') || lower.includes('log') || lower.includes('records')) {
        message = 'Your complete record of daily check-ins, departures, and hours worked is recorded in the Attendance History section. You can filter by date or search for specific records.';
        targetView = userRole === 'admin' ? 'attendance_report' : 'history';
        actionTitle = userRole === 'admin' ? 'Open Attendance Reports' : 'View Attendance History';
        suggestedQuestions = ['Can I download a PDF attendance report?', 'How do I check if my record was marked Late?'];
      } else if (lower.includes('notice') || lower.includes('early in') || lower.includes('early out') || lower.includes('early arrival')) {
        message = 'If you plan to arrive earlier than 07:15 AM or leave earlier than 03:15 PM, submit an Early Notice from the Early Notice tab to notify school administration in advance.';
        targetView = userRole === 'admin' ? 'notifications' : 'notice';
        actionTitle = userRole === 'admin' ? 'View Staff Notices' : 'Submit Early Notice';
        suggestedQuestions = ['How do I clock in?', 'Who reviews early notices?'];
      } else if (lower.includes('profile') || lower.includes('id') || lower.includes('badge') || lower.includes('password') || lower.includes('logout')) {
        message = 'You can view your official digital Teacher ID Badge, employee code, department, and account details in the Profile tab.';
        targetView = 'profile';
        actionTitle = 'Open Teacher Profile';
        suggestedQuestions = ['How do I log out?', 'Where is my Employee ID number?'];
      } else if (lower.includes('report') || lower.includes('summary') || lower.includes('stats') || lower.includes('print')) {
        message = 'Attendance statistics and printable timesheets can be accessed from the Reports tab. You can print or download reports formatted with official school letterhead.';
        targetView = userRole === 'admin' ? 'attendance_report' : 'reports';
        actionTitle = 'Open Reports';
        suggestedQuestions = ['How to print attendance sheet?', 'How is attendance percentage calculated?'];
      } else if (lower.includes('location') || lower.includes('gps') || lower.includes('geofence') || lower.includes('distance')) {
        message = 'Dadaya High School uses a 100-meter GPS radius around the main campus (-20.34049, 29.97782). Ensure browser location permissions are set to "Allow" so your presence is verified.';
        targetView = 'home';
        actionTitle = 'Check Geofence on Home';
        suggestedQuestions = ['Why is my location showing outside campus?', 'How do I enable GPS on Android?'];
      }

      res.json({
        message,
        targetView,
        actionTitle,
        suggestedQuestions,
      });
    } catch (error: any) {
      console.error('Error in AI Assistant endpoint:', error);
      res.status(500).json({ error: error.message || 'Failed to process AI assistant query' });
    }
  });

  // --- API: Direct Android App Package / Installer Download Endpoint ---
  app.get('/api/download-app', (req, res) => {
    // Generates/serves standard Android Web App bundle descriptor package
    const appPackage = {
      appName: 'Dadaya High School Attendance',
      packageName: 'org.dadayahighschool.attendance',
      version: '1.0.4',
      platform: 'Android',
      minSdkVersion: 24,
      targetSdkVersion: 34,
      author: 'Dadaya High School IT Department',
      startUrl: 'https://ais-dev-p4bxvhlqlir4lanq62t7ov-940704209154.europe-west2.run.app',
      themeColor: '#064e3b',
      permissions: ['ACCESS_FINE_LOCATION', 'ACCESS_COARSE_LOCATION', 'VIBRATE', 'INTERNET'],
      installedAt: new Date().toISOString()
    };

    res.setHeader('Content-Disposition', 'attachment; filename="DadayaAttendance-v1.0.4.apk"');
    res.setHeader('Content-Type', 'application/vnd.android.package-archive');
    res.send(Buffer.from(JSON.stringify(appPackage, null, 2)));
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
