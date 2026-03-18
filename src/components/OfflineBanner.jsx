import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useOfflineStatus } from '../hooks/useOfflineStatus';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

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
      <MaterialCommunityIcons name="wifi-off" size={16} color={colors.white} style={styles.icon} />
      <Text style={styles.text}>No internet connection</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    backgroundColor: colors.error || '#D32F2F',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  icon: {
    marginRight: 6,
  },
  text: {
    color: colors.white || '#FFFFFF',
    fontSize: 13,
    fontFamily: typography?.medium || undefined,
    fontWeight: '500',
  },
});
