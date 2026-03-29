import { useQuery } from '@tanstack/react-query';
import { getMyMembership } from '../services/accounts.api';
import { QUERY_KEYS } from '../constants/queryKeys.constants';

/**
 * Fetches the authenticated client's own membership via /auth/my-membership.
 * Use this in client-facing screens. For coach/admin screens that need a specific
 * client's membership, use useMyMembershipQuery instead.
 */
const useMyMembershipSelfQuery = (options = {}) => {
  return useQuery({
    queryKey: QUERY_KEYS.MEMBERSHIPS.mySelf,
    queryFn: async () => {
      try {
        const resp = await getMyMembership();
        return resp?.data ?? resp ?? null;
      } catch (err) {
        if (err?.response?.status === 404) return null;
        throw err;
      }
    },
    ...options,
  });
};

export default useMyMembershipSelfQuery;
