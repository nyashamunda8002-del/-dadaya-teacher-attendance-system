/**
 * Phone and Native Push Notification Handler for Dadaya High School Attendance
 * Delivers instant native device notifications directly to mobile phones (Android / iOS PWA) and desktop,
 * including lock screen banners, background duty reminders, and Zimbabwe National Public Holiday greetings.
 */

import { triggerHaptic } from './haptics';
import { soundEffects } from './soundEffects';
import { checkZimbabwePublicHoliday } from './zimbabweCalendar';

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, any>;
  vibrate?: number[];
  silent?: boolean;
  actions?: Array<{ action: string; title: string }>;
}

export interface NotificationPreferences {
  enabled: boolean;
  morningReminder: boolean;
  lateWarning: boolean;
  afternoonReminder: boolean;
  leaveUpdates: boolean;
  holidayGreetings: boolean;
  adminAlerts: boolean;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  enabled: true,
  morningReminder: true,
  lateWarning: true,
  afternoonReminder: true,
  leaveUpdates: true,
  holidayGreetings: true,
  adminAlerts: true,
};

const PREFS_STORAGE_KEY = 'dadaya_phone_notification_preferences';

/**
 * Get notification preferences from local storage
 */
export function getNotificationPreferences(): NotificationPreferences {
  if (typeof localStorage === 'undefined') return DEFAULT_PREFERENCES;
  try {
    const saved = localStorage.getItem(PREFS_STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_PREFERENCES, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.warn('Error reading notification preferences:', e);
  }
  return DEFAULT_PREFERENCES;
}

/**
 * Save notification preferences
 */
export function saveNotificationPreferences(prefs: Partial<NotificationPreferences>): NotificationPreferences {
  const current = getNotificationPreferences();
  const updated = { ...current, ...prefs };
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Error saving notification preferences:', e);
    }
  }
  return updated;
}

/**
 * Check if current browser/device supports Web / Phone Notifications
 */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Get current notification permission state
 */
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) {
    return 'unsupported';
  }
  return Notification.permission;
}

/**
 * Ensure Service Worker is registered and return registration
 */
async function getActiveServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }
  try {
    if (navigator.serviceWorker.controller) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) return reg;
    }
    const reg = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;
    return reg;
  } catch (e) {
    console.warn('Service worker access note:', e);
    return null;
  }
}

/**
 * Request notification permission from the user on their phone/browser
 */
export async function requestPhoneNotificationPermission(): Promise<{
  granted: boolean;
  permission: NotificationPermission | 'unsupported';
}> {
  if (!isNotificationSupported()) {
    return { granted: false, permission: 'unsupported' };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      triggerHaptic('success');
      saveNotificationPreferences({ enabled: true });

      // Send a confirmation welcome notification directly to phone notifications
      await sendPhoneNotification({
        title: '🔔 Dadaya Attendance Connected',
        body: 'Phone notifications enabled! You will now receive instant attendance verifications, leave updates, and daily duty reminders directly on your phone.',
        tag: 'welcome-phone-notification',
      });
      return { granted: true, permission: 'granted' };
    }
    return { granted: false, permission };
  } catch (err) {
    console.warn('Error requesting phone notification permission:', err);
    return { granted: false, permission: getNotificationPermission() };
  }
}

/**
 * Send a native phone notification directly to the device notification drawer / lock screen
 * Works on Android, iOS (PWA), and desktop browsers.
 */
