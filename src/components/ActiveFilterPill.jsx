import React from 'react';
import { View, Pressable } from 'react-native';
import { Text, Icon } from 'react-native-paper';
import { activityFeedStyles as styles } from '../styles/activityFeed.styles';
import { colors } from '../theme';

const ActiveFilterPill = ({ label, onRemove }) => (
  <View style={styles.activeFilterPill}>
    <Text style={styles.activeFilterPillText}>{label}</Text>
    <Pressable
      onPress={onRemove}
      style={styles.activeFilterRemoveButton}
      accessibilityLabel={`Remove ${label} filter`}
      accessibilityRole="button"
    >
      <Icon source="close-circle" size={14} color={colors.accent} />
    </Pressable>
  </View>
);

export default React.memo(ActiveFilterPill);
