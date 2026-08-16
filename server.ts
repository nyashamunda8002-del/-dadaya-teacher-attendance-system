import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db, schema } from './src/db/index.ts';
import { eq, desc } from 'drizzle-orm';

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
          allowedRadiusMeters: data.allowedRadiusMeters || 800,
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