export async function sendPhoneNotification(payload: NotificationPayload): Promise<boolean> {
  if (!isNotificationSupported()) {
    return false;
  }

  if (Notification.permission !== 'granted') {
    return false;
  }

  const prefs = getNotificationPreferences();
  if (!prefs.enabled) {
    return false;
  }

  const defaultIcon = '/icon.png';
  const defaultBadge = '/icon.png';
  const vibrationPattern = payload.vibrate || [200, 100, 200, 100, 200];

  try {
    // 1. Device vibration haptic for physical phone feedback
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(vibrationPattern);
      } catch {
        // Ignore vibration errors
      }
    }

    // 2. Try sending via active Service Worker (required on mobile Android & iOS PWA)
    const registration = await getActiveServiceWorker();
    if (registration && registration.showNotification) {
      try {
        await registration.showNotification(payload.title, {
          body: payload.body,
          icon: payload.icon || defaultIcon,
          badge: payload.badge || defaultBadge,
          tag: payload.tag || `dadaya-${Date.now()}`,
          data: payload.data || { url: window.location.origin },
          vibrate: vibrationPattern,
          requireInteraction: false,
          actions: payload.actions || [
            { action: 'open', title: 'Open App' }
          ],
        } as any);

        // Also post message to SW client
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'SHOW_NOTIFICATION',
            title: payload.title,
            options: {
              body: payload.body,
              icon: payload.icon || defaultIcon,
              badge: payload.badge || defaultBadge,
              tag: payload.tag || `dadaya-${Date.now()}`,
              vibrate: vibrationPattern,
              data: payload.data,
            },
          });
        }
        return true;
      } catch (swErr) {
        console.warn('Service worker showNotification notice:', swErr);
      }
    }

    // 3. Fallback to standard Window Notification
    const notif = new Notification(payload.title, {
      body: payload.body,
      icon: payload.icon || defaultIcon,
      badge: payload.badge || defaultBadge,
      tag: payload.tag || `dadaya-${Date.now()}`,
      data: payload.data,
      silent: payload.silent || false,
    });

    notif.onclick = () => {
      window.focus();
      notif.close();
    };

    return true;
  } catch (err) {
    console.warn('Could not deliver phone notification:', err);
    return false;
  }
}

/**
 * Send an immediate test notification to verify phone reception
 */
export async function sendTestPhoneNotification(): Promise<boolean> {
  const perm = getNotificationPermission();
  if (perm !== 'granted') {
    const req = await requestPhoneNotificationPermission();
    if (!req.granted) return false;
  }

  triggerHaptic('success');
  if (soundEffects) {
    soundEffects.playClockInSuccess();
  }

  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  return sendPhoneNotification({
    title: '🔔 Dadaya High School Alert Test',
    body: `Your phone notification system is working perfectly! Delivered at ${timeStr}.`,
    tag: `test-${Date.now()}`,
    vibrate: [250, 100, 250, 100, 300],
    actions: [{ action: 'open', title: 'View Attendance' }],
  });
}

/**
 * Checks if today is a Zimbabwe Public Holiday and sends a celebratory greeting notification
 */
export async function checkAndSendHolidayGreeting(force: boolean = false): Promise<boolean> {
  const prefs = getNotificationPreferences();
  if (!prefs.holidayGreetings && !force) return false;

  const holidayCheck = checkZimbabwePublicHoliday(new Date());
  if (!holidayCheck.isHoliday || !holidayCheck.holiday) {
    return false;
  }

  const holiday = holidayCheck.holiday;
  const storageKey = `dadaya_holiday_greeted_${holiday.date}`;
  
  if (!force && typeof localStorage !== 'undefined') {
    const alreadyGreeted = localStorage.getItem(storageKey);
    if (alreadyGreeted === 'true') {
      return false; // Already sent today
    }
  }

  // Send the celebratory greeting notification
  const sent = await sendPhoneNotification({
    title: `🇿🇼 Happy ${holiday.name}!`,
    body: holiday.greeting,
    tag: `holiday-${holiday.date}`,
    vibrate: [300, 100, 300, 100, 400],
  });

  if (sent && typeof localStorage !== 'undefined') {
    localStorage.setItem(storageKey, 'true');
  }

  return sent;
}

/**
 * Checks and dispatches daily duty reminders based on teacher's today attendance status
 */
