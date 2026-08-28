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
 * Schedules background periodic checks for clock-in reminders and public holiday greetings
 */
export function initializeBackgroundNotificationService(): () => void {
  if (typeof window === 'undefined') return () => {};

  // 1. Check for holiday greeting immediately on boot
  checkAndSendHolidayGreeting().catch(() => {});

  // 2. Periodic background interval (every 10 minutes)
  const intervalId = setInterval(() => {
    checkAndSendHolidayGreeting().catch(() => {});
  }, 10 * 60 * 1000);

  // 3. Trigger check on window focus / resume from background
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      checkAndSendHolidayGreeting().catch(() => {});
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);

  return () => {
    clearInterval(intervalId);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}
