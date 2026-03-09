import React, { useState, useCallback, useRef, useMemo } from 'react';
import NotificationBadgeContext from '../context/NotificationBadge.context';
import { getUnreadNotificationCount } from '../services/notifications.api';

const THROTTLE_MS = 30000;

const NotificationBadgeProvider = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
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

  const value = useMemo(() => ({ unreadCount, refresh }), [unreadCount, refresh]);

  return (
    <NotificationBadgeContext.Provider value={value}>
      {children}
    </NotificationBadgeContext.Provider>
  );
};

export default NotificationBadgeProvider;
