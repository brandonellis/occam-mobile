import { useState, useEffect, useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { getUnreadNotificationCount } from '../services/notifications.api';

const useUnreadNotifications = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const navigation = useNavigation();

  const refresh = useCallback(async () => {
    try {
      const count = await getUnreadNotificationCount();
      setUnreadCount(count);
    } catch {
      // Silently fail — badge is non-critical
    }
  }, []);

  // Refresh on mount and every time the screen comes into focus
  useEffect(() => {
    refresh();
    const unsubscribe = navigation.addListener('focus', refresh);
    return unsubscribe;
  }, [navigation, refresh]);

  return { unreadCount, refresh };
};

export default useUnreadNotifications;
