import { useCallback, useEffect, useRef, useState } from 'react';
import useAuth from './useAuth';
import { getClientActivities } from '../services/activity.api';
import { getLastSeenTimestamp, setLastSeenTimestamp, countUnreadItems } from '../helpers/activity.helper';

const POLL_INTERVAL_MS = 60000; // check every 60s

/**
 * Custom hook that tracks unread activity count for the badge.
 * Fetches the first page of activities and compares timestamps
 * against the last time the user opened the Activity tab.
 */
export default function useActivityBadge() {
  const { user, isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const suppressUntilRef = useRef(0);

  const checkUnread = useCallback(async () => {
    if (!user?.id || !isAuthenticated) {
      setUnreadCount(0);
      return;
    }

    // Skip this poll if we recently cleared the badge — gives SecureStore
    // time to flush the new lastSeen timestamp before we re-read it.
    if (Date.now() < suppressUntilRef.current) return;

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

  const clearBadge = useCallback(async () => {
    setUnreadCount(0);
    // Suppress the next poll cycle so the badge doesn't flicker back
    // while SecureStore writes the new lastSeen timestamp.
    suppressUntilRef.current = Date.now() + POLL_INTERVAL_MS;
    await setLastSeenTimestamp();
  }, []);

  return { unreadCount, refreshBadge: checkUnread, clearBadge };
}
