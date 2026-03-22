import { useQuery } from '@tanstack/react-query';
import { getBookings } from '../services/bookings.api';
import { QUERY_KEYS } from '../constants/queryKeys.constants';

/**
 * Fetches bookings with React Query caching.
 * Replaces the common pattern: navigation.addListener('focus', loadBookings)
 *
 * Use with useRefetchOnFocus(refetch) to refresh on screen focus.
 *
 * @param {Object} params - Query parameters (date, status, etc.)
 * @param {Object} options - React Query options (enabled, etc.)
 */
const useBookingsQuery = (params = {}, options = {}) => {
  return useQuery({
    queryKey: QUERY_KEYS.BOOKINGS.list(params),
    queryFn: async () => {
      const resp = await getBookings(params);
      return resp?.data || resp || [];
    },
    ...options,
  });
};

export default useBookingsQuery;
