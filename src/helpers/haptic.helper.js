import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

/**
 * Lightweight haptic feedback for key interactions.
 * No-ops silently on Android devices without haptic support.
 */
export const haptic = {
  /** Light tap — tab switches, toggles, selections */
  light: () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
  },

  /** Medium tap — button presses, card taps */
  medium: () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
  },

  /** Success — booking confirmed, payment complete */
  success: () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  },

  /** Error — validation failure, network error */
  error: () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
  },

  /** Warning — destructive action confirmation */
  warning: () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
  },

  /** Selection changed — picker, toggle */
  selection: () => {
    Haptics.selectionAsync().catch(() => {});
  },
};
