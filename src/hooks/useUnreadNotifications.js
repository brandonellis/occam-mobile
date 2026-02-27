import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import { getUnreadNotificationCount } from '../services/notifications.api';

const THROTTLE_MS = 30000; // Skip re-fetch if last fetch was < 30s ago

const useUnreadNotifications = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const navigation = useNavigation();
  const lastFetchedAt = useRef(0);

  const refresh = useCallback(async ({ force = false } = {}) => {
    const now = Date.now();
    if (!force && now - lastFetchedAt.current < THROTTLE_MS) return;
    try {
      const count = await getUnreadNotificationCount();
      lastFetchedAt.current = Date.now();
      setUnreadCount(count);
    } catch {
      // Silently fail — badge is non-critical
    }
  }, []);

  // Refresh on mount and every time the screen comes into focus (throttled)
  useEffect(() => {
    refresh({ force: true });
    const unsubscribe = navigation.addListener('focus', () => refresh());
    return unsubscribe;
  }, [navigation, refresh]);

  return { unreadCount, refresh };
};

export default useUnreadNotifications;
