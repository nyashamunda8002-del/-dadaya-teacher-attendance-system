/**
 * Phone and Native Push Notification Handler for Dadaya High School Attendance
 * Delivers instant native device notifications on mobile and desktop,
 * background notification triggers, and Zimbabwe National Public Holiday greetings.
 */

import { triggerHaptic } from './haptics';
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
      // Send a confirmation welcome notification
      await sendPhoneNotification({
        title: 'Dadaya High School Attendance',
        body: 'Phone notifications enabled! You will now receive instant attendance alerts & national holiday greetings even in the background.',
        tag: 'welcome-notification',
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
 * Send a native phone notification directly to the device notification center
 * Works when the app is active, minimised, or running in background.
 */
export async function sendPhoneNotification(payload: NotificationPayload): Promise<boolean> {
  if (!isNotificationSupported()) {
    return false;
  }

  if (Notification.permission !== 'granted') {
    return false;
  }

  const defaultIcon = '/icon.svg';
  const defaultBadge = '/icon.svg';
  const vibrationPattern = payload.vibrate || [200, 100, 200, 100, 200];

  try {
    // 1. Device vibration haptic
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(vibrationPattern);
    }

    // 2. Try sending via active Service Worker for background Android/Desktop notification drawer integration
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration && registration.showNotification) {
          await registration.showNotification(payload.title, {
            body: payload.body,
            icon: payload.icon || defaultIcon,
            badge: payload.badge || defaultBadge,
            tag: payload.tag || `dadaya-${Date.now()}`,
            data: payload.data || { url: window.location.origin },
            vibrate: vibrationPattern,
            requireInteraction: false,
          } as NotificationOptions);
          return true;
        }
      } catch (swErr) {
        console.warn('Service worker notification note:', swErr);
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
 * Checks if today is a Zimbabwe Public Holiday and sends a celebratory greeting notification
 */
export async function checkAndSendHolidayGreeting(force: boolean = false): Promise<boolean> {
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
 * Checks if clock-in or clock-out is about to happen or is underway,
 * and sends an alert directly to the teacher's phone.
 */
export async function checkAndSendClockingReminder(
  teacherName?: string,
  forceType?: 'clock_in' | 'clock_out' | 'manual_test'
): Promise<{ sent: boolean; reason?: string }> {
  const now = new Date();
  const day = now.getDay();
  // Mon=1 to Fri=5 (or forced)
  const isSchoolDay = forceType === 'manual_test' || (day >= 1 && day <= 5);

  if (!isSchoolDay) {
    return { sent: false, reason: 'Not a school day' };
  }

  const hours = now.getHours();
  const minutes = now.getMinutes();
  const currentTotalMinutes = hours * 60 + minutes;
  const dateStr = now.toISOString().split('T')[0];

  // Morning window: 06:45 (405m) to 07:45 (465m)
  // Afternoon window: 16:15 (975m) to 16:45 (1005m)
  let reminderType: 'clock_in' | 'clock_out' | null = forceType === 'clock_out' ? 'clock_out' : (forceType === 'clock_in' ? 'clock_in' : null);

  if (!reminderType && forceType !== 'manual_test') {
    if (currentTotalMinutes >= 400 && currentTotalMinutes <= 465) {
      reminderType = 'clock_in';
    } else if (currentTotalMinutes >= 970 && currentTotalMinutes <= 1010) {
      reminderType = 'clock_out';
    }
  }

  if (forceType === 'manual_test' && !reminderType) {
    reminderType = currentTotalMinutes < 720 ? 'clock_in' : 'clock_out';
  }

  if (!reminderType) {
    return { sent: false, reason: 'Current time is outside the standard clocking reminder windows' };
  }

  const storageKey = `dadaya_clock_reminder_${reminderType}_${dateStr}`;
  if (forceType !== 'manual_test' && typeof localStorage !== 'undefined') {
    if (localStorage.getItem(storageKey) === 'true') {
      return { sent: false, reason: 'Already reminded for this session today' };
    }
  }

  const greeting = teacherName ? `Good day ${teacherName}, ` : 'Attention Dadaya High Teacher: ';
  const title = reminderType === 'clock_in' 
    ? '⏰ Morning Clock-In Reminder'
    : '⏰ Afternoon Clock-Out Reminder';

  const body = reminderType === 'clock_in'
    ? `${greeting}Morning clocking is active (07:00 - 07:45). Remember to clock in when you arrive on campus!`
    : `${greeting}Official school day concludes at 16:30. Please remember to clock out before leaving campus!`;

  const sent = await sendPhoneNotification({
    title,
    body,
    tag: `reminder-${reminderType}-${dateStr}`,
    vibrate: [250, 100, 250, 100, 400],
  });

  if (sent && typeof localStorage !== 'undefined' && forceType !== 'manual_test') {
    localStorage.setItem(storageKey, 'true');
  }

  return { sent, reason: sent ? 'Reminder delivered to device' : 'Device notification could not be delivered' };
}

/**
 * Schedules background periodic checks for clock-in reminders and public holiday greetings
 */
export function initializeBackgroundNotificationService(): () => void {
  if (typeof window === 'undefined') return () => {};

  // 1. Check for holiday greeting & clocking reminder immediately on boot
  checkAndSendHolidayGreeting().catch(() => {});
  checkAndSendClockingReminder().catch(() => {});

  // 2. Periodic background interval (every 5 minutes to catch reminder window)
  const intervalId = setInterval(() => {
    checkAndSendHolidayGreeting().catch(() => {});
    checkAndSendClockingReminder().catch(() => {});
  }, 5 * 60 * 1000);

  // 3. Trigger check on window focus / resume from background
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      checkAndSendHolidayGreeting().catch(() => {});
      checkAndSendClockingReminder().catch(() => {});
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);

  return () => {
    clearInterval(intervalId);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}
