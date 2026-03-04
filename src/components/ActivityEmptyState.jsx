import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { activityFeedStyles as styles } from '../styles/activityFeed.styles';
import { colors } from '../theme';

const ActivityEmptyState = ({ filterActive, message }) => (
  <View style={styles.emptyContainer}>
    <View style={styles.emptyIconContainer}>
      <Ionicons
        name={filterActive ? 'filter-outline' : 'pulse-outline'}
        size={36}
        color={colors.accent}
      />
    </View>
    <Text style={styles.emptyTitle}>
      {filterActive ? 'No matching activity' : 'No activity yet'}
    </Text>
    <Text style={styles.emptySubtitle}>
      {filterActive
        ? 'Try a different filter to see more activity.'
        : (message || 'Lessons, shared resources, bookings, and progress reports will appear here.')}
    </Text>
  </View>
);

export default React.memo(ActivityEmptyState);
