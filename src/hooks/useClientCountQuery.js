import { useQuery } from '@tanstack/react-query';
import { getClients } from '../services/accounts.api';
import { QUERY_KEYS } from '../constants/queryKeys.constants';

/**
 * Fetches a lightweight client count (per_page=1) for dashboard stats.
 * Only returns the total count from pagination metadata.
 */
const useClientCountQuery = (options = {}) => {
  return useQuery({
    queryKey: QUERY_KEYS.CLIENTS.count,
    queryFn: async () => {
      const resp = await getClients({ per_page: 1 });
      const meta = resp?.meta || resp;
      return meta?.total ?? resp?.data?.length ?? 0;
    },
    ...options,
  });
};

export default useClientCountQuery;
