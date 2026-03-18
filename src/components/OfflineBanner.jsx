import React from 'react';
import { Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useOfflineStatus } from '../hooks/useOfflineStatus';
import { styles } from '../styles/offlineBanner.styles';

/**
 * Renders a sticky banner at the top of the screen when the device has no
 * internet connection.  Mount this once inside RootNavigator so it overlays
 * every screen without duplicating the NetInfo subscription.
 */
export default function OfflineBanner() {
  const isOffline = useOfflineStatus();

  if (!isOffline) return null;

  return (
    <View style={styles.banner}>
      <MaterialCommunityIcons name="wifi-off" size={16} color={styles.text.color} style={styles.icon} />
      <Text style={styles.text}>No internet connection</Text>
    </View>
  );
}
