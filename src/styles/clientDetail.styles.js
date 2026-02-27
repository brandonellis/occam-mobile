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
  sharedMediaCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  sharedMediaPreview: {
    width: '100%',
    height: 180,
    backgroundColor: colors.borderLight,
  },
  sharedMediaVideoContainer: {
    width: '100%',
    height: 180,
    backgroundColor: colors.borderLight,
  },
  sharedMediaVideoPlaceholder: {
    width: '100%',
    height: 180,
    backgroundColor: colors.gray800,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sharedMediaPlayOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  sharedMediaDocPlaceholder: {
    width: '100%',
    height: 100,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  sharedMediaDocType: {
    ...typography.labelSmall,
    color: colors.textTertiary,
    fontSize: 10,
  },
  sharedMediaInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  sharedMediaInfo: {
    flex: 1,
    marginRight: spacing.sm,
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
  snackbar: {
    backgroundColor: colors.gray800,
    marginBottom: spacing.lg,
    marginHorizontal: spacing.md,
    borderRadius: borderRadius.md,
  },
});
