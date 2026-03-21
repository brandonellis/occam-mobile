import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';

/**
 * Returns true when the device has no reachable internet connection.
 * Subscribes to NetInfo events and updates immediately on change.
 */
export function useOfflineStatus() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Fetch current state immediately on mount
    NetInfo.fetch().then((state) => {
      setIsOffline(!state.isConnected || state.isInternetReachable === false);
    }).catch(() => {});

    // Subscribe to future changes
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOffline(!state.isConnected || state.isInternetReachable === false);
    });

    return unsubscribe;
  }, []);

  return isOffline;
}
