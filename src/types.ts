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

