import { pgTable, text, timestamp, boolean, integer, doublePrecision } from 'drizzle-orm/pg-core';

// Users table (Teachers and Admins)
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  surname: text('surname').notNull(),
  email: text('email').notNull().unique(),
  password: text('password'),
  role: text('role').notNull().default('teacher'), // 'teacher' | 'admin'
  subject: text('subject'),
  employeeId: text('employee_id').notNull(),
  department: text('department'),
  avatar: text('avatar'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Attendance records table
export const attendanceRecords = pgTable('attendance_records', {
  id: text('id').primaryKey(),
  teacherId: text('teacher_id').notNull(),
  teacherName: text('teacher_name').notNull(),
  teacherSurname: text('teacher_surname').notNull(),
  subject: text('subject'),
  date: text('date').notNull(), // 'YYYY-MM-DD'
  clockInTime: text('clock_in_time'), // 'HH:mm'
  clockOutTime: text('clock_out_time'), // 'HH:mm'
  clockInTimestamp: text('clock_in_timestamp'),
  clockOutTimestamp: text('clock_out_timestamp'),
  status: text('status').notNull().default('present'), // 'present' | 'late' | 'early_departure' | 'absent'
  earlyClockInReason: text('early_clock_in_reason'),
  earlyClockOutReason: text('early_clock_out_reason'),
  clockInLatitude: doublePrecision('clock_in_latitude'),
  clockInLongitude: doublePrecision('clock_in_longitude'),
  clockOutLatitude: doublePrecision('clock_out_latitude'),
  clockOutLongitude: doublePrecision('clock_out_longitude'),
  totalWorkingMinutes: integer('total_working_minutes').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Early clocking notifications table
export const earlyClockNotifications = pgTable('early_clock_notifications', {
  id: text('id').primaryKey(),
  teacherId: text('teacher_id').notNull(),
  teacherName: text('teacher_name').notNull(),
  teacherSurname: text('teacher_surname').notNull(),
  type: text('type').notNull(), // 'early_in' | 'early_out'
  time: text('time').notNull(),
  date: text('date').notNull(),
  reason: text('reason').notNull(),
  acknowledgedByAdmin: boolean('acknowledged_by_admin').default(false).notNull(),
  timestamp: text('timestamp').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// School settings table
export const schoolSettings = pgTable('school_settings', {
  id: text('id').primaryKey(),
  schoolName: text('school_name').notNull(),
  academicYear: text('academic_year').notNull(),
  standardClockInTime: text('standard_clock_in_time').notNull(),
  standardClockOutTime: text('standard_clock_out_time').notNull(),
  lateGracePeriodMinutes: integer('late_grace_period_minutes').notNull(),
  earlyClockInThreshold: text('early_clock_in_threshold').notNull(),
  earlyClockOutThreshold: text('early_clock_out_threshold').notNull(),
  schoolLatitude: doublePrecision('school_latitude').notNull(),
  schoolLongitude: doublePrecision('school_longitude').notNull(),
  allowedRadiusMeters: integer('allowed_radius_meters').notNull(),
  requireLocation: boolean('require_location').default(true).notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
