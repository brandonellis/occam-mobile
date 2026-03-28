import { useQuery } from '@tanstack/react-query';
import { getPackages } from '../services/packages.api';
import { QUERY_KEYS } from '../constants/queryKeys.constants';

/**
 * Fetches available packages with React Query caching.
 * staleTime: 5min (default). Package catalog rarely changes during a session.
 */
const usePackagesQuery = (options = {}) => {
  return useQuery({
    queryKey: QUERY_KEYS.PACKAGES.all,
    queryFn: async () => {
      const resp = await getPackages();
      return Array.isArray(resp) ? resp : resp?.data ?? [];
    },
    ...options,
  });
};

export default usePackagesQuery;
