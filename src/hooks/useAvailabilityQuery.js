import { useQuery } from '@tanstack/react-query';
import { getAvailability } from '../services/bookings.api';
import { QUERY_KEYS } from '../constants/queryKeys.constants';

/**
 * Fetches availability for a specific date/service/location combination.
 * Cached per unique param set — tapping back to a previously viewed date
 * returns instantly from cache instead of re-fetching.
 *
 * @param {Object} params - { service_id, location_id, date, coach_ids, ... }
 * @param {Object} options - React Query options (enabled, etc.)
 */
const useAvailabilityQuery = (params, options = {}) => {
  return useQuery({
    queryKey: QUERY_KEYS.AVAILABILITY.forDate(params),
    queryFn: async () => {
      const resp = await getAvailability(params);
      return resp?.data ?? resp ?? [];
    },
    enabled: !!(params?.service_id && params?.date),
    staleTime: 30 * 1000, // 30 seconds — availability changes as others book
    ...options,
  });
};

export default useAvailabilityQuery;
