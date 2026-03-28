import { useQuery } from '@tanstack/react-query';
import { getClientPerformanceSnapshots } from '../services/accounts.api';
import { QUERY_KEYS } from '../constants/queryKeys.constants';

/**
 * Fetches the client's performance reports/snapshots with React Query caching.
 */
const useReportsQuery = (clientId, options = {}) => {
  return useQuery({
    queryKey: QUERY_KEYS.PROGRESS.reports(clientId),
    queryFn: async () => {
      const resp = await getClientPerformanceSnapshots(clientId);
      return resp?.data ?? resp ?? [];
    },
    enabled: !!clientId,
    ...options,
  });
};

export default useReportsQuery;
