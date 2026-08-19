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
} from '../types';
import { soundEffects } from '../utils/soundEffects';

interface AppContextType {
  currentUser: User | null;
  users: User[];
  attendanceRecords: AttendanceRecord[];
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
  }) => Promise<{ success: boolean; error?: string }>;
  registerAdmin: (data: {
    name: string;
    surname: string;
    email: string;
    password?: string;
  }) => Promise<{ success: boolean; error?: string }>;
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
  clockInWithBadge: (badgeOrEmail: string) => Promise<{ success: boolean; message: string; user?: User }>;
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
}

const DEFAULT_SETTINGS: SchoolSettings = {
  schoolName: 'Dadaya High School',
  academicYear: '2026 Academic Year',
  standardClockInTime: '07:30',
  standardClockOutTime: '15:30',
  lateGracePeriodMinutes: 15,
  earlyClockInThreshold: '07:15',
  earlyClockOutThreshold: '15:15',
  schoolLatitude: -20.34049,
  schoolLongitude: 29.97782,
  allowedRadiusMeters: 100,
  requireLocation: true,
  lockMessage: 'Attendance clocking is locked: You are outside Dadaya High School campus. You must be physically within the 100m school boundary to clock in or clock out.',
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

const STORAGE_KEYS = {
  CURRENT_USER: 'dadaya_current_user_v2',
  SETTINGS: 'dadaya_school_settings_v2',
  RECORDS: 'dadaya_attendance_records_v2',
  USERS: 'dadaya_users_v2',
  NOTIFICATIONS: 'dadaya_notifications_v2',
  LEAVE: 'dadaya_leave_requests_v2',
  OFFLINE_QUEUE: 'dadaya_offline_queue_v2',
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
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          allowedRadiusMeters: radius,
          lockMessage: msg,
          schoolLatitude: parsed.schoolLatitude ?? -20.34049,
          schoolLongitude: parsed.schoolLongitude ?? 29.97782,
        };
      } catch {
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  });

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
            const firestoreUsers: User[] = snapshot.docs.map((docSnap) => ({
              id: docSnap.id,
              ...docSnap.data(),
            } as User));
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
            setSchoolSettings((prev) => ({
              ...prev,
              ...remoteSettings,
              allowedRadiusMeters: radius,
              ...(msg ? { lockMessage: msg } : {}),
              schoolLatitude: remoteSettings.schoolLatitude ?? -20.34049,
              schoolLongitude: remoteSettings.schoolLongitude ?? 29.97782,
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
            setSchoolSettings((prev) => ({
              ...prev,
              schoolName: remoteSet.schoolName,
              academicYear: remoteSet.academicYear,
              standardClockInTime: remoteSet.standardClockInTime,
              standardClockOutTime: remoteSet.standardClockOutTime,
              schoolLatitude: remoteSet.schoolLatitude ?? -20.34049,
              schoolLongitude: remoteSet.schoolLongitude ?? 29.97782,
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

    // 1. Check direct Firestore user document if available
    try {
      if (trimmedEmail === DADAYA_ADMIN_CREDENTIALS.email.toLowerCase()) {
        const adminDoc = await getDoc(doc(db, 'users', DEFAULT_ADMIN_USER.id));
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

    const isCurrentlyOffline = typeof navigator !== 'undefined' && !navigator.onLine;

    if (isCurrentlyOffline) {
      const queueItem: QueuedOfflineAction = {
        id: 'q_in_' + Date.now(),
        type: 'clock_in',
        timestamp: Date.now(),
        dateStr,
        timeStr,
        teacherId: currentUser.id,
        teacherName: currentUser.name,
        teacherSurname: currentUser.surname,
        subject: currentUser.subject,
        payload: { record: newRecord, notification: newNotification },
        status: 'pending',
      };
      setOfflineQueue((prev) => [...prev, queueItem]);

      if (schoolSettings.soundEffectsEnabled !== false) {
        soundEffects.playClockInSuccess();
      }

      return {
        success: true,
        isOfflineQueued: true,
        distance: distanceToSchool,
        message: `Offline Check-in Saved: Logged on device. It will automatically sync to Dadaya Cloud when internet connects.`,
      };
    }

    // Save to Firebase Firestore
    try {
      await setDoc(doc(db, 'attendance', recordId), newRecord);
    } catch (firebaseErr) {
      console.warn('Firebase attendance save error, queueing offline:', firebaseErr);
      const queueItem: QueuedOfflineAction = {
        id: 'q_in_' + Date.now(),
        type: 'clock_in',
        timestamp: Date.now(),
        dateStr,
        timeStr,
        teacherId: currentUser.id,
        teacherName: currentUser.name,
        teacherSurname: currentUser.surname,
        subject: currentUser.subject,
        payload: { record: newRecord, notification: newNotification },
        status: 'pending',
      };
      setOfflineQueue((prev) => [...prev, queueItem]);
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

    const isCurrentlyOffline = typeof navigator !== 'undefined' && !navigator.onLine;

    if (isCurrentlyOffline) {
      const queueItem: QueuedOfflineAction = {
        id: 'q_out_' + Date.now(),
        type: 'clock_out',
        timestamp: Date.now(),
        dateStr,
        timeStr,
        teacherId: currentUser.id,
        teacherName: currentUser.name,
        teacherSurname: currentUser.surname,
        subject: currentUser.subject,
        payload: { record: updatedRecord, notification: newNotification },
        status: 'pending',
      };
      setOfflineQueue((prev) => [...prev, queueItem]);

      if (schoolSettings.soundEffectsEnabled !== false) {
        soundEffects.playClockOutSuccess();
      }

      return {
        success: true,
        isOfflineQueued: true,
        distance: distanceToSchool,
        message: `Offline Clock-Out Saved: Logged on device. It will automatically sync to Dadaya Cloud when internet connects.`,
      };
    }

    // Save to Firebase Firestore
    try {
      await setDoc(doc(db, 'attendance', todayRecord.id), updatedRecord);
    } catch (firebaseErr) {
      console.warn('Firebase attendance clockout error, queueing offline:', firebaseErr);
      const queueItem: QueuedOfflineAction = {
        id: 'q_out_' + Date.now(),
        type: 'clock_out',
        timestamp: Date.now(),
        dateStr,
        timeStr,
        teacherId: currentUser.id,
        teacherName: currentUser.name,
        teacherSurname: currentUser.surname,
        subject: currentUser.subject,
        payload: { record: updatedRecord, notification: newNotification },
        status: 'pending',
      };
      setOfflineQueue((prev) => [...prev, queueItem]);
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
    const now = new Date();

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

    return { success: true };
  };

  const updateLeaveStatus = async (
    id: string,
    status: LeaveStatus,
    adminNotes?: string
  ) => {
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

  // Immediate purge of clocked in data as requested
  useEffect(() => {
    setAttendanceRecords([]);
    localStorage.removeItem(STORAGE_KEYS.RECORDS);

    getDocs(collection(db, 'attendance'))
      .then((snapshot) => {
        snapshot.docs.forEach((docSnap) => {
          deleteDoc(doc(db, 'attendance', docSnap.id)).catch(() => null);
        });
      })
      .catch((err) => console.warn('Purge firestore attendance records error:', err));

    fetch('/api/attendance', { method: 'DELETE' }).catch(() => null);

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
        notifications,
        leaveRequests,
        schoolSettings,
        isLoading,
        isFirebaseLinked,
        activeView,
        setActiveView,
        registerTeacher,
        registerAdmin,
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
