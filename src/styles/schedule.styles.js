import { StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, borderRadius, shadows } from '../theme/spacing';

export const scheduleStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
  },
  newBookingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.peachGlowLight,
  },
  newBookingText: {
    ...typography.label,
    color: colors.accent,
    fontSize: 13,
    fontWeight: '600',
  },
  headerTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  dateStrip: {
    backgroundColor: colors.white,
    flexGrow: 0,
    paddingVertical: spacing.xs,
  },
  dateItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    marginHorizontal: spacing.xs,
    borderRadius: borderRadius.sm,
    minWidth: 44,
    height: 52,
  },
  dateItemSelected: {
    backgroundColor: colors.primary,
  },
  dateItemToday: {
    borderWidth: 1,
    borderColor: colors.accent,
  },
  dateDayName: {
    ...typography.labelSmall,
    color: colors.textTertiary,
    fontSize: 10,
  },
  dateDayNumber: {
    ...typography.label,
    color: colors.textPrimary,
    marginTop: 1,
    fontSize: 15,
  },
  dateDayNameSelected: {
    color: colors.textInverse,
  },
  dateDayNumberSelected: {
    color: colors.textInverse,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.tabBarClearance,
  },
  timelineRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
    minHeight: 72,
  },
  timeLabel: {
    width: 52,
    paddingTop: spacing.xs,
  },
  timeLabelText: {
    ...typography.bodySmall,
    color: colors.textTertiary,
    fontSize: 12,
  },
  timelineContent: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  sessionCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.info,
    ...shadows.sm,
  },
  sessionService: {
    ...typography.label,
    color: colors.textPrimary,
  },
  sessionClient: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: 2,
  },
  sessionTime: {
    ...typography.bodySmall,
    color: colors.textTertiary,
    marginTop: 2,
  },
  sessionCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  cancelButton: {
    padding: 2,
    marginLeft: spacing.sm,
  },
  sessionLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  sessionLocationText: {
    ...typography.bodySmall,
    color: colors.textTertiary,
    fontSize: 11,
  },
  emptyTimeline: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
  },
  emptyTimelineText: {
    ...typography.body,
    color: colors.textTertiary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
});
