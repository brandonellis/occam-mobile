import { useQuery } from '@tanstack/react-query';
import { getServices } from '../services/bookings.api';
import { QUERY_KEYS } from '../constants/queryKeys.constants';

/**
 * Fetches the tenant's services list with React Query caching.
 * staleTime: 5min (default). Rarely changes during a session.
 */
const useServicesQuery = (options = {}) => {
  return useQuery({
    queryKey: QUERY_KEYS.SERVICES.all,
    queryFn: async () => {
      const resp = await getServices();
      return resp?.data ?? resp ?? [];
    },
    ...options,
  });
};

export default useServicesQuery;
