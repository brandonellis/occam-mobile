import { useQuery } from '@tanstack/react-query';
import { getClientPerformanceCurriculum } from '../services/accounts.api';
import { QUERY_KEYS } from '../constants/queryKeys.constants';

/**
 * Fetches the client's curriculum progress with React Query caching.
 */
const useCurriculumQuery = (clientId, options = {}) => {
  return useQuery({
    queryKey: QUERY_KEYS.PROGRESS.curriculum(clientId),
    queryFn: async () => {
      const resp = await getClientPerformanceCurriculum(clientId);
      const data = resp?.data ?? resp;
      return {
        program: data?.program || null,
        modules: data?.modules || data || [],
      };
    },
    enabled: !!clientId,
    ...options,
  });
};

export default useCurriculumQuery;