export async function checkAndSendDailyDutyReminders(
  isLoggedIn: boolean,
  userRole: string | undefined,
  todayClockedIn: boolean,
  todayClockedOut: boolean,
  isSchoolDay: boolean
): Promise<void> {
  if (!isLoggedIn || userRole !== 'teacher' || !isSchoolDay) return;

  const prefs = getNotificationPreferences();
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const todayKey = now.toISOString().split('T')[0];

  // 1. Morning Clock-In Reminder (07:15 AM - 07:25 AM)
  if (prefs.morningReminder && !todayClockedIn) {
    if (hours === 7 && minutes >= 15 && minutes <= 25) {
      const sentKey = `dadaya_morning_reminder_${todayKey}`;
      if (typeof localStorage !== 'undefined' && localStorage.getItem(sentKey) !== 'true') {
        const sent = await sendPhoneNotification({
          title: '⏰ Morning Duty Reminder',
          body: 'Good morning! Please remember to clock in on Dadaya High School campus before 07:30 AM.',
          tag: `morning-reminder-${todayKey}`,
          vibrate: [200, 100, 200],
        });
        if (sent) localStorage.setItem(sentKey, 'true');
      }
    }
  }

  // 2. Late Warning Reminder (07:35 AM - 07:50 AM) if still not clocked in
  if (prefs.lateWarning && !todayClockedIn) {
    if (hours === 7 && minutes >= 35 && minutes <= 50) {
      const sentKey = `dadaya_late_reminder_${todayKey}`;
      if (typeof localStorage !== 'undefined' && localStorage.getItem(sentKey) !== 'true') {
        const sent = await sendPhoneNotification({
          title: '⚠️ Clock-In Notice',
          body: 'Standard arrival time (07:30 AM) has passed. Please clock in on campus as soon as you arrive.',
          tag: `late-reminder-${todayKey}`,
          vibrate: [300, 100, 300],
        });
        if (sent) localStorage.setItem(sentKey, 'true');
      }
    }
  }

  // 3. Afternoon Clock-Out Reminder (16:30 PM - 17:00 PM) if clocked in but not clocked out
  if (prefs.afternoonReminder && todayClockedIn && !todayClockedOut) {
    if (hours === 16 && minutes >= 30) {
      const sentKey = `dadaya_clockout_reminder_${todayKey}`;
      if (typeof localStorage !== 'undefined' && localStorage.getItem(sentKey) !== 'true') {
        const sent = await sendPhoneNotification({
          title: '👋 Duty Shift Complete',
          body: 'Thank you for your service today! Please remember to clock out before departing campus.',
          tag: `clockout-reminder-${todayKey}`,
          vibrate: [200, 100, 200],
        });
        if (sent) localStorage.setItem(sentKey, 'true');
      }
    }
  }
}

/**
 * Schedules background periodic checks for clock-in reminders and public holiday greetings
 */
export function initializeBackgroundNotificationService(
  getAttendanceContext?: () => {
    isLoggedIn: boolean;
    userRole: string | undefined;
    todayClockedIn: boolean;
    todayClockedOut: boolean;
    isSchoolDay: boolean;
  }
): () => void {
  if (typeof window === 'undefined') return () => {};

  const runAllChecks = () => {
    checkAndSendHolidayGreeting().catch(() => {});
    if (getAttendanceContext) {
      const ctx = getAttendanceContext();
      checkAndSendDailyDutyReminders(
        ctx.isLoggedIn,
        ctx.userRole,
        ctx.todayClockedIn,
        ctx.todayClockedOut,
        ctx.isSchoolDay
      ).catch(() => {});
    }
  };

  // 1. Initial check
  runAllChecks();

  // 2. Periodic background interval (every 2 minutes)
  const intervalId = setInterval(runAllChecks, 2 * 60 * 1000);

  // 3. Trigger check on window focus / resume from background
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      runAllChecks();
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);

  return () => {
    clearInterval(intervalId);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}

