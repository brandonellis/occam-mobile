import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';

/**
 * Triggers a React Query refetch when the screen gains navigation focus.
 * Replaces the common pattern: navigation.addListener('focus', loadData)
 *
 * @param {Function} refetch - The refetch function from useQuery
 * @param {boolean} [enabled=true] - Whether refetch-on-focus is active
 */
const useRefetchOnFocus = (refetch, enabled = true) => {
  useFocusEffect(
    useCallback(() => {
      if (enabled) refetch();
    }, [refetch, enabled])
  );
};

export default useRefetchOnFocus;
