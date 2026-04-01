import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text, Icon } from 'react-native-paper';
import { activityFeedStyles as styles } from '../styles/activityFeed.styles';
import { colors } from '../theme';
import { haptic } from '../helpers/haptic.helper';

const FilterPill = ({ icon, label, isActive, count, onPress }) => (
  <TouchableOpacity
    style={[styles.filterPill, isActive && styles.filterPillActive]}
    onPress={() => { haptic.selection(); onPress(); }}
    activeOpacity={0.7}
    accessibilityLabel={`${label}${count > 0 ? `, ${count} items` : ''}`}
    accessibilityRole="button"
    accessibilityState={{ selected: isActive }}
  >
    <Icon
      source={icon}
      size={14}
      color={isActive ? colors.textInverse : colors.textSecondary}
    />
    <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>
      {label}
    </Text>
    {count > 0 ? (
      <View style={styles.filterPillBadge}>
        <Text style={styles.filterPillBadgeText}>{count}</Text>
      </View>
    ) : (
      <Icon
        source="chevron-down"
        size={12}
        color={isActive ? colors.textInverse : colors.textTertiary}
      />
    )}
  </TouchableOpacity>
);

export default React.memo(FilterPill);
