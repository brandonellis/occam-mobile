import { StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { spacing, borderRadius } from '../theme/spacing';

const BONE_COLOR = colors.gray200;

export const skeletonStyles = StyleSheet.create({
  // Base block
  block: {
    backgroundColor: BONE_COLOR,
    borderRadius: borderRadius.sm,
  },

  // Dashboard skeleton container
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.tabBarClearance,
  },

  // Header / greeting
  headerArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xl,
  },
  greetingLine: {
    width: 180,
    height: 22,
    borderRadius: borderRadius.sm,
  },
  subtitleLine: {
    width: 140,
    height: 14,
    borderRadius: borderRadius.xs,
    marginTop: spacing.sm,
  },
  iconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },

  // Stats row (coach dashboard)
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1,
    height: 72,
    borderRadius: borderRadius.lg,
  },

  // Quick actions
  quickActionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  quickActionCard: {
    flex: 1,
    height: 72,
    borderRadius: borderRadius.lg,
  },

  // Section headers
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitleLine: {
    width: 120,
    height: 16,
    borderRadius: borderRadius.xs,
    marginBottom: spacing.md,
  },
  seeAllLine: {
    width: 48,
    height: 14,
    borderRadius: borderRadius.xs,
  },

  // Booking card skeleton
  bookingCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  bookingCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeBlock: {
    width: 64,
    marginRight: spacing.md,
  },
  timeLine: {
    width: 48,
    height: 14,
    borderRadius: borderRadius.xs,
  },
  dateLine: {
    width: 36,
    height: 10,
    borderRadius: borderRadius.xs,
    marginTop: spacing.xs,
  },
  bookingContent: {
    flex: 1,
  },
  serviceLine: {
    width: '70%',
    height: 14,
    borderRadius: borderRadius.xs,
  },
  coachLine: {
    width: '50%',
    height: 12,
    borderRadius: borderRadius.xs,
    marginTop: spacing.sm,
  },
  locationLine: {
    width: '40%',
    height: 12,
    borderRadius: borderRadius.xs,
    marginTop: spacing.xs,
  },

  // List skeleton (clients, notifications, etc.)
  listContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  listAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  listContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  listPrimaryLine: {
    width: '60%',
    height: 14,
    borderRadius: borderRadius.xs,
  },
  listSecondaryLine: {
    width: '40%',
    height: 12,
    borderRadius: borderRadius.xs,
    marginTop: spacing.sm,
  },

  // Schedule skeleton
  scheduleContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.tabBarClearance,
  },
  summaryCardSkeleton: {
    height: 72,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  timelineRowSkeleton: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
    minHeight: 80,
  },
  timeLabelSkeleton: {
    width: 56,
    paddingTop: spacing.xs,
    alignItems: 'flex-end',
  },
  timeLabelLine: {
    width: 40,
    height: 12,
    borderRadius: borderRadius.xs,
  },
  sessionCardSkeleton: {
    flex: 1,
    marginLeft: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: BONE_COLOR,
  },

  // Detail skeleton
  detailHeader: {
    height: 100,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  detailIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: spacing.md,
  },
});
