import { StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';

const SWITCH_COL_WIDTH = 52;

export const notificationPreferencesStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: spacing.tabBarClearance,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.surface,
  },
  headerLabel: {
    flex: 1,
    ...typography.labelSmall,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingLeft: spacing.sm,
  },
  headerChannelLabel: {
    width: SWITCH_COL_WIDTH,
    textAlign: 'center',
    ...typography.labelSmall,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.surface,
    minHeight: 44,
  },
  eventLabelContainer: {
    flex: 1,
    paddingLeft: spacing.sm,
    paddingRight: spacing.xs,
  },
  eventLabel: {
    ...typography.bodySmall,
    color: colors.textPrimary,
  },
  transactionalHint: {
    ...typography.bodySmall,
    fontSize: 10,
    color: colors.textTertiary,
    marginTop: 1,
  },
  switchCell: {
    width: SWITCH_COL_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switch: {
    transform: [{ scale: 0.7 }],
  },
});
