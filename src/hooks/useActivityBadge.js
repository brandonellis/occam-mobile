import { useCallback, useEffect, useState } from 'react';
import useAuth from './useAuth';
import { getClientActivities } from '../services/activity.api';
import { getLastSeenTimestamp, countUnreadItems } from '../helpers/activity.helper';

const POLL_INTERVAL_MS = 60000; // check every 60s

/**
 * Custom hook that tracks unread activity count for the badge.
 * Fetches the first page of activities and compares timestamps
 * against the last time the user opened the Activity tab.
 */
export default function useActivityBadge() {
  const { user, isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const checkUnread = useCallback(async () => {
    if (!user?.id || !isAuthenticated) {
      setUnreadCount(0);
      return;
    }

    try {
      const [lastSeen, response] = await Promise.all([
        getLastSeenTimestamp(),
        getClientActivities(user.id, { page: 1, per_page: 20 }),
      ]);

      if (!lastSeen) {
        // First time — no badge until they visit the tab once
        setUnreadCount(0);
        return;
      }

      const items = Array.isArray(response)
        ? response
        : (Array.isArray(response?.data) ? response.data : []);

      setUnreadCount(countUnreadItems(items, lastSeen));
    } catch {
      // Don't show badge on error
      setUnreadCount(0);
    }
  }, [user?.id, isAuthenticated]);

  useEffect(() => {
    checkUnread();
    const interval = setInterval(checkUnread, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [checkUnread]);

  return { unreadCount, refreshBadge: checkUnread };
}
