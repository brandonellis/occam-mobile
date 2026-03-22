import { useQuery } from '@tanstack/react-query';
import { getCoaches } from '../services/bookings.api';
import { QUERY_KEYS } from '../constants/queryKeys.constants';

/**
 * Fetches the tenant's coaches list with React Query caching.
 * staleTime: 5min (default). Rarely changes during a session.
 */
const useCoachesQuery = (options = {}) => {
  return useQuery({
    queryKey: QUERY_KEYS.COACHES.all,
    queryFn: async () => {
      const resp = await getCoaches();
      return resp?.data ?? resp ?? [];
    },
    ...options,
  });
};

export default useCoachesQuery;
