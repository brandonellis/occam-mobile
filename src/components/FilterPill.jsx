import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { activityFeedStyles as styles } from '../styles/activityFeed.styles';
import { colors } from '../theme';

const FilterPill = ({ icon, label, isActive, count, onPress }) => (
  <TouchableOpacity
    style={[styles.filterPill, isActive && styles.filterPillActive]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <MaterialCommunityIcons
      name={icon}
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
      <MaterialCommunityIcons
        name="chevron-down"
        size={12}
        color={isActive ? colors.textInverse : colors.textTertiary}
        style={{ marginLeft: 2 }}
      />
    )}
  </TouchableOpacity>
);

export default React.memo(FilterPill);
