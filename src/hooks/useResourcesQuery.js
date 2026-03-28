import { useQuery } from '@tanstack/react-query';
import { getClientSharedMedia } from '../services/accounts.api';
import { QUERY_KEYS } from '../constants/queryKeys.constants';

/**
 * Fetches the client's shared media/resources with React Query caching.
 */
const useResourcesQuery = (clientId, options = {}) => {
  return useQuery({
    queryKey: QUERY_KEYS.PROGRESS.resources(clientId),
    queryFn: async () => {
      const resp = await getClientSharedMedia(clientId);
      return resp?.data ?? resp ?? [];
    },
    enabled: !!clientId,
    ...options,
  });
};

export default useResourcesQuery;
