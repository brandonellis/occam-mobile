import { useQuery } from '@tanstack/react-query';
import { getMembershipPlans } from '../services/accounts.api';
import { QUERY_KEYS } from '../constants/queryKeys.constants';

/**
 * Fetches available membership plans with React Query caching.
 * staleTime: 5min (default). Plans rarely change during a session.
 */
const useMembershipPlansQuery = (options = {}) => {
  return useQuery({
    queryKey: QUERY_KEYS.MEMBERSHIPS.plans,
    queryFn: async () => {
      const resp = await getMembershipPlans();
      return resp?.data || resp || [];
    },
    ...options,
  });
};

export default useMembershipPlansQuery;
