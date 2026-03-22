import PropTypes from 'prop-types';
import { QueryClient, QueryClientProvider as RQProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
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
