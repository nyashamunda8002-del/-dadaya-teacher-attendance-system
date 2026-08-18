/**
 * Android & Mobile Haptic Vibration Feedback Utilities
 */

export const triggerHaptic = (type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'light') => {
  if (typeof window === 'undefined' || !('vibrate' in navigator)) {
    return;
  }

  try {
    switch (type) {
      case 'light':
        navigator.vibrate(15);
        break;
      case 'medium':
        navigator.vibrate(35);
        break;
      case 'heavy':
        navigator.vibrate(60);
        break;
      case 'success':
        navigator.vibrate([20, 40, 20]);
        break;
      case 'warning':
        navigator.vibrate([30, 60, 30]);
        break;
      case 'error':
        navigator.vibrate([50, 40, 50, 40, 50]);
        break;
      default:
        navigator.vibrate(20);
    }
  } catch {
    // Vibration may be restricted or unsupported by browser permissions
  }
};
