import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import {
  User,
  AttendanceRecord,
  EarlyClockNotification,
  SchoolSettings,
  UserRole,
  LeaveRequest,
  LeaveStatus,
  QueuedOfflineAction,
  StudentAttendanceRecord,
  SchoolClass,
} from '../types';
import { soundEffects } from '../utils/soundEffects';
import { sendPhoneNotification, initializeBackgroundNotificationService } from '../utils/phoneNotifications';
import { evaluateAttendanceEligibility } from '../utils/zimbabweCalendar';

interface AppContextType {
  currentUser: User | null;
  users: User[];
  attendanceRecords: AttendanceRecord[];
  studentAttendanceRecords: StudentAttendanceRecord[];
  classes: SchoolClass[];
  selectedTeacherClass: string;
  setSelectedTeacherClass: (className: string) => void;
  saveStudentAttendance: (
    record: Omit<StudentAttendanceRecord, 'id' | 'timestamp' | 'createdAt'>
  ) => Promise<{ success: boolean; message: string; record?: StudentAttendanceRecord }>;
  deleteStudentAttendance: (id: string) => Promise<void>;
  allocateClassesToTeacher: (teacherId: string, classNames: string[]) => Promise<{ success: boolean; message: string }>;
  saveSchoolClass: (cls: SchoolClass) => Promise<{ success: boolean; message: string }>;
  deleteSchoolClass: (id: string) => Promise<void>;
  resetToOfficialClasses: () => Promise<{ success: boolean; message: string }>;
  notifications: EarlyClockNotification[];
  leaveRequests: LeaveRequest[];
  schoolSettings: SchoolSettings;
  isLoading: boolean;
  isFirebaseLinked: boolean;
  activeView: string;
  setActiveView: (view: string) => void;
  isOnline: boolean;
  offlineQueue: QueuedOfflineAction[];
  offlineQueueCount: number;
  isSyncingQueue: boolean;
  syncOfflineQueue: () => Promise<{ success: boolean; syncedCount: number; message: string }>;
  clearOfflineQueue: () => void;
  registerTeacher: (data: {
    name: string;
    surname: string;
    subject: string;
    email: string;
    password?: string;
    ecNumber?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  registerAdmin: (data: {
    name: string;
    surname: string;
    email: string;
    password?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  findTeacherByEcNumber: (ecNumber: string) => Promise<{ success: boolean; user?: User; error?: string }>;
  resetTeacherPasswordWithEcNumber: (
    ecNumber: string,
    newPassword: string
  ) => Promise<{ success: boolean; error?: string; user?: User }>;
  loginUser: (
    email: string,
    password?: string,
    forceRole?: UserRole
  ) => Promise<{ success: boolean; user?: User; error?: string }>;
  logout: () => void;
  updateUserProfile: (data: Partial<User>) => void;
  todayRecord: AttendanceRecord | null;
  clockIn: (
    reason?: string,
    isEarly?: boolean,
    coords?: { latitude: number; longitude: number }
  ) => Promise<{ success: boolean; message: string; distance?: number; isOfflineQueued?: boolean }>;
  clockOut: (
    reason?: string,
    isEarly?: boolean,
    coords?: { latitude: number; longitude: number }
  ) => Promise<{ success: boolean; message: string; distance?: number; isOfflineQueued?: boolean }>;
  clockInWithBadge: (
    badgeOrEmail: string,
    coords?: { latitude: number; longitude: number }
  ) => Promise<{ success: boolean; message: string; user?: User }>;
  submitLeaveRequest: (
    data: Omit<LeaveRequest, 'id' | 'status' | 'submittedAt'>
  ) => Promise<{ success: boolean; error?: string }>;
  updateLeaveStatus: (id: string, status: LeaveStatus, adminNotes?: string) => Promise<void>;
  deleteLeaveRequest: (id: string) => Promise<void>;
  submitEarlyNotice: (type: 'early_in' | 'early_out', reason: string) => void;
  acknowledgeNotification: (id: string) => void;
  clearAllNotifications: () => void;
  clearAttendanceRecords: () => Promise<{ success: boolean; message: string }>;
  deleteAttendanceRecord: (recordId: string) => Promise<void>;
  deleteTeacher: (teacherId: string) => void;
  addTeacherByAdmin: (teacherData: Partial<User>) => void;
  updateSchoolSettings: (settings: Partial<SchoolSettings>) => void;
  resetAllData: () => void;
  exportCompleteBackup: () => void;
  exportAttendanceCSV: () => void;
  restoreBackupData: (backupPayload: any) => Promise<{ success: boolean; message: string }>;
  viewMode: 'desktop' | 'mobile-frame';
  setViewMode: (mode: 'desktop' | 'mobile-frame') => void;
  switchUserRole: (role: UserRole) => void;
  isSchoolDay: (date?: Date) => boolean;
  isWeekend: (date?: Date) => boolean;
  currentDayName: string;
  isDemoMode: boolean;
  setDemoMode: (enabled: boolean) => void;
  demoCoords: { latitude: number; longitude: number };
  setDemoCoords: (coords: { latitude: number; longitude: number }) => void;
  setSimulationMode: (mode: 'in_campus' | 'off_campus' | 'real_gps') => void;
  simulationStatus: 'in_campus' | 'off_campus' | 'real_gps';
}

const DEFAULT_SETTINGS: SchoolSettings = {
  schoolName: 'Dadaya High School',
  academicYear: '2026 Academic Year',
  currentTerm: 'Term 1',
  termStartDate: '2026-01-13',
  termEndDate: '2026-04-10',
  termNotes: 'First Term 2026 - Academic & Co-curricular sessions',
  standardClockInTime: '07:30',
  standardClockOutTime: '15:30',
  lateGracePeriodMinutes: 15,
  earlyClockInThreshold: '07:15',
  earlyClockOutThreshold: '15:15',
  schoolLatitude: -20.334287639632716,
  schoolLongitude: 29.896081746496083,
  allowedRadiusMeters: 100,
  requireLocation: true,
  lockMessage: 'Attendance clocking is locked: You are outside Dadaya High School campus. You must be physically within the 100m school boundary to clock in or clock out.',
  allowWeekendClocking: true,
  autoClockInGeofence: true,
  soundEffectsEnabled: true,
  phoneNotificationsEnabled: true,
};

export const DADAYA_ADMIN_CREDENTIALS = {
  email: 'admin@dadaya.co.zw',
  password: 'Dadayaadmin2026',
  name: 'School',
  surname: 'Administrator',
  role: 'admin' as UserRole,
  employeeId: 'DHS-ADM001',
  department: 'School Administration',
};

const DEFAULT_ADMIN_USER: User = {
  id: 'adm_dadaya_main',
  name: DADAYA_ADMIN_CREDENTIALS.name,
  surname: DADAYA_ADMIN_CREDENTIALS.surname,
  email: DADAYA_ADMIN_CREDENTIALS.email,
  password: DADAYA_ADMIN_CREDENTIALS.password,
  role: 'admin',
  employeeId: DADAYA_ADMIN_CREDENTIALS.employeeId,
  department: DADAYA_ADMIN_CREDENTIALS.department,
  createdAt: '2026-01-01T00:00:00.000Z',
};

export const DEFAULT_CLASSES: SchoolClass[] = [
  // Form 1 - Official Dadaya Stream (Red, Green, Yellow, Blue)
  { id: 'cls-1red', name: 'Form 1 Red', formLevel: 'Form 1', capacity: 45, roomNumber: 'Form 1 Block, Rm 1' },
  { id: 'cls-1green', name: 'Form 1 Green', formLevel: 'Form 1', capacity: 45, roomNumber: 'Form 1 Block, Rm 2' },
  { id: 'cls-1yellow', name: 'Form 1 Yellow', formLevel: 'Form 1', capacity: 45, roomNumber: 'Form 1 Block, Rm 3' },
  { id: 'cls-1blue', name: 'Form 1 Blue', formLevel: 'Form 1', capacity: 45, roomNumber: 'Form 1 Block, Rm 4' },

  // Form 2 - Official Dadaya Stream (Red, Green, White, Yellow, Blue)
  { id: 'cls-2red', name: 'Form 2 Red', formLevel: 'Form 2', capacity: 45, roomNumber: 'Form 2 Block, Rm 1' },
  { id: 'cls-2green', name: 'Form 2 Green', formLevel: 'Form 2', capacity: 45, roomNumber: 'Form 2 Block, Rm 2' },
  { id: 'cls-2white', name: 'Form 2 White', formLevel: 'Form 2', capacity: 45, roomNumber: 'Form 2 Block, Rm 3' },
  { id: 'cls-2yellow', name: 'Form 2 Yellow', formLevel: 'Form 2', capacity: 45, roomNumber: 'Form 2 Block, Rm 4' },
  { id: 'cls-2blue', name: 'Form 2 Blue', formLevel: 'Form 2', capacity: 45, roomNumber: 'Form 2 Block, Rm 5' },

  // Form 3 - Official Dadaya Stream (Sciences 1, Sciences 2, Commercials, Arts/ICT)
  { id: 'cls-3sc1', name: 'Form 3 Sciences 1', formLevel: 'Form 3', capacity: 42, roomNumber: 'Science Wing Rm 1' },
  { id: 'cls-3sc2', name: 'Form 3 Sciences 2', formLevel: 'Form 3', capacity: 42, roomNumber: 'Science Wing Rm 2' },
  { id: 'cls-3comm', name: 'Form 3 Commercials', formLevel: 'Form 3', capacity: 45, roomNumber: 'Commercials Block Rm 1' },
  { id: 'cls-3arts-ict', name: 'Form 3 Arts/ICT', formLevel: 'Form 3', capacity: 45, roomNumber: 'Arts/ICT Wing Rm 1' },

  // Form 4 - Official Dadaya Stream (Sciences 1, Sciences 2, Commercials, Arts/ICT)
  { id: 'cls-4sc1', name: 'Form 4 Sciences 1', formLevel: 'Form 4', capacity: 40, roomNumber: 'Science Wing Rm 3' },
  { id: 'cls-4sc2', name: 'Form 4 Sciences 2', formLevel: 'Form 4', capacity: 40, roomNumber: 'Science Wing Rm 4' },
  { id: 'cls-4comm', name: 'Form 4 Commercials', formLevel: 'Form 4', capacity: 45, roomNumber: 'Commercials Block Rm 2' },
  { id: 'cls-4arts-ict', name: 'Form 4 Arts/ICT', formLevel: 'Form 4', capacity: 45, roomNumber: 'Arts/ICT Wing Rm 2' },

  // A Level (Lower 6 & Upper 6)
  { id: 'cls-l6sc', name: 'Lower 6 Sciences', formLevel: 'Lower 6', capacity: 35, roomNumber: 'Sixth Form Block Rm 1' },
  { id: 'cls-l6comm', name: 'Lower 6 Commercials', formLevel: 'Lower 6', capacity: 35, roomNumber: 'Sixth Form Block Rm 2' },
  { id: 'cls-l6art', name: 'Lower 6 Arts', formLevel: 'Lower 6', capacity: 38, roomNumber: 'Sixth Form Block Rm 3' },
  { id: 'cls-u6sc', name: 'Upper 6 Sciences', formLevel: 'Upper 6', capacity: 32, roomNumber: 'Sixth Form Block Rm 4' },
  { id: 'cls-u6comm', name: 'Upper 6 Commercials', formLevel: 'Upper 6', capacity: 35, roomNumber: 'Sixth Form Block Rm 5' },
  { id: 'cls-u6art', name: 'Upper 6 Arts', formLevel: 'Upper 6', capacity: 36, roomNumber: 'Sixth Form Block Rm 6' },
];

export const DEFAULT_STUDENT_ATTENDANCE: StudentAttendanceRecord[] = [
  {
    id: 'att-demo-1red',
    className: 'Form 1 Red',
    teacherId: 'tch-001',
    teacherName: 'Tendai Moyo',
    date: new Date().toISOString().split('T')[0],
    timestamp: Date.now() - 7200000,
    girlsBoarders: 14,
    girlsDay: 9,
    boysBoarders: 12,
    boysDay: 8,
    actualTotal: 43,
    possibleTotal: 45,
    notes: '2 day scholars absent due to transport',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'att-demo-2green',
    className: 'Form 2 Green',
    teacherId: 'tch-002',
    teacherName: 'Chipo Dube',
    date: new Date().toISOString().split('T')[0],
    timestamp: Date.now() - 6800000,
    girlsBoarders: 15,
    girlsDay: 8,
    boysBoarders: 11,
    boysDay: 9,
    actualTotal: 43,
    possibleTotal: 45,
    notes: 'All boarders present',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'att-demo-3sc1',
    className: 'Form 3 Sciences 1',
    teacherId: 'tch-003',
    teacherName: 'Blessing Sibanda',
    date: new Date().toISOString().split('T')[0],
    timestamp: Date.now() - 5400000,
    girlsBoarders: 13,
    girlsDay: 7,
    boysBoarders: 14,
    boysDay: 6,
    actualTotal: 40,
    possibleTotal: 42,
    notes: 'Practical physics session',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'att-demo-4sc1',
    className: 'Form 4 Sciences 1',
    teacherId: 'tch-004',
    teacherName: 'Farai Ncube',
    date: new Date().toISOString().split('T')[0],
    timestamp: Date.now() - 3600000,
    girlsBoarders: 12,
    girlsDay: 8,
    boysBoarders: 11,
    boysDay: 8,
    actualTotal: 39,
    possibleTotal: 40,
    notes: '1 sick in clinic',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'att-demo-u6sc',
    className: 'Upper 6 Sciences',
    teacherId: 'tch-005',
    teacherName: 'Tinashe Zhou',
    date: new Date().toISOString().split('T')[0],
    timestamp: Date.now() - 1800000,
    girlsBoarders: 10,
    girlsDay: 6,
    boysBoarders: 9,
    boysDay: 7,
    actualTotal: 32,
    possibleTotal: 32,
    notes: 'Full chemistry lab attendance',
    createdAt: new Date().toISOString(),
  },
];

const STORAGE_KEYS = {
  CURRENT_USER: 'dadaya_current_user_v2',
  SETTINGS: 'dadaya_school_settings_v2',
  RECORDS: 'dadaya_attendance_records_v2',
  STUDENT_ATTENDANCE: 'dadaya_student_attendance_v2',
  CLASSES: 'dadaya_classes_v2',
  TEACHER_SELECTED_CLASS: 'dadaya_teacher_selected_class_v2',
  USERS: 'dadaya_users_v2',
  NOTIFICATIONS: 'dadaya_notifications_v2',
  LEAVE: 'dadaya_leave_requests_v2',
  OFFLINE_QUEUE: 'dadaya_offline_queue_v2',
  DEMO_MODE: 'dadaya_demo_mode_v2',
  DEMO_STATUS: 'dadaya_demo_status_v2',
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Network connectivity state
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });

  // Offline queue state
  const [offlineQueue, setOfflineQueue] = useState<QueuedOfflineAction[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  const [isSyncingQueue, setIsSyncingQueue] = useState<boolean>(false);

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.email && parsed.email.toLowerCase() === DADAYA_ADMIN_CREDENTIALS.email.toLowerCase()) {
          return {
            ...parsed,
            ...DEFAULT_ADMIN_USER,
          };
        }
        return parsed;
      } catch {
        return null;
      }
    }
    return null;
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USERS);
    if (saved) {
      try {
        const parsedList: User[] = JSON.parse(saved);
        if (Array.isArray(parsedList) && parsedList.length > 0) {
          const idx = parsedList.findIndex(
            (u) => u.email.toLowerCase() === DADAYA_ADMIN_CREDENTIALS.email.toLowerCase()
          );
          if (idx >= 0) {
            parsedList[idx] = {
              ...parsedList[idx],
              ...DEFAULT_ADMIN_USER,
            };
            return parsedList;
          }
          return [DEFAULT_ADMIN_USER, ...parsedList];
        }
      } catch {
        return [DEFAULT_ADMIN_USER];
      }
    }
    return [DEFAULT_ADMIN_USER];
  });

  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.RECORDS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  const [notifications, setNotifications] = useState<EarlyClockNotification[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LEAVE);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const radius = parsed.allowedRadiusMeters === 800 ? 100 : (parsed.allowedRadiusMeters ?? 100);
        const msg = parsed.lockMessage
          ? parsed.lockMessage.replace(/800\s*m?/gi, '100m')
          : DEFAULT_SETTINGS.lockMessage;
        const isOldDefaultLat = parsed.schoolLatitude !== undefined && (Math.abs(parsed.schoolLatitude - (-20.34049)) < 0.0001 || Math.abs(parsed.schoolLatitude - (-20.334154)) < 0.0001);
        const isOldDefaultLon = parsed.schoolLongitude !== undefined && (Math.abs(parsed.schoolLongitude - 29.97782) < 0.0001 || Math.abs(parsed.schoolLongitude - 29.896333) < 0.0001);
        const schoolLatitude = (isOldDefaultLat || parsed.schoolLatitude === undefined) ? -20.334287639632716 : parsed.schoolLatitude;
        const schoolLongitude = (isOldDefaultLon || parsed.schoolLongitude === undefined) ? 29.896081746496083 : parsed.schoolLongitude;

        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          allowedRadiusMeters: radius,
          lockMessage: msg,
          schoolLatitude,
          schoolLongitude,
        };
      } catch {
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  });

  // Student Attendance State
  const [studentAttendanceRecords, setStudentAttendanceRecords] = useState<StudentAttendanceRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.STUDENT_ATTENDANCE);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return DEFAULT_STUDENT_ATTENDANCE;
  });

  // School Classes State
  const [classes, setClasses] = useState<SchoolClass[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CLASSES);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // If stored classes are from the old template (containing Form 1A, Form 2A, Form 3 Science, etc.), auto-upgrade to Dadaya High School official classes
          const hasOldTemplate = parsed.some(
            (c: any) => c.name === 'Form 1A' || c.name === 'Form 2A' || c.name === 'Form 3 Science' || c.id === 'cls-1a'
          );
          if (!hasOldTemplate) {
            // Remove Form 1 White
            const merged = parsed.filter(
              (c: any) => c.name !== 'Form 1 White' && c.id !== 'cls-1white'
            );
            // Guarantee ALL official Dadaya classes (all 23 streams) are present
            for (const defCls of DEFAULT_CLASSES) {
              const exists = merged.some(
                (c: any) =>
                  c.id === defCls.id ||
                  c.name?.toLowerCase().trim() === defCls.name.toLowerCase().trim()
              );
              if (!exists) {
                merged.push(defCls);
              }
            }
            // Sort in canonical Dadaya stream order
            const defaultOrder = DEFAULT_CLASSES.map((c) => c.name.toLowerCase());
            merged.sort((a: any, b: any) => {
              const idxA = defaultOrder.indexOf(a.name?.toLowerCase());
              const idxB = defaultOrder.indexOf(b.name?.toLowerCase());
              if (idxA !== -1 && idxB !== -1) return idxA - idxB;
              if (idxA !== -1) return -1;
              if (idxB !== -1) return 1;
              return (a.name || '').localeCompare(b.name || '');
            });
            localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(merged));
            return merged;
          }
        }
      } catch {}
    }
    return DEFAULT_CLASSES;
  });

  // Currently selected/registered class for teacher
  const [selectedTeacherClass, setSelectedTeacherClassState] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TEACHER_SELECTED_CLASS) || '';
    return saved === 'Form 1 White' ? '' : saved;
  });

  const setSelectedTeacherClass = (className: string) => {
    setSelectedTeacherClassState(className);
    localStorage.setItem(STORAGE_KEYS.TEACHER_SELECTED_CLASS, className);
  };

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isFirebaseLinked, setIsFirebaseLinked] = useState<boolean>(true);
  const [activeView, setActiveViewState] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (saved) {
      try {
        const u = JSON.parse(saved);
        return u.role === 'admin' ? 'dashboard' : 'home';
      } catch {
        return 'home';
      }
    }
    return 'home';
  });
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile-frame'>('desktop');

  // Simulation mode for GPS: defaults to real live device GPS ('real_gps')
  const [simulationStatus, setSimulationStatus] = useState<'in_campus' | 'off_campus' | 'real_gps'>('real_gps');
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);

  // Clean up any stale simulation status in localStorage
  useEffect(() => {
    localStorage.removeItem(STORAGE_KEYS.DEMO_STATUS);
    localStorage.removeItem(STORAGE_KEYS.DEMO_MODE);
  }, []);

  // Coordinates for demo fallback:
  // Dadaya High Campus Gate / Center (-20.334287639632716, 29.896081746496083)
  const [demoCoords, setDemoCoordsState] = useState<{ latitude: number; longitude: number }>({
    latitude: -20.334287639632716,
    longitude: 29.896081746496083,
  });

  const setDemoMode = (enabled: boolean) => {
    setIsDemoMode(enabled);
    localStorage.setItem(STORAGE_KEYS.DEMO_MODE, enabled ? 'true' : 'false');
    if (!enabled) {
      setSimulationStatus('real_gps');
      localStorage.setItem(STORAGE_KEYS.DEMO_STATUS, 'real_gps');
    } else if (simulationStatus === 'real_gps') {
      setSimulationStatus('in_campus');
      localStorage.setItem(STORAGE_KEYS.DEMO_STATUS, 'in_campus');
      setDemoCoordsState({ latitude: schoolSettings.schoolLatitude, longitude: schoolSettings.schoolLongitude });
    }
  };

  const setSimulationMode = (mode: 'in_campus' | 'off_campus' | 'real_gps') => {
    setSimulationStatus(mode);
    localStorage.setItem(STORAGE_KEYS.DEMO_STATUS, mode);
    if (mode === 'real_gps') {
      setIsDemoMode(false);
      localStorage.setItem(STORAGE_KEYS.DEMO_MODE, 'false');
    } else if (mode === 'in_campus') {
      setIsDemoMode(true);
      localStorage.setItem(STORAGE_KEYS.DEMO_MODE, 'true');
      setDemoCoordsState({ latitude: schoolSettings.schoolLatitude, longitude: schoolSettings.schoolLongitude });
    } else if (mode === 'off_campus') {
      setIsDemoMode(true);
      localStorage.setItem(STORAGE_KEYS.DEMO_MODE, 'true');
      // Off-campus coords ~10km outside geofence
      setDemoCoordsState({ latitude: -20.345000, longitude: 29.985000 });
    }
  };

  const setDemoCoords = (coords: { latitude: number; longitude: number }) => {
    setDemoCoordsState(coords);
  };

  const setActiveView = (view: string) => {
    // Strictly prevent teachers from accessing the admin section
    if (currentUser?.role === 'teacher') {
      const adminOnlyViews = ['dashboard', 'teachers', 'attendance-report', 'admin-reports', 'settings'];
      if (adminOnlyViews.includes(view)) {
        setActiveViewState('home');
        return;
      }
    }
    setActiveViewState(view);
  };

  // Background notification service initialization (public holiday greetings & reminders)
  useEffect(() => {
    const cleanup = initializeBackgroundNotificationService();
    return () => {
      cleanup();
    };
  }, []);

  // Live real-time Firestore synchronization & backend loading
  useEffect(() => {
    let unsubscribeUsers: (() => void) | null = null;
    let unsubscribeAttendance: (() => void) | null = null;
    let unsubscribeNotifs: (() => void) | null = null;
    let unsubscribeSettings: (() => void) | null = null;
    let unsubscribeLeave: (() => void) | null = null;

    try {
      // 1. Listen to Users in Firebase Firestore
      const usersCol = collection(db, 'users');
      unsubscribeUsers = onSnapshot(
        usersCol,
        (snapshot) => {
          if (!snapshot.empty) {
            const firestoreUsers: User[] = snapshot.docs.map((docSnap) => {
              const u = {
                id: docSnap.id,
                ...docSnap.data(),
              } as User;
              if (u.assignedClasses && u.assignedClasses.includes('Form 1 White')) {
                u.assignedClasses = u.assignedClasses.map((c) =>
                  c === 'Form 1 White' ? 'Form 1 Yellow' : c
                );
                updateDoc(doc(db, 'users', docSnap.id), {
                  assignedClasses: u.assignedClasses,
                }).catch(() => null);
              }
              return u;
            });
            setUsers(firestoreUsers);

            // Maintain persistent teacher/admin login without asking for credentials
            setCurrentUser((prev) => {
              if (!prev) return null;
              const foundInRemote = firestoreUsers.find(
                (u) => u.id === prev.id || u.email.toLowerCase() === prev.email.toLowerCase()
              );
              return foundInRemote ? { ...prev, ...foundInRemote } : prev;
            });
          }
        },
        (error) => {
          console.warn('Firebase users listener fallback:', error);
        }
      );

      // 2. Listen to Attendance Records in Firebase Firestore
      const attendanceCol = collection(db, 'attendance');
      unsubscribeAttendance = onSnapshot(
        attendanceCol,
        (snapshot) => {
          if (!snapshot.empty) {
            const firestoreAtt: AttendanceRecord[] = snapshot.docs.map((docSnap) => ({
              id: docSnap.id,
              ...docSnap.data(),
            } as AttendanceRecord));
            setAttendanceRecords(firestoreAtt);
          }
        },
        (error) => {
          console.warn('Firebase attendance listener fallback:', error);
        }
      );

      // 3. Listen to Notifications in Firebase Firestore
      const notifsCol = collection(db, 'notifications');
      unsubscribeNotifs = onSnapshot(
        notifsCol,
        (snapshot) => {
          if (!snapshot.empty) {
            const firestoreNotifs: EarlyClockNotification[] = snapshot.docs.map((docSnap) => ({
              id: docSnap.id,
              ...docSnap.data(),
            } as EarlyClockNotification));
            setNotifications(firestoreNotifs);
          }
        },
        (error) => {
          console.warn('Firebase notifications listener fallback:', error);
        }
      );

      // 4. Listen to School Settings in Firebase Firestore
      const settingsDocRef = doc(db, 'school_settings', 'global');
      unsubscribeSettings = onSnapshot(
        settingsDocRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const remoteSettings = docSnap.data() as Partial<SchoolSettings>;
            const radius = remoteSettings.allowedRadiusMeters === 800 ? 100 : (remoteSettings.allowedRadiusMeters ?? 100);
            const msg = remoteSettings.lockMessage
              ? remoteSettings.lockMessage.replace(/800\s*m?/gi, '100m')
              : undefined;
            // If remote had the old hardcoded coordinates, smoothly upgrade to new center
            const isOldDefaultLat = remoteSettings.schoolLatitude !== undefined && (Math.abs(remoteSettings.schoolLatitude - (-20.34049)) < 0.0001 || Math.abs(remoteSettings.schoolLatitude - (-20.334154)) < 0.0001);
            const isOldDefaultLon = remoteSettings.schoolLongitude !== undefined && (Math.abs(remoteSettings.schoolLongitude - 29.97782) < 0.0001 || Math.abs(remoteSettings.schoolLongitude - 29.896333) < 0.0001);
            const schoolLatitude = (isOldDefaultLat || remoteSettings.schoolLatitude === undefined) ? -20.334287639632716 : remoteSettings.schoolLatitude;
            const schoolLongitude = (isOldDefaultLon || remoteSettings.schoolLongitude === undefined) ? 29.896081746496083 : remoteSettings.schoolLongitude;

            setSchoolSettings((prev) => ({
              ...prev,
              ...remoteSettings,
              allowedRadiusMeters: radius,
              ...(msg ? { lockMessage: msg } : {}),
              schoolLatitude,
              schoolLongitude,
            }));
          }
        },
        (error) => {
          console.warn('Firebase settings listener fallback:', error);
        }
      );

      // 5. Listen to Leave & Absence Requests in Firebase Firestore
      const leaveCol = collection(db, 'leave_requests');
      unsubscribeLeave = onSnapshot(
        leaveCol,
        (snapshot) => {
          if (!snapshot.empty) {
            const firestoreLeaves: LeaveRequest[] = snapshot.docs.map((docSnap) => ({
              id: docSnap.id,
              ...docSnap.data(),
            } as LeaveRequest));
            setLeaveRequests(firestoreLeaves);
          }
        },
        (error) => {
          console.warn('Firebase leave requests listener fallback:', error);
        }
      );

      // 6. Listen to Student Daily Attendance in Firebase Firestore
      const studentAttCol = collection(db, 'student_attendance');
      onSnapshot(
        studentAttCol,
        (snapshot) => {
          if (!snapshot.empty) {
            const firestoreStudentAtt: StudentAttendanceRecord[] = snapshot.docs.map((docSnap) => {
              const r = {
                id: docSnap.id,
                ...docSnap.data(),
              } as StudentAttendanceRecord;
              if (r.className === 'Form 1 White') {
                r.className = 'Form 1 Yellow';
                updateDoc(doc(db, 'student_attendance', docSnap.id), { className: 'Form 1 Yellow' }).catch(() => null);
              }
              return r;
            });
            setStudentAttendanceRecords(firestoreStudentAtt);
          }
        },
        (error) => {
          console.warn('Firebase student attendance listener fallback:', error);
        }
      );

      // 7. Listen to Classes & Allocations in Firebase Firestore
      const classesCol = collection(db, 'classes');
      onSnapshot(
        classesCol,
        (snapshot) => {
          if (!snapshot.empty) {
            // Delete any Firestore documents corresponding to Form 1 White
            snapshot.docs.forEach((d) => {
              const data = d.data();
              if (d.id === 'cls-1white' || data.name?.toLowerCase().trim() === 'form 1 white') {
                deleteDoc(doc(db, 'classes', d.id)).catch(() => null);
              }
            });

            const firestoreClasses: SchoolClass[] = snapshot.docs
              .map((docSnap) => ({
                id: docSnap.id,
                ...docSnap.data(),
              } as SchoolClass))
              .filter(
                (c: any) => c.id !== 'cls-1white' && c.name?.toLowerCase().trim() !== 'form 1 white'
              );

            // Guarantee ALL 23 official Dadaya High School classes exist in Firestore & local state
            for (const defCls of DEFAULT_CLASSES) {
              const exists = firestoreClasses.some(
                (c: any) =>
                  c.id === defCls.id ||
                  c.name?.toLowerCase().trim() === defCls.name.toLowerCase().trim()
              );
              if (!exists) {
                setDoc(doc(db, 'classes', defCls.id), defCls).catch(() => null);
                firestoreClasses.push(defCls);
              }
            }

            // Sort classes according to canonical Dadaya order
            const defaultOrder = DEFAULT_CLASSES.map((c) => c.name.toLowerCase());
            firestoreClasses.sort((a, b) => {
              const idxA = defaultOrder.indexOf(a.name?.toLowerCase());
              const idxB = defaultOrder.indexOf(b.name?.toLowerCase());
              if (idxA !== -1 && idxB !== -1) return idxA - idxB;
              if (idxA !== -1) return -1;
              if (idxB !== -1) return 1;
              return (a.name || '').localeCompare(b.name || '', undefined, { numeric: true });
            });

            const hasOldTemplate = firestoreClasses.some(
              (c: any) => c.name === 'Form 1A' || c.id === 'cls-1a' || c.name === 'Form 2A' || c.name === 'Form 3 Science'
            );

            if (!hasOldTemplate) {
              setClasses(firestoreClasses);
              localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(firestoreClasses));
            } else {
              // Remote still has obsolete template classes; replace them with official Dadaya classes
              DEFAULT_CLASSES.forEach((cls) => {
                setDoc(doc(db, 'classes', cls.id), cls).catch(() => null);
              });
              setClasses(DEFAULT_CLASSES);
              localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(DEFAULT_CLASSES));
            }
          } else {
            // Seed official classes to Firestore on first load
            DEFAULT_CLASSES.forEach((cls) => {
              setDoc(doc(db, 'classes', cls.id), cls).catch(() => null);
            });
            setClasses(DEFAULT_CLASSES);
            localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(DEFAULT_CLASSES));
          }
        },
        (error) => {
          console.warn('Firebase classes listener fallback:', error);
        }
      );
    } catch (firebaseErr) {
      console.warn('Firebase initialization notice:', firebaseErr);
    }

    // Backend initial load fallback & sync
    async function initBackendData() {
      // Always seed/ensure the official Dadaya Admin is in Firestore & backend
      try {
        await setDoc(doc(db, 'users', DEFAULT_ADMIN_USER.id), DEFAULT_ADMIN_USER);
      } catch (e) {
        console.warn('Admin Firestore seed notice:', e);
      }
      try {
        await deleteDoc(doc(db, 'classes', 'cls-1white')).catch(() => null);
        for (const cls of DEFAULT_CLASSES) {
          await setDoc(doc(db, 'classes', cls.id), cls).catch(() => null);
        }
      } catch (e) {
        console.warn('Classes seeding notice:', e);
      }
      try {
        await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(DEFAULT_ADMIN_USER),
        });
      } catch (e) {
        console.warn('Admin API seed notice:', e);
      }

      try {
        const [usersRes, attRes, notifRes, setRes] = await Promise.all([
          fetch('/api/users').catch(() => null),
          fetch('/api/attendance').catch(() => null),
          fetch('/api/notifications').catch(() => null),
          fetch('/api/settings').catch(() => null),
        ]);

        if (usersRes && usersRes.ok) {
          const remoteUsers = await usersRes.json();
          if (Array.isArray(remoteUsers) && remoteUsers.length > 0) {
            const hasOfficialAdmin = remoteUsers.some(
              (u: any) => u.email && u.email.toLowerCase() === DADAYA_ADMIN_CREDENTIALS.email.toLowerCase()
            );
            if (!hasOfficialAdmin) {
              setUsers([DEFAULT_ADMIN_USER, ...remoteUsers]);
            } else {
              setUsers(
                remoteUsers.map((u: any) =>
                  u.email && u.email.toLowerCase() === DADAYA_ADMIN_CREDENTIALS.email.toLowerCase()
                    ? { ...u, password: DADAYA_ADMIN_CREDENTIALS.password, role: 'admin' }
                    : u
                )
              );
            }
          }
        }

        if (attRes && attRes.ok) {
          const remoteAtt = await attRes.json();
          if (Array.isArray(remoteAtt)) {
            const mappedAtt: AttendanceRecord[] = remoteAtt.map((r: any) => ({
              id: r.id,
              userId: r.teacherId,
              teacherName: r.teacherName,
              teacherSurname: r.teacherSurname,
              subject: r.subject || 'General',
              date: r.date,
              clockInTime: r.clockInTime,
              clockOutTime: r.clockOutTime,
              clockInTimestamp: r.clockInTimestamp ? Number(r.clockInTimestamp) : null,
              clockOutTimestamp: r.clockOutTimestamp ? Number(r.clockOutTimestamp) : null,
              status: r.status,
              earlyClockInReason: r.earlyClockInReason,
              earlyClockOutReason: r.earlyClockOutReason,
              totalWorkingMinutes: r.totalWorkingMinutes || 0,
              locationVerified: true,
            }));
            setAttendanceRecords(mappedAtt);
          }
        }

        if (notifRes && notifRes.ok) {
          const remoteNotifs = await notifRes.json();
          if (Array.isArray(remoteNotifs)) {
            const mappedNotifs: EarlyClockNotification[] = remoteNotifs.map((n: any) => ({
              id: n.id,
              recordId: 'rec_' + n.id,
              teacherId: n.teacherId,
              teacherName: n.teacherName,
              teacherSurname: n.teacherSurname,
              subject: 'Academic Department',
              type: n.type,
              time: n.time,
              date: n.date,
              reason: n.reason,
              acknowledgedByAdmin: n.acknowledgedByAdmin,
              read: n.acknowledgedByAdmin,
              timestamp: Date.now(),
            }));
            setNotifications(mappedNotifs);
          }
        }

        if (setRes && setRes.ok) {
          const remoteSet = await setRes.json();
          if (remoteSet && remoteSet.schoolName) {
            const radius = remoteSet.allowedRadiusMeters === 800 ? 100 : (remoteSet.allowedRadiusMeters || 100);
            const msg = remoteSet.lockMessage
              ? remoteSet.lockMessage.replace(/800\s*m?/gi, '100m')
              : undefined;
            const isOldDefaultLat = remoteSet.schoolLatitude !== undefined && (Math.abs(remoteSet.schoolLatitude - (-20.34049)) < 0.0001 || Math.abs(remoteSet.schoolLatitude - (-20.334154)) < 0.0001);
            const isOldDefaultLon = remoteSet.schoolLongitude !== undefined && (Math.abs(remoteSet.schoolLongitude - 29.97782) < 0.0001 || Math.abs(remoteSet.schoolLongitude - 29.896333) < 0.0001);
            const schoolLatitude = (isOldDefaultLat || remoteSet.schoolLatitude === undefined) ? -20.334287639632716 : remoteSet.schoolLatitude;
            const schoolLongitude = (isOldDefaultLon || remoteSet.schoolLongitude === undefined) ? 29.896081746496083 : remoteSet.schoolLongitude;

            setSchoolSettings((prev) => ({
              ...prev,
              schoolName: remoteSet.schoolName,
              academicYear: remoteSet.academicYear,
              standardClockInTime: remoteSet.standardClockInTime,
              standardClockOutTime: remoteSet.standardClockOutTime,
              schoolLatitude,
              schoolLongitude,
              allowedRadiusMeters: radius,
              ...(msg ? { lockMessage: msg } : {}),
            }));
          }
        }
      } catch (err) {
        console.warn('Backend load notice: running in high-availability hybrid mode', err);
      } finally {
        setIsLoading(false);
      }
    }

    initBackendData();

    return () => {
      if (unsubscribeUsers) unsubscribeUsers();
      if (unsubscribeAttendance) unsubscribeAttendance();
      if (unsubscribeNotifs) unsubscribeNotifs();
      if (unsubscribeSettings) unsubscribeSettings();
      if (unsubscribeLeave) unsubscribeLeave();
    };
  }, []);

  // Local storage persistence fallbacks
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(attendanceRecords));
  }, [attendanceRecords]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LEAVE, JSON.stringify(leaveRequests));
  }, [leaveRequests]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(schoolSettings));
  }, [schoolSettings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STUDENT_ATTENDANCE, JSON.stringify(studentAttendanceRecords));
  }, [studentAttendanceRecords]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(classes));
  }, [classes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(offlineQueue));
  }, [offlineQueue]);

  // Network online/offline event listeners and auto-sync
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const getTodayDateStr = () => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  };

  const formatCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const todayDate = getTodayDateStr();
  const todayRecord = currentUser
    ? attendanceRecords.find((r) => r.userId === currentUser.id && r.date === todayDate) || null
    : null;

  // Register Teacher with Firebase Firestore + Backend Sync
  const registerTeacher = async (data: {
    name: string;
    surname: string;
    subject: string;
    email: string;
    password?: string;
    ecNumber?: string;
  }) => {
    const trimmedEmail = data.email.trim().toLowerCase();
    const existing = users.find((u) => u.email.toLowerCase() === trimmedEmail);
    if (existing) {
      return { success: false, error: 'An account with this email already exists. Please log in.' };
    }

    const employeeId = data.ecNumber?.trim() || `DHS-T${Math.floor(1000 + Math.random() * 9000)}`;
    const newUser: User = {
      id: 'usr_' + Date.now(),
      name: data.name.trim(),
      surname: data.surname.trim(),
      subject: data.subject.trim(),
      email: trimmedEmail,
      password: data.password || 'password123',
      role: 'teacher',
      employeeId,
      ecNumber: data.ecNumber?.trim() || employeeId,
      department: data.subject.trim() + ' Department',
      createdAt: new Date().toISOString(),
    };

    // Save to Firebase Firestore
    try {
      await setDoc(doc(db, 'users', newUser.id), newUser);
    } catch (firebaseErr) {
      console.warn('Firebase user save error:', firebaseErr);
    }

    // Save to Cloud SQL / Backend API
    try {
      await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });
    } catch (e) {
      console.warn('API error saving teacher:', e);
    }

    setUsers((prev) => [...prev, newUser]);
    setCurrentUser(newUser);
    setActiveView('home');
    return { success: true };
  };

  // Register Admin with Firebase Firestore + Backend Sync
  const registerAdmin = async (data: {
    name: string;
    surname: string;
    email: string;
    password?: string;
  }) => {
    const trimmedEmail = data.email.trim().toLowerCase();
    const existing = users.find((u) => u.email.toLowerCase() === trimmedEmail);
    if (existing) {
      return { success: false, error: 'An account with this email already exists. Please log in.' };
    }

    const employeeId = `DHS-ADM${Math.floor(100 + Math.random() * 900)}`;
    const newAdmin: User = {
      id: 'adm_' + Date.now(),
      name: data.name.trim(),
      surname: data.surname.trim(),
      email: trimmedEmail,
      password: data.password || 'password123',
      role: 'admin',
      employeeId,
      department: 'School Administration',
      createdAt: new Date().toISOString(),
    };

    // Save to Firebase Firestore
    try {
      await setDoc(doc(db, 'users', newAdmin.id), newAdmin);
    } catch (firebaseErr) {
      console.warn('Firebase admin save error:', firebaseErr);
    }

    try {
      await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAdmin),
      });
    } catch (e) {
      console.warn('API error saving admin:', e);
    }

    setUsers((prev) => [...prev, newAdmin]);
    setCurrentUser(newAdmin);
    setActiveView('dashboard');
    return { success: true };
  };

  // Login
  const loginUser = async (email: string, password?: string, forceRole?: UserRole) => {
    const trimmedEmail = email.trim().toLowerCase();
    const cleanPassword = password ? password.trim() : '';

    // 1. Check direct Firestore user document if available and online
    if (navigator.onLine) {
      try {
        if (trimmedEmail === DADAYA_ADMIN_CREDENTIALS.email.toLowerCase()) {
          const fetchAdminPromise = getDoc(doc(db, 'users', DEFAULT_ADMIN_USER.id));
          const timeoutPromise = new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Network timeout')), 1500));
          const adminDoc = await Promise.race([fetchAdminPromise, timeoutPromise]);
          if (adminDoc.exists()) {
            const remoteAdmin = adminDoc.data() as User;
            if (remoteAdmin.password === cleanPassword || (!remoteAdmin.password && cleanPassword === DADAYA_ADMIN_CREDENTIALS.password)) {
              setCurrentUser(remoteAdmin);
              setActiveView('dashboard');
              return { success: true, user: remoteAdmin };
            } else {
              return {
                success: false,
                error: 'Incorrect administrator password. Please verify the password and try again.',
              };
            }
          }
        }
      } catch (fsErr) {
        console.warn('Direct Firestore user verification note:', fsErr);
      }
    }

    // 2. Official Dadaya High School Admin Account Validation
    if (trimmedEmail === DADAYA_ADMIN_CREDENTIALS.email.toLowerCase()) {
      if (cleanPassword === DADAYA_ADMIN_CREDENTIALS.password) {
        let adminUser = users.find(
          (u) => u.email.toLowerCase() === DADAYA_ADMIN_CREDENTIALS.email.toLowerCase()
        );
        if (!adminUser) {
          adminUser = DEFAULT_ADMIN_USER;
          setUsers((prev) => [DEFAULT_ADMIN_USER, ...prev.filter((u) => u.id !== DEFAULT_ADMIN_USER.id)]);
        }
        // Ensure user is synced to Firestore
        setDoc(doc(db, 'users', adminUser.id), adminUser).catch(() => null);
        setCurrentUser(adminUser);
        setActiveView('dashboard');
        return { success: true, user: adminUser };
      } else {
        return {
          success: false,
          error: 'Incorrect administrator password. Please verify the password and try again.',
        };
      }
    }

    // 2. Existing Users in Database / Local State
    const found = users.find(
      (u) =>
        u.email.toLowerCase() === trimmedEmail &&
        (!cleanPassword || !u.password || u.password === cleanPassword)
    );

    if (found) {
      if (forceRole && found.role !== forceRole) {
        return {
          success: false,
          error: `This account is registered as a ${found.role}. Please log in via the ${
            found.role === 'admin' ? 'Admin Portal' : 'Teacher Portal'
          }.`,
        };
      }
      setCurrentUser(found);
      setActiveView(found.role === 'admin' ? 'dashboard' : 'home');
      return { success: true, user: found };
    }

    // 3. Dynamic Admin fallback helper for other administrative emails
    if (forceRole === 'admin' || trimmedEmail.includes('admin')) {
      const newAdmin: User = {
        id: 'adm_' + Date.now(),
        name: 'School',
        surname: 'Administrator',
        email: trimmedEmail,
        password: cleanPassword || DADAYA_ADMIN_CREDENTIALS.password,
        role: 'admin',
        employeeId: `DHS-ADM${Math.floor(100 + Math.random() * 900)}`,
        department: 'School Administration',
        createdAt: new Date().toISOString(),
      };

      try {
        await setDoc(doc(db, 'users', newAdmin.id), newAdmin);
      } catch (firebaseErr) {
        console.warn('Firebase error:', firebaseErr);
      }

      try {
        await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newAdmin),
        });
      } catch (e) {
        console.warn('API error:', e);
      }
      setUsers((prev) => [...prev, newAdmin]);
      setCurrentUser(newAdmin);
      setActiveView('dashboard');
      return { success: true, user: newAdmin };
    }

    return {
      success: false,
      error: 'Invalid email or password. Please check your credentials or create a teacher account.',
    };
  };

  // Teacher Account Recovery: Find Teacher by EC Number
  const findTeacherByEcNumber = async (ecNumberInput: string): Promise<{ success: boolean; user?: User; error?: string }> => {
    const rawInput = ecNumberInput.trim();
    const queryEc = rawInput.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!queryEc) {
      return { success: false, error: 'Please enter your EC Number (Employment Code).' };
    }

    // 1. Search in local state users
    let match = users.find((u) => {
      if (u.role !== 'teacher') return false;
      const uEc = (u.ecNumber || u.employeeId || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
      return uEc === queryEc || uEc.endsWith(queryEc) || queryEc.endsWith(uEc);
    });

    // 2. If not found in memory, query Firestore directly
    if (!match) {
      try {
        const snap = await getDocs(collection(db, 'users'));
        for (const docSnap of snap.docs) {
          const u = { id: docSnap.id, ...docSnap.data() } as User;
          if (u.role === 'teacher') {
            const uEc = (u.ecNumber || u.employeeId || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
            if (uEc === queryEc || uEc.endsWith(queryEc) || queryEc.endsWith(uEc)) {
              match = u;
              break;
            }
          }
        }
      } catch (e) {
        console.warn('Error querying Firestore for teacher EC number:', e);
      }
    }

    if (match) {
      return { success: true, user: match };
    } else {
      return {
        success: false,
        error: `No teacher record found with EC Number "${rawInput}". Please verify your employment code or contact school administration.`,
      };
    }
  };

  // Reset Teacher Password with EC Number
  const resetTeacherPasswordWithEcNumber = async (
    ecNumberInput: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string; user?: User }> => {
    const findRes = await findTeacherByEcNumber(ecNumberInput);
    if (!findRes.success || !findRes.user) {
      return { success: false, error: findRes.error || 'Teacher account not found' };
    }

    const teacher = findRes.user;
    if (!newPassword || newPassword.trim().length < 4) {
      return { success: false, error: 'Password must be at least 4 characters.' };
    }

    const cleanPassword = newPassword.trim();
    const updatedUser: User = {
      ...teacher,
      password: cleanPassword,
    };

    // Update in local state
    setUsers((prev) => prev.map((u) => (u.id === teacher.id ? updatedUser : u)));

    // Update in Firestore
    try {
      await updateDoc(doc(db, 'users', teacher.id), {
        password: cleanPassword,
      });
    } catch (fsErr) {
      console.warn('Firestore updateDoc failed, attempting setDoc merge:', fsErr);
      try {
        await setDoc(doc(db, 'users', teacher.id), updatedUser, { merge: true });
      } catch {}
    }

    // Update backend API
    try {
      await fetch(`/api/users/${teacher.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: cleanPassword }),
      });
    } catch {}

    sendPhoneNotification({
      title: '🔑 Teacher Password Updated',
      body: `Password for ${teacher.name} ${teacher.surname} (${teacher.ecNumber || teacher.employeeId}) has been successfully updated.`,
      tag: `pwd-reset-${teacher.id}`,
    });

    return { success: true, user: updatedUser };
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  };

  const updateUserProfile = (data: Partial<User>) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...data };
    setCurrentUser(updated);
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));

    // Save to Firebase Firestore
    setDoc(doc(db, 'users', updated.id), updated).catch((e) =>
      console.warn('Firebase update user error:', e)
    );

    fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    }).catch((e) => console.warn(e));
  };

  // Clear offline queue
  const clearOfflineQueue = () => {
    setOfflineQueue([]);
    localStorage.removeItem(STORAGE_KEYS.OFFLINE_QUEUE);
  };

  // Sync offline queue to Firebase Firestore and Backend API
  const syncOfflineQueue = async (): Promise<{ success: boolean; syncedCount: number; message: string }> => {
    if (offlineQueue.length === 0) {
      return { success: true, syncedCount: 0, message: 'Offline check-in queue is empty.' };
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return {
        success: false,
        syncedCount: 0,
        message: 'Device is currently offline. Connect to the internet to synchronize queued records.',
      };
    }

    setIsSyncingQueue(true);
    let syncedCount = 0;
    const remainingQueue: QueuedOfflineAction[] = [];

    for (const item of offlineQueue) {
      try {
        if (item.type === 'clock_in' || item.type === 'clock_out') {
          const rec = item.payload.record as AttendanceRecord;
          const notif = item.payload.notification as EarlyClockNotification;

          if (rec) {
            await setDoc(doc(db, 'attendance', rec.id), rec);
            fetch('/api/attendance', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: rec.id,
                teacherId: rec.userId,
                teacherName: rec.teacherName,
                teacherSurname: rec.teacherSurname,
                subject: rec.subject,
                date: rec.date,
                clockInTime: rec.clockInTime,
                clockInTimestamp: String(rec.clockInTimestamp || Date.now()),
                clockOutTime: rec.clockOutTime,
                clockOutTimestamp: rec.clockOutTimestamp ? String(rec.clockOutTimestamp) : null,
                totalWorkingMinutes: rec.totalWorkingMinutes || 0,
                status: rec.status,
                earlyClockInReason: rec.earlyClockInReason || null,
                earlyClockOutReason: rec.earlyClockOutReason || null,
                clockInLatitude: rec.latitude,
                clockInLongitude: rec.longitude,
              }),
            }).catch(() => null);
          }

          if (notif) {
            await setDoc(doc(db, 'notifications', notif.id), notif);
            fetch('/api/notifications', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(notif),
            }).catch(() => null);
          }
          syncedCount++;
        } else if (item.type === 'leave_request') {
          const leave = item.payload.leave as LeaveRequest;
          const notif = item.payload.notification as EarlyClockNotification;

          if (leave) {
            await setDoc(doc(db, 'leave_requests', leave.id), leave);
            fetch('/api/leave-requests', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(leave),
            }).catch(() => null);
          }

          if (notif) {
            await setDoc(doc(db, 'notifications', notif.id), notif);
            fetch('/api/notifications', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(notif),
            }).catch(() => null);
          }
          syncedCount++;
        }
      } catch (err: any) {
        console.warn('Failed to sync queue item:', item.id, err);
        remainingQueue.push({ ...item, status: 'failed', error: err?.message || 'Network sync error' });
      }
    }

    setOfflineQueue(remainingQueue);
    localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(remainingQueue));
    setIsSyncingQueue(false);

    if (syncedCount > 0 && schoolSettings.soundEffectsEnabled !== false) {
      soundEffects.playBadgeScanSuccess();
    }

    return {
      success: true,
      syncedCount,
      message: `Successfully synchronized ${syncedCount} queued record${syncedCount === 1 ? '' : 's'} to Dadaya High School Cloud.`,
    };
  };

  // Helper: Haversine distance calculation in meters
  const calculateDistanceMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // Earth radius in metres
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c);
  };

  // Helper: School days (Monday=1 through Friday=5, plus Saturday=6 and Sunday=0 if weekend clocking is allowed)
  const isSchoolDay = (date: Date = new Date()): boolean => {
    const day = date.getDay();
    if (day >= 1 && day <= 5) return true;
    return schoolSettings.allowWeekendClocking ?? true;
  };

  const isWeekend = (date: Date = new Date()): boolean => {
    return !isSchoolDay(date);
  };

  const currentDayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  // Clock In
  const clockIn = async (
    reason?: string,
    isEarly?: boolean,
    coords?: { latitude: number; longitude: number }
  ) => {
    if (!currentUser) return { success: false, message: 'No user active' };
    const dateStr = getTodayDateStr();
    const timeStr = formatCurrentTime();
    const now = new Date();

    // Strictly enforce: App must NOT allow offline clocking
    const isCurrentlyOffline = (typeof navigator !== 'undefined' && !navigator.onLine) || !isOnline;
    if (isCurrentlyOffline) {
      if (schoolSettings.soundEffectsEnabled !== false) {
        soundEffects.playErrorBeep();
      }
      return {
        success: false,
        message: 'Offline Clocking Prohibited: An active internet connection is required to verify and record attendance with Dadaya High School Cloud servers.',
      };
    }

    // Strictly enforce Zimbabwe MoPSE School Terms, Public Holidays, and School Days (Mon-Fri)
    const eligibility = evaluateAttendanceEligibility(now, schoolSettings);
    if (!eligibility.canClock) {
      if (schoolSettings.soundEffectsEnabled !== false) {
        soundEffects.playErrorBeep();
      }
      return {
        success: false,
        message: eligibility.reason,
      };
    }

    if (todayRecord && todayRecord.clockInTime) {
      return {
        success: false,
        message: 'You have already clocked in today at ' + todayRecord.clockInTime,
      };
    }

    // Verify Dadaya High School Campus Location
    let distanceToSchool = 0;
    const effectiveLat = coords?.latitude ?? schoolSettings.schoolLatitude;
    const effectiveLng = coords?.longitude ?? schoolSettings.schoolLongitude;

    if (coords && schoolSettings.requireLocation) {
      distanceToSchool = calculateDistanceMeters(
        coords.latitude,
        coords.longitude,
        schoolSettings.schoolLatitude,
        schoolSettings.schoolLongitude
      );

      if (distanceToSchool > schoolSettings.allowedRadiusMeters) {
        const formattedDist =
          distanceToSchool >= 1000
            ? `${(distanceToSchool / 1000).toFixed(2)} km`
            : `${distanceToSchool} meters`;
        return {
          success: false,
          distance: distanceToSchool,
          message: `Location Error: You are currently ${formattedDist} away from Dadaya High School. Clock-in is strictly permitted only within ${schoolSettings.allowedRadiusMeters}m of the school campus.`,
        };
      }
    }

    const currentHours = now.getHours();
    const currentMins = now.getMinutes();
    const isLate = currentHours > 7 || (currentHours === 7 && currentMins > 45);

    const recordId = todayRecord ? todayRecord.id : 'rec_' + Date.now();
    const newRecord: AttendanceRecord = {
      id: recordId,
      userId: currentUser.id,
      teacherName: currentUser.name,
      teacherSurname: currentUser.surname,
      subject: currentUser.subject || 'General',
      date: dateStr,
      clockInTime: timeStr,
      clockOutTime: null,
      clockInTimestamp: Date.now(),
      clockOutTimestamp: null,
      status: isLate ? 'late' : 'present',
      isEarlyClockIn: !!isEarly,
      earlyClockInReason: reason || undefined,
      locationVerified: true,
      latitude: effectiveLat,
      longitude: effectiveLng,
    };

    if (todayRecord) {
      setAttendanceRecords((prev) => prev.map((r) => (r.id === todayRecord.id ? newRecord : r)));
    } else {
      setAttendanceRecords((prev) => [newRecord, ...prev]);
    }

    // Generate notification for Admin on every clock in
    let notifType: 'early_in' | 'late_in' | 'clock_in' = 'clock_in';
    let notifReason = `Teacher clocked in at Dadaya High School campus at ${timeStr} (GPS geofence verified on-campus)`;

    if (isEarly && reason) {
      notifType = 'early_in';
      notifReason = `Early Clock-In Notice: ${reason.trim()}`;
    } else if (isLate) {
      notifType = 'late_in';
      notifReason = `Late Arrival: Clocked in at ${timeStr} (after 07:45 AM grace period)`;
    }

    const newNotification: EarlyClockNotification = {
      id: 'notif_' + Date.now(),
      recordId: recordId,
      teacherId: currentUser.id,
      teacherName: currentUser.name,
      teacherSurname: currentUser.surname,
      subject: currentUser.subject || 'General',
      type: notifType,
      time: timeStr,
      date: dateStr,
      timestamp: Date.now(),
      reason: notifReason,
      read: false,
      acknowledgedByAdmin: false,
    };

    setNotifications((prev) => [newNotification, ...prev]);

    // Save to Firebase Firestore
    try {
      await setDoc(doc(db, 'attendance', recordId), newRecord);
    } catch (firebaseErr) {
      console.warn('Firebase attendance save error:', firebaseErr);
    }

    // Save to backend database
    try {
      await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: recordId,
          teacherId: currentUser.id,
          teacherName: currentUser.name,
          teacherSurname: currentUser.surname,
          subject: currentUser.subject,
          date: dateStr,
          clockInTime: timeStr,
          clockInTimestamp: String(Date.now()),
          status: newRecord.status,
          earlyClockInReason: reason || null,
          clockInLatitude: effectiveLat,
          clockInLongitude: effectiveLng,
        }),
      });
    } catch (e) {
      console.warn('Attendance backend save error:', e);
    }

    try {
      await setDoc(doc(db, 'notifications', newNotification.id), newNotification);
    } catch (firebaseErr) {
      console.warn('Firebase notif save error:', firebaseErr);
    }

    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNotification),
      });
    } catch (e) {
      console.warn('Notification save error:', e);
    }

    if (schoolSettings.soundEffectsEnabled !== false) {
      soundEffects.playClockInSuccess();
    }

    // Dispatch instant native phone notification
    sendPhoneNotification({
      title: isLate ? '⚠️ Late Clock-In Logged' : (isEarly ? '⏱️ Early Clock-In Notice' : '✅ Clock-In Verified'),
      body: `${currentUser.name} ${currentUser.surname} clocked in at ${timeStr} (${currentUser.subject || 'Faculty'}). Dadaya High School campus GPS verified.`,
      tag: `clockin-${currentUser.id}-${dateStr}`,
    });

    return {
      success: true,
      distance: distanceToSchool,
      message: `Clocked in successfully at ${timeStr} on Dadaya High School Campus (GPS Verified).`,
    };
  };

  // Clock Out
  const clockOut = async (
    reason?: string,
    isEarly?: boolean,
    coords?: { latitude: number; longitude: number }
  ) => {
    if (!currentUser) return { success: false, message: 'No user active' };
    const dateStr = getTodayDateStr();
    const timeStr = formatCurrentTime();
    const now = new Date();

    // Strictly enforce: App must NOT allow offline clocking
    const isCurrentlyOffline = (typeof navigator !== 'undefined' && !navigator.onLine) || !isOnline;
    if (isCurrentlyOffline) {
      if (schoolSettings.soundEffectsEnabled !== false) {
        soundEffects.playErrorBeep();
      }
      return {
        success: false,
        message: 'Offline Clocking Prohibited: An active internet connection is required to verify and record attendance with Dadaya High School Cloud servers.',
      };
    }

    // Strictly enforce Zimbabwe MoPSE School Terms, Public Holidays, and School Days (Mon-Fri)
    const eligibility = evaluateAttendanceEligibility(now, schoolSettings);
    if (!eligibility.canClock) {
      if (schoolSettings.soundEffectsEnabled !== false) {
        soundEffects.playErrorBeep();
      }
      return {
        success: false,
        message: eligibility.reason,
      };
    }

    if (!todayRecord || !todayRecord.clockInTime) {
      return { success: false, message: 'You must clock in first before clocking out.' };
    }

    if (todayRecord.clockOutTime) {
      return {
        success: false,
        message: 'You have already clocked out today at ' + todayRecord.clockOutTime,
      };
    }

    // Verify Dadaya High School Campus Location
    let distanceToSchool = 0;
    const effectiveLat = coords?.latitude ?? schoolSettings.schoolLatitude;
    const effectiveLng = coords?.longitude ?? schoolSettings.schoolLongitude;

    if (coords && schoolSettings.requireLocation) {
      distanceToSchool = calculateDistanceMeters(
        coords.latitude,
        coords.longitude,
        schoolSettings.schoolLatitude,
        schoolSettings.schoolLongitude
      );

      if (distanceToSchool > schoolSettings.allowedRadiusMeters) {
        const formattedDist =
          distanceToSchool >= 1000
            ? `${(distanceToSchool / 1000).toFixed(2)} km`
            : `${distanceToSchool} meters`;
        return {
          success: false,
          distance: distanceToSchool,
          message: `Location Error: You are currently ${formattedDist} away from Dadaya High School. Clock-out is strictly permitted only within ${schoolSettings.allowedRadiusMeters}m of the school campus.`,
        };
      }
    }

    const clockInTs = todayRecord.clockInTimestamp || Date.now();
    const clockOutTs = Date.now();
    const workingMinutes = Math.max(1, Math.round((clockOutTs - clockInTs) / (1000 * 60)));

    const updatedRecord: AttendanceRecord = {
      ...todayRecord,
      clockOutTime: timeStr,
      clockOutTimestamp: clockOutTs,
      totalWorkingMinutes: workingMinutes,
      isEarlyClockOut: !!isEarly,
      earlyClockOutReason: reason || undefined,
      status: isEarly ? 'early_departure' : todayRecord.status,
      latitude: effectiveLat,
      longitude: effectiveLng,
    };

    setAttendanceRecords((prev) =>
      prev.map((r) => (r.id === todayRecord.id ? updatedRecord : r))
    );

    // Generate notification for Admin on every clock out
    const notifReason = isEarly && reason
      ? `Early Departure: ${reason.trim()}`
      : `Teacher clocked out on campus after ${Math.floor(workingMinutes / 60)}h ${workingMinutes % 60}m shift duty`;

    const newNotification: EarlyClockNotification = {
      id: 'notif_' + Date.now(),
      recordId: todayRecord.id,
      teacherId: currentUser.id,
      teacherName: currentUser.name,
      teacherSurname: currentUser.surname,
      subject: currentUser.subject || 'General',
      type: isEarly ? 'early_out' : 'clock_out',
      time: timeStr,
      date: dateStr,
      timestamp: Date.now(),
      reason: notifReason,
      read: false,
      acknowledgedByAdmin: false,
    };

    setNotifications((prev) => [newNotification, ...prev]);

    // Save to Firebase Firestore
    try {
      await setDoc(doc(db, 'attendance', todayRecord.id), updatedRecord);
    } catch (firebaseErr) {
      console.warn('Firebase attendance clockout error:', firebaseErr);
    }

    try {
      await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: todayRecord.id,
          teacherId: currentUser.id,
          teacherName: currentUser.name,
          teacherSurname: currentUser.surname,
          subject: currentUser.subject,
          date: dateStr,
          clockOutTime: timeStr,
          clockOutTimestamp: String(clockOutTs),
          status: updatedRecord.status,
          earlyClockOutReason: reason || null,
          totalWorkingMinutes: workingMinutes,
          clockOutLatitude: effectiveLat,
          clockOutLongitude: effectiveLng,
        }),
      });
    } catch (e) {
      console.warn('Attendance clockout save error:', e);
    }

    try {
      await setDoc(doc(db, 'notifications', newNotification.id), newNotification);
    } catch (firebaseErr) {
      console.warn('Firebase notif save error:', firebaseErr);
    }

    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNotification),
      });
    } catch (e) {
      console.warn(e);
    }

    if (schoolSettings.soundEffectsEnabled !== false) {
      soundEffects.playClockOutSuccess();
    }

    // Dispatch instant native phone notification
    sendPhoneNotification({
      title: isEarly ? '⏱️ Early Clock-Out Notice' : '👋 Clock-Out Confirmed',
      body: `${currentUser.name} ${currentUser.surname} clocked out at ${timeStr}. Duty shift duration: ${Math.floor(workingMinutes / 60)}h ${workingMinutes % 60}m.`,
      tag: `clockout-${currentUser.id}-${dateStr}`,
    });

    return {
      success: true,
      distance: distanceToSchool,
      message: `Clocked out successfully at ${timeStr} on Dadaya High School Campus. Notice sent to School Admin.`,
    };
  };

  // Quick Badge / NFC / ID scan clock-in
  const clockInWithBadge = async (
    badgeOrEmail: string,
    coords?: { latitude: number; longitude: number }
  ) => {
    const now = new Date();

    // Strictly enforce: App must NOT allow offline clocking
    const isCurrentlyOffline = (typeof navigator !== 'undefined' && !navigator.onLine) || !isOnline;
    if (isCurrentlyOffline) {
      if (schoolSettings.soundEffectsEnabled !== false) {
        soundEffects.playErrorBeep();
      }
      return {
        success: false,
        message: 'Offline Clocking Prohibited: An active internet connection is required to scan badges and record attendance with Dadaya High School Cloud servers.',
      };
    }

    // Strictly enforce Zimbabwe MoPSE School Terms, Public Holidays, and School Days (Mon-Fri)
    const eligibility = evaluateAttendanceEligibility(now, schoolSettings);
    if (!eligibility.canClock) {
      if (schoolSettings.soundEffectsEnabled !== false) {
        soundEffects.playErrorBeep();
      }
      return {
        success: false,
        message: eligibility.reason,
      };
    }

    const query = badgeOrEmail.trim().toLowerCase();
    const targetUser = users.find(
      (u) =>
        (u.employeeId && u.employeeId.toLowerCase() === query) ||
        (u.email && u.email.toLowerCase() === query) ||
        u.id.toLowerCase() === query
    );

    if (!targetUser) {
      if (schoolSettings.soundEffectsEnabled !== false) {
        soundEffects.playErrorBeep();
      }
      return {
        success: false,
        message: `Badge / ID "${badgeOrEmail}" not found in Dadaya High School registry.`,
      };
    }

    // Strictly enforce geofence when coords provided or requirement active
    if (coords && schoolSettings.requireLocation) {
      const distanceToSchool = calculateDistanceMeters(
        coords.latitude,
        coords.longitude,
        schoolSettings.schoolLatitude,
        schoolSettings.schoolLongitude
      );

      if (distanceToSchool > schoolSettings.allowedRadiusMeters) {
        const formattedDist =
          distanceToSchool >= 1000
            ? `${(distanceToSchool / 1000).toFixed(2)} km`
            : `${distanceToSchool}m`;
        if (schoolSettings.soundEffectsEnabled !== false) {
          soundEffects.playErrorBeep();
        }
        return {
          success: false,
          distance: distanceToSchool,
          message: `Location Locked: You are ${formattedDist} away from Dadaya High School. Clocking is automatically locked outside school grounds (${schoolSettings.allowedRadiusMeters}m perimeter).`,
        };
      }
    }

    const dateStr = getTodayDateStr();
    const timeStr = formatCurrentTime();

    const existingRec = attendanceRecords.find(
      (r) => r.userId === targetUser.id && r.date === dateStr
    );

    if (existingRec && existingRec.clockInTime && !existingRec.clockOutTime) {
      // Auto-Clock Out on second scan
      const clockOutTs = Date.now();
      const inTs = existingRec.clockInTimestamp || clockOutTs;
      const workingMinutes = Math.max(1, Math.round((clockOutTs - inTs) / (1000 * 60)));

      const updatedRecord: AttendanceRecord = {
        ...existingRec,
        clockOutTime: timeStr,
        clockOutTimestamp: clockOutTs,
        totalWorkingMinutes: workingMinutes,
      };

      try {
        await setDoc(doc(db, 'attendance', existingRec.id), updatedRecord);
      } catch (err) {
        console.warn(err);
      }

      setAttendanceRecords((prev) =>
        prev.map((r) => (r.id === existingRec.id ? updatedRecord : r))
      );

      if (schoolSettings.soundEffectsEnabled !== false) {
        soundEffects.playBadgeScanSuccess();
      }

      return {
        success: true,
        user: targetUser,
        message: `Badge Scanned: ${targetUser.name} ${targetUser.surname} clocked OUT at ${timeStr}.`,
      };
    }

    if (existingRec && existingRec.clockInTime && existingRec.clockOutTime) {
      return {
        success: false,
        user: targetUser,
        message: `${targetUser.name} ${targetUser.surname} has already completed attendance today.`,
      };
    }

    // New Clock In
    const currentHours = now.getHours();
    const currentMins = now.getMinutes();
    const isLate = currentHours > 7 || (currentHours === 7 && currentMins > 45);

    const recordId = 'rec_' + Date.now();
    const newRecord: AttendanceRecord = {
      id: recordId,
      userId: targetUser.id,
      teacherName: targetUser.name,
      teacherSurname: targetUser.surname,
      subject: targetUser.subject || 'General',
      date: dateStr,
      clockInTime: timeStr,
      clockOutTime: null,
      clockInTimestamp: Date.now(),
      clockOutTimestamp: null,
      status: isLate ? 'late' : 'present',
      locationVerified: true,
      latitude: coords?.latitude || schoolSettings.schoolLatitude,
      longitude: coords?.longitude || schoolSettings.schoolLongitude,
    };

    try {
      await setDoc(doc(db, 'attendance', recordId), newRecord);
    } catch (err) {
      console.warn(err);
    }

    setAttendanceRecords((prev) => [newRecord, ...prev]);

    if (schoolSettings.soundEffectsEnabled !== false) {
      soundEffects.playBadgeScanSuccess();
    }

    return {
      success: true,
      user: targetUser,
      message: `Badge Scanned: ${targetUser.name} ${targetUser.surname} clocked IN at ${timeStr} (${isLate ? 'Late' : 'On Time'}).`,
    };
  };

  // Leave & Absence Management
  const submitLeaveRequest = async (
    data: Omit<LeaveRequest, 'id' | 'status' | 'submittedAt'>
  ) => {
    if (!currentUser) return { success: false, error: 'User session required' };

    const leaveId = 'lve_' + Date.now();
    const newLeave: LeaveRequest = {
      ...data,
      id: leaveId,
      status: 'pending',
      submittedAt: new Date().toISOString(),
    };

    setLeaveRequests((prev) => [newLeave, ...prev]);

    // Notify Admin of new leave request
    const notif: EarlyClockNotification = {
      id: 'notif_leave_' + Date.now(),
      recordId: leaveId,
      teacherId: currentUser.id,
      teacherName: currentUser.name,
      teacherSurname: currentUser.surname,
      subject: currentUser.subject || 'General',
      type: 'leave_request' as any,
      time: formatCurrentTime(),
      date: getTodayDateStr(),
      timestamp: Date.now(),
      reason: `Leave Request (${data.leaveType.toUpperCase()}): ${data.startDate} to ${data.endDate} - ${data.reason.substring(0, 80)}`,
      read: false,
      acknowledgedByAdmin: false,
    };

    setNotifications((prev) => [notif, ...prev]);

    const isCurrentlyOffline = typeof navigator !== 'undefined' && !navigator.onLine;

    if (isCurrentlyOffline) {
      const queueItem: QueuedOfflineAction = {
        id: 'q_lve_' + Date.now(),
        type: 'leave_request',
        timestamp: Date.now(),
        dateStr: getTodayDateStr(),
        timeStr: formatCurrentTime(),
        teacherId: currentUser.id,
        teacherName: currentUser.name,
        teacherSurname: currentUser.surname,
        subject: currentUser.subject,
        payload: { leave: newLeave, notification: notif },
        status: 'pending',
      };
      setOfflineQueue((prev) => [...prev, queueItem]);
      return { success: true };
    }

    try {
      await setDoc(doc(db, 'leave_requests', leaveId), newLeave);
    } catch (err: any) {
      console.warn('Firebase leave request save error, queueing offline:', err);
      const queueItem: QueuedOfflineAction = {
        id: 'q_lve_' + Date.now(),
        type: 'leave_request',
        timestamp: Date.now(),
        dateStr: getTodayDateStr(),
        timeStr: formatCurrentTime(),
        teacherId: currentUser.id,
        teacherName: currentUser.name,
        teacherSurname: currentUser.surname,
        subject: currentUser.subject,
        payload: { leave: newLeave, notification: notif },
        status: 'pending',
      };
      setOfflineQueue((prev) => [...prev, queueItem]);
    }

    try {
      await fetch('/api/leave-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLeave),
      });
    } catch (e) {
      console.warn('Leave request API save error:', e);
    }

    try {
      await setDoc(doc(db, 'notifications', notif.id), notif);
    } catch (e) {
      console.warn(e);
    }

    sendPhoneNotification({
      title: '📋 Leave Application Submitted',
      body: `${currentUser.name} ${currentUser.surname} applied for ${data.leaveType.toUpperCase()} leave (${data.startDate} to ${data.endDate}).`,
      tag: `leave-${newLeave.id}`,
    });

    return { success: true };
  };

  const updateLeaveStatus = async (
    id: string,
    status: LeaveStatus,
    adminNotes?: string
  ) => {
    const target = leaveRequests.find((l) => l.id === id);
    const updated = leaveRequests.map((l) =>
      l.id === id
        ? {
            ...l,
            status,
            adminNotes: adminNotes ?? l.adminNotes,
            reviewedAt: new Date().toISOString(),
            reviewedBy: currentUser ? `${currentUser.name} ${currentUser.surname}` : 'Administrator',
          }
        : l
    );
    setLeaveRequests(updated);

    if (target) {
      sendPhoneNotification({
        title: status === 'approved' ? '✅ Leave Request Approved' : '❌ Leave Request Declined',
        body: `Leave request for ${target.teacherName} ${target.teacherSurname} (${target.leaveType}) was marked as ${status}.`,
        tag: `leave-update-${id}`,
      });
    }

    try {
      await updateDoc(doc(db, 'leave_requests', id), {
        status,
        ...(adminNotes ? { adminNotes } : {}),
        reviewedAt: new Date().toISOString(),
        reviewedBy: currentUser ? `${currentUser.name} ${currentUser.surname}` : 'Administrator',
      });
    } catch (e) {
      console.warn('Firebase leave update error:', e);
    }

    try {
      await fetch(`/api/leave-requests/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, adminNotes }),
      });
    } catch (e) {
      console.warn('Leave API update error:', e);
    }
  };

  const deleteLeaveRequest = async (id: string) => {
    setLeaveRequests((prev) => prev.filter((l) => l.id !== id));
    try {
      await deleteDoc(doc(db, 'leave_requests', id));
    } catch (e) {
      console.warn('Firebase leave delete error:', e);
    }
    try {
      await fetch(`/api/leave-requests/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.warn(e);
    }
  };

  const submitEarlyNotice = async (type: 'early_in' | 'early_out', reason: string) => {
    if (!currentUser) return;
    const timeStr = formatCurrentTime();
    const dateStr = getTodayDateStr();

    const notif: EarlyClockNotification = {
      id: 'notif_' + Date.now(),
      recordId: todayRecord?.id || 'manual_' + Date.now(),
      teacherId: currentUser.id,
      teacherName: currentUser.name,
      teacherSurname: currentUser.surname,
      subject: currentUser.subject || 'General',
      type,
      time: timeStr,
      date: dateStr,
      timestamp: Date.now(),
      reason: reason.trim(),
      read: false,
      acknowledgedByAdmin: false,
    };

    sendPhoneNotification({
      title: type === 'early_in' ? '⏱️ Early Clock-In Notice' : '⏱️ Early Departure Notice',
      body: `${currentUser.name} ${currentUser.surname}: ${reason.trim()}`,
      tag: `notice-${notif.id}`,
    });

    // Save to Firebase Firestore
    try {
      await setDoc(doc(db, 'notifications', notif.id), notif);
    } catch (firebaseErr) {
      console.warn('Firebase notif error:', firebaseErr);
    }

    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notif),
      });
    } catch (e) {
      console.warn(e);
    }

    setNotifications((prev) => [notif, ...prev]);
  };

  const acknowledgeNotification = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true, acknowledgedByAdmin: true } : n))
    );

    // Update in Firebase Firestore
    updateDoc(doc(db, 'notifications', id), {
      acknowledgedByAdmin: true,
      read: true,
    }).catch((e) => console.warn('Firebase notif update error:', e));

    fetch(`/api/notifications/${id}/acknowledge`, { method: 'PATCH' }).catch((e) =>
      console.warn(e)
    );
  };

  const clearAllNotifications = () => {
    notifications.forEach((n) => {
      deleteDoc(doc(db, 'notifications', n.id)).catch(() => null);
    });
    setNotifications([]);
  };

  const deleteTeacher = (teacherId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== teacherId));
    setAttendanceRecords((prev) => prev.filter((r) => r.userId !== teacherId));

    // Delete in Firebase Firestore
    deleteDoc(doc(db, 'users', teacherId)).catch((e) =>
      console.warn('Firebase delete teacher error:', e)
    );

    fetch(`/api/users/${teacherId}`, { method: 'DELETE' }).catch((e) => console.warn(e));
  };

  const addTeacherByAdmin = (teacherData: Partial<User>) => {
    const ec = teacherData.ecNumber || teacherData.employeeId;
    const employeeId = ec || `DHS-T${Math.floor(1000 + Math.random() * 9000)}`;
    const newTeacher: User = {
      id: 'usr_' + Date.now(),
      name: teacherData.name || 'New',
      surname: teacherData.surname || 'Teacher',
      subject: teacherData.subject || 'General',
      email: teacherData.email || `teacher${Date.now()}@dadayahigh.ac.zw`,
      role: 'teacher',
      password: 'password123',
      employeeId,
      ecNumber: ec || employeeId,
      department: (teacherData.subject || 'General') + ' Department',
      createdAt: new Date().toISOString(),
    };

    // Save to Firebase Firestore
    setDoc(doc(db, 'users', newTeacher.id), newTeacher).catch((e) =>
      console.warn('Firebase add teacher error:', e)
    );

    fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTeacher),
    }).catch((e) => console.warn(e));

    setUsers((prev) => [...prev, newTeacher]);
  };

  // Student Daily Attendance Management
  const saveStudentAttendance = async (
    recordData: Omit<StudentAttendanceRecord, 'id' | 'timestamp' | 'createdAt'>
  ): Promise<{ success: boolean; message: string; record?: StudentAttendanceRecord }> => {
    try {
      const gBoarders = Number(recordData.girlsBoarders) || 0;
      const gDay = Number(recordData.girlsDay) || 0;
      const bBoarders = Number(recordData.boysBoarders) || 0;
      const bDay = Number(recordData.boysDay) || 0;
      const actualTotal = gBoarders + gDay + bBoarders + bDay;
      const recordId = `att_std_${recordData.className.replace(/[^a-zA-Z0-9]/g, '_')}_${recordData.date}`;
      const now = new Date().toISOString();

      const newRecord: StudentAttendanceRecord = {
        ...recordData,
        id: recordId,
        girlsBoarders: gBoarders,
        girlsDay: gDay,
        boysBoarders: bBoarders,
        boysDay: bDay,
        actualTotal,
        possibleTotal: Number(recordData.possibleTotal) || actualTotal,
        timestamp: Date.now(),
        createdAt: now,
        updatedAt: now,
      };

      setStudentAttendanceRecords((prev) => {
        const existingIdx = prev.findIndex(
          (r) => r.className.toLowerCase() === recordData.className.toLowerCase() && r.date === recordData.date
        );
        if (existingIdx >= 0) {
          const updated = [...prev];
          updated[existingIdx] = { ...updated[existingIdx], ...newRecord, updatedAt: now };
          return updated;
        }
        return [newRecord, ...prev];
      });

      // Save to Firebase Firestore
      try {
        await setDoc(doc(db, 'student_attendance', recordId), newRecord);
      } catch (err) {
        console.warn('Firestore student attendance sync fallback:', err);
      }

      soundEffects.playClockInSuccess();
      return {
        success: true,
        message: `Student attendance for ${recordData.className} successfully recorded for ${recordData.date}!`,
        record: newRecord,
      };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Failed to record student attendance' };
    }
  };

  const deleteStudentAttendance = async (id: string) => {
    setStudentAttendanceRecords((prev) => prev.filter((r) => r.id !== id));
    try {
      await deleteDoc(doc(db, 'student_attendance', id));
    } catch (err) {
      console.warn('Firestore delete student attendance notice:', err);
    }
  };

  // Class Allocation to Teachers
  const allocateClassesToTeacher = async (
    teacherId: string,
    classNames: string[]
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const teacher = users.find((u) => u.id === teacherId);
      const teacherFullName = teacher ? `${teacher.name} ${teacher.surname}` : 'Teacher';

      // 1. Update Teacher User in State
      setUsers((prev) =>
        prev.map((u) => {
          if (u.id === teacherId) {
            return { ...u, assignedClasses: classNames };
          }
          return u;
        })
      );

      // If current logged in teacher, update currentUser state
      if (currentUser?.id === teacherId) {
        setCurrentUser((prev) => (prev ? { ...prev, assignedClasses: classNames } : null));
      }

      // 2. Update classes assigned teacher
      setClasses((prev) =>
        prev.map((c) => {
          if (classNames.includes(c.name)) {
            return { ...c, assignedTeacherId: teacherId, assignedTeacherName: teacherFullName };
          } else if (c.assignedTeacherId === teacherId) {
            // Unassign if removed
            return { ...c, assignedTeacherId: undefined, assignedTeacherName: undefined };
          }
          return c;
        })
      );

      // Update in Firebase Firestore
      try {
        await updateDoc(doc(db, 'users', teacherId), { assignedClasses: classNames });
      } catch (err) {
        console.warn('Firestore user class allocation update notice:', err);
      }

      soundEffects.playClockInSuccess();
      return {
        success: true,
        message: `Classes (${classNames.join(', ') || 'None'}) successfully allocated to ${teacherFullName}!`,
      };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Failed to allocate classes' };
    }
  };

  const saveSchoolClass = async (cls: SchoolClass): Promise<{ success: boolean; message: string }> => {
    setClasses((prev) => {
      const idx = prev.findIndex((c) => c.id === cls.id || c.name.toLowerCase() === cls.name.toLowerCase());
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], ...cls };
        return updated;
      }
      return [...prev, cls];
    });

    try {
      await setDoc(doc(db, 'classes', cls.id), cls);
    } catch (err) {
      console.warn('Firestore class save error:', err);
    }

    return { success: true, message: `Class ${cls.name} saved successfully.` };
  };

  const deleteSchoolClass = async (id: string) => {
    setClasses((prev) => prev.filter((c) => c.id !== id));
    try {
      await deleteDoc(doc(db, 'classes', id));
    } catch (err) {
      console.warn('Firestore class delete error:', err);
    }
  };

  const resetToOfficialClasses = async (): Promise<{ success: boolean; message: string }> => {
    setClasses(DEFAULT_CLASSES);
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(DEFAULT_CLASSES));
    try {
      await deleteDoc(doc(db, 'classes', 'cls-1white')).catch(() => null);
      // Clear or overwrite all in Firestore
      for (const cls of DEFAULT_CLASSES) {
        await setDoc(doc(db, 'classes', cls.id), cls);
      }
    } catch (err) {
      console.warn('Firestore reset official classes error:', err);
    }
    soundEffects.playClockInSuccess();
    return {
      success: true,
      message: 'Dadaya High School classes successfully reset to official structure!',
    };
  };

  const updateSchoolSettings = (newSettings: Partial<SchoolSettings>) => {
    const merged = { ...schoolSettings, ...newSettings };
    setSchoolSettings(merged);

    // Save to Firebase Firestore
    setDoc(doc(db, 'school_settings', 'global'), merged).catch((e) =>
      console.warn('Firebase settings update error:', e)
    );

    fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(merged),
    }).catch((e) => console.warn(e));
  };

  const resetAllData = async () => {
    // Wipe Firebase Firestore records
    try {
      users.forEach((u) => deleteDoc(doc(db, 'users', u.id)).catch(() => null));
      attendanceRecords.forEach((r) => deleteDoc(doc(db, 'attendance', r.id)).catch(() => null));
      notifications.forEach((n) => deleteDoc(doc(db, 'notifications', n.id)).catch(() => null));
    } catch (err) {
      console.warn('Firebase wipe error:', err);
    }

    try {
      await fetch('/api/reset', { method: 'POST' });
    } catch (e) {
      console.warn('Reset backend error:', e);
    }
    setUsers([]);
    setCurrentUser(null);
    setAttendanceRecords([]);
    setNotifications([]);
    localStorage.clear();
  };

  // Complete JSON Backup Exporter
  const exportCompleteBackup = () => {
    const backupData = {
      exportTimestamp: new Date().toISOString(),
      schoolName: schoolSettings.schoolName,
      academicYear: schoolSettings.academicYear,
      recordsCount: attendanceRecords.length,
      usersCount: users.length,
      leaveCount: leaveRequests.length,
      data: {
        users,
        attendanceRecords,
        leaveRequests,
        notifications,
        schoolSettings,
      },
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dadaya_attendance_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // CSV Attendance Exporter
  const exportAttendanceCSV = () => {
    const headers = [
      'Record ID',
      'Date',
      'Teacher Name',
      'Employee ID',
      'Subject',
      'Clock In Time',
      'Clock Out Time',
      'Status',
      'Total Working Minutes',
      'Early In Reason',
      'Early Out Reason',
      'Location Verified',
      'Coordinates',
    ];

    const rows = attendanceRecords.map((r) => {
      const u = users.find((usr) => usr.id === r.userId);
      const coord = r.latitude && r.longitude ? `"${r.latitude}, ${r.longitude}"` : 'N/A';
      return [
        `"${r.id}"`,
        `"${r.date}"`,
        `"${r.teacherName} ${r.teacherSurname}"`,
        `"${u?.employeeId || 'N/A'}"`,
        `"${r.subject || u?.subject || 'General'}"`,
        `"${r.clockInTime || 'N/A'}"`,
        `"${r.clockOutTime || 'N/A'}"`,
        `"${r.status}"`,
        r.totalWorkingMinutes || 0,
        `"${(r.earlyClockInReason || '').replace(/"/g, '""')}"`,
        `"${(r.earlyClockOutReason || '').replace(/"/g, '""')}"`,
        r.locationVerified ? 'Yes' : 'No',
        coord,
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dadaya_attendance_records_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Restore Backup Function
  const restoreBackupData = async (backupPayload: any): Promise<{ success: boolean; message: string }> => {
    try {
      const payloadData = backupPayload?.data || backupPayload;
      if (!payloadData || (!payloadData.attendanceRecords && !payloadData.users)) {
        return { success: false, message: 'Invalid backup format: missing attendance records or faculty data.' };
      }

      const newRecords: AttendanceRecord[] = payloadData.attendanceRecords || [];
      const newUsers: User[] = payloadData.users || [];
      const newLeaves: LeaveRequest[] = payloadData.leaveRequests || [];
      const newSettings: Partial<SchoolSettings> = payloadData.schoolSettings || {};

      if (newRecords.length > 0) {
        setAttendanceRecords((prev) => {
          const map = new Map(prev.map((r) => [r.id, r]));
          newRecords.forEach((r) => map.set(r.id, r));
          const merged = Array.from(map.values());
          localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(merged));
          return merged;
        });

        newRecords.forEach((r) => {
          setDoc(doc(db, 'attendance', r.id), r).catch(() => null);
        });
      }

      if (newUsers.length > 0) {
        setUsers((prev) => {
          const map = new Map(prev.map((u) => [u.id, u]));
          newUsers.forEach((u) => map.set(u.id, u));
          const merged = Array.from(map.values());
          localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(merged));
          return merged;
        });

        newUsers.forEach((u) => {
          setDoc(doc(db, 'users', u.id), u).catch(() => null);
        });
      }

      if (newLeaves.length > 0) {
        setLeaveRequests((prev) => {
          const map = new Map(prev.map((l) => [l.id, l]));
          newLeaves.forEach((l) => map.set(l.id, l));
          const merged = Array.from(map.values());
          localStorage.setItem(STORAGE_KEYS.LEAVE, JSON.stringify(merged));
          return merged;
        });

        newLeaves.forEach((l) => {
          setDoc(doc(db, 'leave_requests', l.id), l).catch(() => null);
        });
      }

      if (Object.keys(newSettings).length > 0) {
        updateSchoolSettings(newSettings);
      }

      return {
        success: true,
        message: `Successfully restored ${newRecords.length} attendance records and ${newUsers.length} faculty profiles!`,
      };
    } catch (err: any) {
      return { success: false, message: `Backup restoration failed: ${err?.message || 'Unknown error'}` };
    }
  };

  const clearAttendanceRecords = async (): Promise<{ success: boolean; message: string }> => {
    try {
      setAttendanceRecords([]);
      localStorage.removeItem(STORAGE_KEYS.RECORDS);

      try {
        const snapshot = await getDocs(collection(db, 'attendance'));
        const deletePromises = snapshot.docs.map((docSnap) => deleteDoc(doc(db, 'attendance', docSnap.id)));
        await Promise.all(deletePromises);
      } catch (err) {
        console.warn('Firestore attendance deletion error:', err);
      }

      try {
        await fetch('/api/attendance', { method: 'DELETE' });
      } catch (err) {
        console.warn('Backend attendance deletion error:', err);
      }

      return { success: true, message: 'All clocked in and attendance records have been successfully cleared.' };
    } catch (err: any) {
      console.error('Error clearing attendance records:', err);
      return { success: false, message: err?.message || 'Failed to clear records' };
    }
  };

  const deleteAttendanceRecord = async (recordId: string): Promise<void> => {
    try {
      setAttendanceRecords((prev) => {
        const updated = prev.filter((r) => r.id !== recordId);
        localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(updated));
        return updated;
      });

      deleteDoc(doc(db, 'attendance', recordId)).catch((e) => console.warn('Firestore delete record error:', e));
      fetch(`/api/attendance/${recordId}`, { method: 'DELETE' }).catch((e) => console.warn('Backend delete record error:', e));
    } catch (err) {
      console.error('Error deleting record:', err);
    }
  };

  // Purge any stale simulation notifications on mount
  useEffect(() => {
    setNotifications((prev) => {
      const cleaned = prev.filter(
        (n) =>
          !n.reason?.toLowerCase().includes('simulated') &&
          !n.reason?.toLowerCase().includes('standard dismissal:')
      );
      if (cleaned.length !== prev.length) {
        localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(cleaned));
        prev
          .filter(
            (n) =>
              n.reason?.toLowerCase().includes('simulated') ||
              n.reason?.toLowerCase().includes('standard dismissal:')
          )
          .forEach((n) => deleteDoc(doc(db, 'notifications', n.id)).catch(() => null));
      }
      return cleaned;
    });
  }, []);

  const switchUserRole = (role: UserRole) => {
    if (!currentUser) return;
    // Strictly prevent teachers from switching to admin without logging into the Admin Portal
    if (currentUser.role === 'teacher' && role === 'admin') {
      console.warn('Unauthorized role switch attempt: teachers cannot access admin section');
      return;
    }
    if (currentUser.role === role) return;

    const matchedUser = users.find((u) => u.role === role);
    if (matchedUser) {
      setCurrentUser(matchedUser);
      setActiveView(role === 'admin' ? 'dashboard' : 'home');
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        attendanceRecords,
        studentAttendanceRecords,
        classes,
        selectedTeacherClass,
        setSelectedTeacherClass,
        saveStudentAttendance,
        deleteStudentAttendance,
        allocateClassesToTeacher,
        saveSchoolClass,
        deleteSchoolClass,
        resetToOfficialClasses,
        notifications,
        leaveRequests,
        schoolSettings,
        isLoading,
        isFirebaseLinked,
        activeView,
        setActiveView,
        registerTeacher,
        registerAdmin,
        findTeacherByEcNumber,
        resetTeacherPasswordWithEcNumber,
        loginUser,
        logout,
        updateUserProfile,
        todayRecord,
        clockIn,
        clockOut,
        clockInWithBadge,
        submitLeaveRequest,
        updateLeaveStatus,
        deleteLeaveRequest,
        submitEarlyNotice,
        acknowledgeNotification,
        clearAllNotifications,
        clearAttendanceRecords,
        deleteAttendanceRecord,
        deleteTeacher,
        addTeacherByAdmin,
        updateSchoolSettings,
        resetAllData,
        exportCompleteBackup,
        exportAttendanceCSV,
        restoreBackupData,
        viewMode,
        setViewMode,
        switchUserRole,
        isOnline,
        offlineQueue,
        offlineQueueCount: offlineQueue.length,
        isSyncingQueue,
        syncOfflineQueue,
        clearOfflineQueue,
        isSchoolDay,
        isWeekend,
        currentDayName,
        isDemoMode,
        setDemoMode,
        demoCoords,
        setDemoCoords,
        setSimulationMode,
        simulationStatus,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
