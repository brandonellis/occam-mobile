import { useQuery } from '@tanstack/react-query';
import { getCurrentClientMembership } from '../services/accounts.api';
import { QUERY_KEYS } from '../constants/queryKeys.constants';

/**
 * Fetches the authenticated client's current membership with React Query caching.
 *
 * @param {number|string} clientId - The client ID to fetch membership for
 * @param {Object} options - React Query options (enabled, etc.)
 */
const useMyMembershipQuery = (clientId, options = {}) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.MEMBERSHIPS.my, clientId],
    queryFn: () => getCurrentClientMembership(clientId),
    enabled: !!clientId,
    ...options,
  });
};

export default useMyMembershipQuery;
