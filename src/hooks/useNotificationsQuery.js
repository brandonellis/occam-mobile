import { useInfiniteQuery } from '@tanstack/react-query';
import { getNotifications } from '../services/notifications.api';
import { QUERY_KEYS } from '../constants/queryKeys.constants';

/**
 * Fetches paginated notifications using useInfiniteQuery.
 *
 * @param {Object} params - Base query parameters
 * @param {Object} options - React Query options (enabled, etc.)
 */
const useNotificationsQuery = (params = {}, options = {}) => {
  return useInfiniteQuery({
    queryKey: QUERY_KEYS.NOTIFICATIONS.list(params),
    queryFn: async ({ pageParam = 1 }) => {
      const resp = await getNotifications({ ...params, page: pageParam });
      return resp?.data || resp || { data: [], last_page: 1, current_page: 1 };
    },
    getNextPageParam: (lastPage) => {
      const currentPage = lastPage?.current_page || 1;
      const lastPageNum = lastPage?.last_page || 1;
      return currentPage < lastPageNum ? currentPage + 1 : undefined;
    },
    initialPageParam: 1,
    ...options,
  });
};

export default useNotificationsQuery;
