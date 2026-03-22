import { useQuery } from '@tanstack/react-query';
import { getLocations } from '../services/bookings.api';
import { QUERY_KEYS } from '../constants/queryKeys.constants';

/**
 * Fetches the tenant's locations list with React Query caching.
 * staleTime: 5min (default). Rarely changes during a session.
 */
const useLocationsQuery = (options = {}) => {
  return useQuery({
    queryKey: QUERY_KEYS.LOCATIONS.all,
    queryFn: async () => {
      const resp = await getLocations();
      return resp?.data || resp || [];
    },
    ...options,
  });
};

export default useLocationsQuery;
