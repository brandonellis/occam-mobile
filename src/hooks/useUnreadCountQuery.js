import { useQuery } from '@tanstack/react-query';
import { getUnreadNotificationCount } from '../services/notifications.api';
import { QUERY_KEYS } from '../constants/queryKeys.constants';

/**
 * Fetches unread notification count with a shorter staleTime (30s)
 * to match the current manual throttle behavior in NotificationBadgeProvider.
 *
 * @param {Object} options - React Query options (enabled, etc.)
 */
const useUnreadCountQuery = (options = {}) => {
  return useQuery({
    queryKey: QUERY_KEYS.NOTIFICATIONS.unreadCount,
    queryFn: async () => {
      const resp = await getUnreadNotificationCount();
      return resp?.count ?? resp?.data?.count ?? 0;
    },
    staleTime: 30 * 1000, // 30 seconds — more frequent than default 5min
    ...options,
  });
};

export default useUnreadCountQuery;
