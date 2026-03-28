import { useQuery } from '@tanstack/react-query';
import { getMyPackages } from '../services/packages.api';
import { QUERY_KEYS } from '../constants/queryKeys.constants';

/**
 * Fetches the authenticated client's purchased packages with React Query caching.
 */
const useMyPackagesQuery = (options = {}) => {
  return useQuery({
    queryKey: QUERY_KEYS.PACKAGES.my,
    queryFn: async () => {
      const resp = await getMyPackages();
      return Array.isArray(resp) ? resp : resp?.data ?? [];
    },
    ...options,
  });
};

export default useMyPackagesQuery;
