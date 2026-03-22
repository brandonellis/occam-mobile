import PropTypes from 'prop-types';
import { QueryClient, QueryClientProvider as RQProvider, QueryCache } from '@tanstack/react-query';
import logger from '../helpers/logger.helper';

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      logger.error(`Query failed [${query.queryKey.join(',')}]:`, error.message);
    },
  }),
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * (attemptIndex + 1), 5000),
      staleTime: 5 * 60 * 1000,  // 5 minutes
      gcTime: 30 * 60 * 1000,    // 30 minutes
    },
  },
});

export { queryClient };

const QueryClientProvider = ({ children }) => (
  <RQProvider client={queryClient}>{children}</RQProvider>
);

QueryClientProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default QueryClientProvider;
