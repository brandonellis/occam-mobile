import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { activityFeedStyles as styles } from '../styles/activityFeed.styles';
import { colors } from '../theme';

const ActiveFilterPill = ({ label, onRemove }) => (
  <View style={styles.activeFilterPill}>
    <Text style={styles.activeFilterPillText}>{label}</Text>
    <TouchableOpacity onPress={onRemove} hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}>
      <Ionicons name="close-circle" size={14} color={colors.accent} />
    </TouchableOpacity>
  </View>
);

export default React.memo(ActiveFilterPill);
