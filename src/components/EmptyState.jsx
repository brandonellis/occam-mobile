import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Icon } from 'react-native-paper';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

const EmptyState = ({ icon = 'folder-open-outline', title, message, actionLabel, onAction }) => {
  return (
    <View style={styles.container}>
      <Icon source={icon} size={48} color={colors.textTertiary} />
      {title && <Text variant="titleMedium" style={styles.title}>{title}</Text>}
      {message && <Text variant="bodyMedium" style={styles.message}>{message}</Text>}
      {actionLabel && onAction && (
        <Button
          mode="contained"
          onPress={onAction}
          style={styles.actionButton}
          labelStyle={styles.actionLabel}
        >
          {actionLabel}
        </Button>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
  },
  title: {
    color: colors.textPrimary,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  message: {
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center',
    lineHeight: 22,
  },
  actionButton: {
    marginTop: spacing.xl,
  },
  actionLabel: {
    fontWeight: '600',
  },
});

export default EmptyState;
