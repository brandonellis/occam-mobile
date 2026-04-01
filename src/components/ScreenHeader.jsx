import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

const ScreenHeader = ({ title, subtitle, onBack, onClose, rightAction }) => {
  const showClose = onClose && !rightAction;

  return (
    <View style={styles.header}>
      {onBack ? (
        <IconButton
          icon="chevron-left"
          size={24}
          iconColor={colors.textPrimary}
          onPress={onBack}
          accessibilityLabel="Go back"
          accessibilityRole="button"
          style={styles.actionButton}
        />
      ) : (
        <View style={styles.placeholder} />
      )}
      <View style={styles.titleContainer}>
        <Text variant="titleLarge" style={styles.title} numberOfLines={1}>{title}</Text>
        {subtitle ? <Text variant="bodySmall" style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
      </View>
      {rightAction || (showClose ? (
        <IconButton
          icon="close"
          size={22}
          iconColor={colors.textSecondary}
          onPress={onClose}
          accessibilityLabel="Close"
          accessibilityRole="button"
          style={styles.actionButton}
        />
      ) : (
        <View style={styles.placeholder} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    paddingHorizontal: spacing.xs,
    minHeight: 48,
  },
  actionButton: {
    margin: 0,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textTertiary,
    textAlign: 'center',
  },
  placeholder: {
    width: 48,
  },
});

export default ScreenHeader;
