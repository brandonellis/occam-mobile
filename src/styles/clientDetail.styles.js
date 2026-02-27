import { StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, borderRadius, shadows } from '../theme/spacing';

export const clientDetailStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: spacing.xxxl,
  },
  profileSection: {
    backgroundColor: colors.white,
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  clientName: {
    ...typography.h2,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  clientEmail: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: 2,
  },
  membershipBadge: {
    marginTop: spacing.md,
    backgroundColor: colors.lavenderMistLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  membershipText: {
    ...typography.labelSmall,
    color: colors.twilightPurple,
    fontSize: 11,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    ...shadows.sm,
  },
  statValue: {
    ...typography.h3,
    color: colors.accent,
  },
  statLabel: {
    ...typography.bodySmall,
    color: colors.textTertiary,
    marginTop: 2,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  actionRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentLight,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  actionButtonText: {
    ...typography.label,
    color: colors.accent,
    fontSize: 13,
  },
  moduleItem: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  moduleName: {
    ...typography.label,
    color: colors.textPrimary,
  },
  moduleProgress: {
    ...typography.bodySmall,
    color: colors.success,
    marginTop: 2,
  },
  bookingItem: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  bookingService: {
    ...typography.label,
    color: colors.textPrimary,
  },
  bookingDate: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // Shared resources
  sharedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  sharedItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
  },
  sharedItemThumb: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background,
  },
  sharedItemThumbPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sharedItemInfo: {
    flex: 1,
  },
  sharedItemName: {
    ...typography.label,
    color: colors.textPrimary,
    fontSize: 13,
  },
  sharedItemNotes: {
    ...typography.bodySmall,
    color: colors.textTertiary,
    fontSize: 12,
    marginTop: 1,
  },

  sharedItemPlayOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: borderRadius.sm,
  },

  sharedMediaActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },

  // Section header with action
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  shareProgressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  shareProgressText: {
    ...typography.label,
    color: colors.accent,
    fontSize: 13,
    fontWeight: '600',
  },

  // Snapshots
  snapshotItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
    ...shadows.sm,
  },
  snapshotInfo: {
    flex: 1,
  },
  snapshotTitle: {
    ...typography.label,
    color: colors.textPrimary,
    fontSize: 13,
  },
  snapshotDate: {
    ...typography.bodySmall,
    color: colors.textTertiary,
    fontSize: 12,
    marginTop: 1,
  },

  // Show more toggle
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  showMoreText: {
    ...typography.label,
    color: colors.accent,
    fontSize: 13,
    fontWeight: '600',
  },

  // Empty mini state
  emptyMini: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  emptyMiniText: {
    ...typography.bodySmall,
    color: colors.textTertiary,
    textAlign: 'center',
    fontSize: 13,
  },
});
