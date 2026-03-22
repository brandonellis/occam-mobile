import { useQuery } from '@tanstack/react-query';
import { getAvailabilityTimeslots } from '../services/bookings.api';
import { QUERY_KEYS } from '../constants/queryKeys.constants';

/**
 * Fetches generated time slots for a specific date from the backend.
 * This is the primary data source for the time slot picker.
 *
 * Cached per unique param set (service + location + date + coach + resource + duration).
 * Tapping back to a previously viewed date returns slots from cache instantly.
 *
 * @param {Object} params - { service_id, location_id, date, coach_ids, resource_ids, duration_minutes }
 * @param {Object} options - React Query options (enabled, etc.)
 */
const useTimeslotsQuery = (params, options = {}) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.AVAILABILITY.forDate(params), 'timeslots'],
    queryFn: async () => {
      const resp = await getAvailabilityTimeslots(params);
      return resp?.data || resp || [];
    },
    enabled: !!(params?.service_id && params?.date),
    staleTime: 30 * 1000, // 30 seconds — slots can change as others book
    ...options,
  });
};

export default useTimeslotsQuery;
