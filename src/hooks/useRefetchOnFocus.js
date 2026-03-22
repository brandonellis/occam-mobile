import { useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';

/**
 * Triggers a React Query refetch when the screen gains navigation focus.
 * Skips the initial mount (React Query handles the initial fetch) so that
 * staleTime is respected on first render.
 *
 * @param {Function} refetch - The refetch function from useQuery
 * @param {boolean} [enabled=true] - Whether refetch-on-focus is active
 */
const useRefetchOnFocus = (refetch, enabled = true) => {
  const isFirstMount = useRef(true);

  useFocusEffect(
    useCallback(() => {
      if (isFirstMount.current) {
        isFirstMount.current = false;
        return; // skip initial mount - React Query handles initial fetch
      }
      if (enabled) refetch();
    }, [refetch, enabled]),
  );
};

export default useRefetchOnFocus;
