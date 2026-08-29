export type UserRole = 'teacher' | 'admin';
export type ThemeMode = 'light' | 'dark' | 'system';

export interface User {
  id: string;
  name: string;
  surname: string;
  email: string;
  subject?: string; // For teachers
  role: UserRole;
  password?: string;
  phone?: string;
  employeeId: string;
  ecNumber?: string;
  department?: string;
  avatarUrl?: string;
  theme?: ThemeMode;
  createdAt: string;
}

export type AttendanceStatus = 'present' | 'late' | 'absent' | 'early_departure' | 'half_day';

export interface AttendanceRecord {
  id: string;
  userId: string;
  teacherName: string;
  teacherSurname: string;
  subject: string;
  date: string; // YYYY-MM-DD
  clockInTime: string | null; // e.g. "07:24 AM"
  clockOutTime: string | null; // e.g. "03:40 PM"
  clockInTimestamp: number | null;
  clockOutTimestamp: number | null;
  status: AttendanceStatus;
  isEarlyClockIn?: boolean;
  earlyClockInReason?: string;
  isEarlyClockOut?: boolean;
  earlyClockOutReason?: string;
  totalWorkingMinutes?: number;
  locationVerified: boolean;
  latitude?: number;
  longitude?: number;
  notes?: string;
}

export type NotificationType = 'early_in' | 'early_out' | 'clock_in' | 'clock_out' | 'late_in' | 'general';

export interface EarlyClockNotification {
  id: string;
  recordId: string;
  teacherId: string;
  teacherName: string;
  teacherSurname: string;
  subject: string;
  type: NotificationType;
  time: string;
  date: string;
  timestamp: number;
  reason: string;
  read: boolean;
  acknowledgedByAdmin: boolean;
}

export type LeaveType =
  | 'sick'
  | 'annual'
  | 'official_duty'
  | 'compassionate'
  | 'maternity'
  | 'maternity_paternity'
  | 'study'
  | 'unpaid'
  | 'other';

export type LeaveStatus = 'pending' | 'approved' | 'rejected';

export interface LeaveRequest {
  id: string;
  userId: string;
  teacherName: string;
  teacherSurname: string;
  employeeId?: string;
  subject?: string;
  department?: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  daysCount?: number;
  totalDays?: number;
  reason: string;
  handoverDetails?: string;
  status: LeaveStatus;
  adminNotes?: string;
  reviewedBy?: string;
  submittedAt: string;
  reviewedAt?: string;
}

export interface SchoolSettings {
  schoolName: string;
  academicYear: string;
  currentTerm?: string; // e.g. "Term 1", "Term 2", "Term 3"
  termStartDate?: string; // YYYY-MM-DD e.g. "2026-01-13"
  termEndDate?: string; // YYYY-MM-DD e.g. "2026-04-10"
  termNotes?: string; // e.g. "Term 1 examinations and sports events"
  standardClockInTime: string; // "07:30"
  standardClockOutTime: string; // "15:30"
  lateGracePeriodMinutes: number; // 15
  earlyClockInThreshold: string; // "07:15"
  earlyClockOutThreshold: string; // "15:00"
  schoolLatitude: number; // Dadaya High School approx -20.3167
  schoolLongitude: number; // 29.9833
  allowedRadiusMeters: number; // 100 meters
  requireLocation: boolean;
  lockMessage?: string;
  soundEffectsEnabled?: boolean;
  phoneNotificationsEnabled?: boolean;
  // Scheduled Firebase Cloud Backup Settings
  scheduledBackupEnabled?: boolean;
  scheduledBackupFrequency?: 'hourly' | 'daily' | 'weekly';
  scheduledBackupTime?: string; // e.g. "00:00" (midnight) or "17:00" (after duty)
  lastScheduledBackupAt?: string | null;
  nextScheduledBackupAt?: string | null;
  backupRetentionCount?: number; // default 30
}

export type BackupType = 'scheduled' | 'manual';
export type BackupStatus = 'completed' | 'in_progress' | 'failed';

export interface FirebaseBackupRecord {
  id: string;
  backupName: string;
  timestamp: string; // ISO format
  type: BackupType;
  scheduleFrequency?: string;
  status: BackupStatus;
  recordsCount: number;
  teachersCount: number;
  leaveCount: number;
  notificationsCount: number;
  sizeBytes?: number;
  triggeredBy: string;
  academicYear: string;
  term: string;
  schoolName: string;
  data: {
    users: User[];
    attendanceRecords: AttendanceRecord[];
    leaveRequests: LeaveRequest[];
    notifications: EarlyClockNotification[];
    schoolSettings: SchoolSettings;
  };
  createdAt: string;
}

export type OfflineActionType = 'clock_in' | 'clock_out' | 'leave_request';

export interface QueuedOfflineAction {
  id: string;
  type: OfflineActionType;
  timestamp: number;
  dateStr: string;
  timeStr: string;
  teacherId: string;
  teacherName: string;
  teacherSurname: string;
  subject?: string;
  payload: Record<string, any>;
  status: 'pending' | 'syncing' | 'failed' | 'synced';
  error?: string;
}

export interface MoPSERegisterRow {
  index: number;
  ecNumber: string;
  fullName: string;
  department: string;
  gender: string;
  dailyStatus: Record<number, string>; // day 1..31 -> 'P' | 'L' | 'OD' | 'SL' | 'CL' | 'A' | '-'
  daysPresent: number;
  daysLate: number;
  daysOnDuty: number;
  daysSickLeave: number;
  daysAbsent: number;
  totalWorkingDays: number;
  attendanceRate: number; // e.g. 96.5%
  remarks: string;
}

