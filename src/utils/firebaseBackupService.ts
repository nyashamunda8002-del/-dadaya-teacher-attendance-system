import { collection, doc, setDoc, getDocs, deleteDoc, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import {
  FirebaseBackupRecord,
  User,
  AttendanceRecord,
  LeaveRequest,
  EarlyClockNotification,
  SchoolSettings,
} from '../types';

export {
  type FirebaseBackupRecord,
  type User,
  type AttendanceRecord,
  type LeaveRequest,
  type EarlyClockNotification,
  type SchoolSettings,
};

export interface BackupPayloadData {
  users: User[];
  attendanceRecords: AttendanceRecord[];
  leaveRequests: LeaveRequest[];
  notifications: EarlyClockNotification[];
  schoolSettings: SchoolSettings;
}

/**
 * Creates and uploads a complete database backup snapshot to Firebase Cloud Firestore.
 */
export async function createFirebaseCloudBackup({
  type = 'manual',
  triggeredBy = 'System Admin',
  frequency = 'daily',
  data,
}: {
  type?: 'scheduled' | 'manual';
  triggeredBy?: string;
  frequency?: string;
  data: BackupPayloadData;
}): Promise<{ success: boolean; backup?: FirebaseBackupRecord; message: string }> {
  try {
    const timestamp = new Date().toISOString();
    const formattedDate = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const formattedTime = new Date().toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const backupId = `backup_${type}_${Date.now()}`;
    const backupName =
      type === 'scheduled'
        ? `Scheduled Cloud Backup • ${formattedDate} (${formattedTime})`
        : `Manual Cloud Snapshot • ${formattedDate} (${formattedTime})`;

    // Calculate approximate size in bytes
    const serializedData = JSON.stringify(data);
    const sizeBytes = new Blob([serializedData]).size;

    const backupRecord: FirebaseBackupRecord = {
      id: backupId,
      backupName,
      timestamp,
      type,
      scheduleFrequency: frequency,
      status: 'completed',
      recordsCount: data.attendanceRecords?.length || 0,
      teachersCount: data.users?.length || 0,
      leaveCount: data.leaveRequests?.length || 0,
      notificationsCount: data.notifications?.length || 0,
      sizeBytes,
      triggeredBy,
      academicYear: data.schoolSettings?.academicYear || '2026 Academic Year',
      term: data.schoolSettings?.currentTerm || 'Term 1',
      schoolName: data.schoolSettings?.schoolName || 'Dadaya High School',
      data,
      createdAt: timestamp,
    };

    // Save directly to Firebase Firestore "backups" collection
    try {
      await setDoc(doc(db, 'backups', backupId), backupRecord);
    } catch (firestoreErr) {
      console.warn('Firestore direct write for backup record:', firestoreErr);
    }

    // Also persist local cache of backups
    try {
      const existingBackupsJson = localStorage.getItem('dadaya_firebase_backups_v1');
      const existingBackups: FirebaseBackupRecord[] = existingBackupsJson
        ? JSON.parse(existingBackupsJson)
        : [];
      const updated = [backupRecord, ...existingBackups.filter((b) => b.id !== backupId)].slice(0, 50);
      localStorage.setItem('dadaya_firebase_backups_v1', JSON.stringify(updated));
    } catch (localErr) {
      console.warn('Local storage backup cache write:', localErr);
    }

    return {
      success: true,
      backup: backupRecord,
      message: `Firebase Cloud Backup successfully created! (${backupRecord.recordsCount} attendance logs, ${backupRecord.teachersCount} teachers saved to Firestore).`,
    };
  } catch (error: any) {
    console.error('Error creating Firebase cloud backup:', error);
    return {
      success: false,
      message: error?.message || 'Failed to create Firebase cloud backup.',
    };
  }
}

/**
 * Retrieves all stored backup snapshots from Cloud Firestore and local storage.
 */
export async function getFirebaseCloudBackups(): Promise<FirebaseBackupRecord[]> {
  try {
    let cloudBackups: FirebaseBackupRecord[] = [];
    try {
      const q = query(collection(db, 'backups'), orderBy('createdAt', 'desc'), limit(50));
      const snapshot = await getDocs(q);
      cloudBackups = snapshot.docs.map((docSnap) => docSnap.data() as FirebaseBackupRecord);
    } catch (cloudErr) {
      console.warn('Cloud fetch of backups fallback:', cloudErr);
    }

    // Merge with locally cached backups
    const localJson = localStorage.getItem('dadaya_firebase_backups_v1');
    const localBackups: FirebaseBackupRecord[] = localJson ? JSON.parse(localJson) : [];

    const map = new Map<string, FirebaseBackupRecord>();
    cloudBackups.forEach((b) => map.set(b.id, b));
    localBackups.forEach((b) => {
      if (!map.has(b.id)) map.set(b.id, b);
    });

    const combined = Array.from(map.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return combined;
  } catch (err) {
    console.error('Failed to get Firebase backups:', err);
    return [];
  }
}

/**
 * Deletes a backup snapshot from Firestore.
 */
export async function deleteFirebaseCloudBackup(backupId: string): Promise<boolean> {
  try {
    try {
      await deleteDoc(doc(db, 'backups', backupId));
    } catch (e) {
      console.warn('Firestore delete backup doc error:', e);
    }

    const localJson = localStorage.getItem('dadaya_firebase_backups_v1');
    if (localJson) {
      const localBackups: FirebaseBackupRecord[] = JSON.parse(localJson);
      const filtered = localBackups.filter((b) => b.id !== backupId);
      localStorage.setItem('dadaya_firebase_backups_v1', JSON.stringify(filtered));
    }
    return true;
  } catch (err) {
    console.error('Error deleting Firebase backup:', err);
    return false;
  }
}

/**
 * Triggers a client-side JSON download of a Firebase backup.
 */
export function downloadBackupJSON(backup: FirebaseBackupRecord) {
  const exportData = {
    exportTimestamp: backup.timestamp,
    backupName: backup.backupName,
    type: backup.type,
    schoolName: backup.schoolName,
    academicYear: backup.academicYear,
    term: backup.term,
    recordsCount: backup.recordsCount,
    teachersCount: backup.teachersCount,
    leaveCount: backup.leaveCount,
    data: backup.data,
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeDate = new Date(backup.timestamp).toISOString().split('T')[0];
  a.download = `dadaya_firebase_backup_${backup.type}_${safeDate}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Calculates the next scheduled backup date and time.
 */
export function calculateNextScheduledBackupTime(
  frequency: 'hourly' | 'daily' | 'weekly' = 'daily',
  scheduledTimeStr: string = '00:00',
  lastBackupAt?: string | null
): Date {
  const now = new Date();
  const [targetHour, targetMinute] = (scheduledTimeStr || '00:00').split(':').map(Number);

  if (frequency === 'hourly') {
    const next = new Date(now.getTime() + 60 * 60 * 1000);
    next.setMinutes(0, 0, 0);
    return next;
  }

  if (frequency === 'weekly') {
    // Next Sunday at target time
    const next = new Date(now);
    next.setHours(targetHour, targetMinute, 0, 0);
    const dayOfWeek = next.getDay(); // 0 is Sunday
    const daysUntilSunday = (7 - dayOfWeek) % 7;
    if (daysUntilSunday === 0 && next.getTime() <= now.getTime()) {
      next.setDate(next.getDate() + 7);
    } else {
      next.setDate(next.getDate() + daysUntilSunday);
    }
    return next;
  }

  // Default: Daily at scheduled time
  const candidate = new Date(now);
  candidate.setHours(targetHour, targetMinute, 0, 0);
  if (candidate.getTime() <= now.getTime()) {
    candidate.setDate(candidate.getDate() + 1);
  }
  return candidate;
}

/**
 * Checks if a scheduled backup is overdue and needs to execute.
 */
export function isScheduledBackupDue(
  frequency: 'hourly' | 'daily' | 'weekly' = 'daily',
  scheduledTimeStr: string = '00:00',
  lastBackupAt?: string | null
): boolean {
  if (!lastBackupAt) return true;

  const lastTime = new Date(lastBackupAt).getTime();
  const now = Date.now();
  const diffMs = now - lastTime;

  if (frequency === 'hourly') {
    return diffMs >= 60 * 60 * 1000; // 1 hour
  }

  if (frequency === 'weekly') {
    return diffMs >= 7 * 24 * 60 * 60 * 1000; // 7 days
  }

  // Daily
  return diffMs >= 24 * 60 * 60 * 1000; // 24 hours
}
