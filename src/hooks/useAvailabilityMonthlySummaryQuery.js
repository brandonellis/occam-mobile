import { useQuery } from '@tanstack/react-query';
import { getAvailabilityMonthlySummary } from '../services/bookings.api';
import { QUERY_KEYS } from '../constants/queryKeys.constants';

/**
 * Fetches the monthly availability summary (which dates have availability).
 * Used to populate calendar dot indicators on TimeSlotSelectionScreen.
 *
 * Cached per month — swiping back to a previously viewed month
 * returns instantly from cache.
 *
 * @param {Object} params - { service_id, location_id, month, year, coach_ids, ... }
 * @param {Object} options - React Query options (enabled, etc.)
 */
const useAvailabilityMonthlySummaryQuery = (params, options = {}) => {
  return useQuery({
    queryKey: QUERY_KEYS.AVAILABILITY.monthly(params),
    queryFn: async () => {
      const resp = await getAvailabilityMonthlySummary(params);
      return resp?.data || resp || {};
    },
    enabled: !!(params?.service_id),
    staleTime: 30 * 1000, // 30 seconds
    ...options,
  });
};

export default useAvailabilityMonthlySummaryQuery;
