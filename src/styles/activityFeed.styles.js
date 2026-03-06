import { StyleSheet, Dimensions } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, borderRadius, shadows } from '../theme/spacing';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const activityFeedStyles = StyleSheet.create({
  // ── Screen layout ──────────────────────────────────────
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
  headerTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },

  // ── Unified filter toolbar ────────────────────────────────
  filterToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  filterPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterPillText: {
    ...typography.labelSmall,
    color: colors.textSecondary,
    textTransform: 'none',
    letterSpacing: 0,
    fontWeight: '500',
    marginLeft: 5,
  },
  filterPillTextActive: {
    color: colors.textInverse,
  },
  filterPillBadge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    marginLeft: 4,
  },
  filterPillBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textInverse,
  },
  clearAllButton: {
    padding: spacing.sm,
    marginLeft: 'auto',
  },

  // ── Active filter summary pills ──────────────────────────
  activeFiltersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
  },
  activeFilterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentSubtle,
    borderRadius: borderRadius.full,
    paddingLeft: spacing.sm,
    paddingRight: 6,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 4,
  },
  activeFilterPillText: {
    ...typography.bodySmall,
    fontSize: 11,
    color: colors.accent,
    fontWeight: '600',
    marginRight: 4,
  },

  // ── Timeline ───────────────────────────────────────────
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.tabBarClearance,
  },

  // ── Date separator ─────────────────────────────────────
  dateSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  dateDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
    marginRight: spacing.sm,
  },
  dateLabel: {
    ...typography.labelSmall,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  dateLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.borderLight,
    marginLeft: spacing.sm,
  },

  // ── Activity card ──────────────────────────────────────
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadows.sm,
  },
  cardPressed: {
    opacity: 0.95,
    transform: [{ scale: 0.99 }],
  },
  cardAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 3,
    height: '100%',
    borderTopLeftRadius: borderRadius.lg,
    borderBottomLeftRadius: borderRadius.lg,
  },
  cardBody: {
    padding: spacing.lg,
    paddingLeft: spacing.lg + 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  cardHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  cardTitleGroup: {
    flex: 1,
  },
  cardTitle: {
    ...typography.label,
    color: colors.textPrimary,
  },
  cardMeta: {
    ...typography.bodySmall,
    color: colors.textTertiary,
    marginTop: 1,
  },
  cardTypeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    marginLeft: spacing.sm,
  },
  cardTypeBadgeText: {
    ...typography.bodySmall,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },

  // ── Card content sections ──────────────────────────────
  cardContent: {
    marginTop: spacing.md,
  },
  cardDescription: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  cardServiceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.accentSubtle,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
    marginTop: spacing.sm,
  },
  cardServiceText: {
    ...typography.bodySmall,
    color: colors.accent,
    fontWeight: '500',
    marginLeft: 4,
  },

  // ── Coach info ─────────────────────────────────────────
  coachRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  coachAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  coachAvatarText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.accent,
  },
  coachName: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '500',
  },

  // ── Media preview ──────────────────────────────────────
  mediaPreview: {
    marginTop: spacing.md,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    backgroundColor: colors.gray100,
  },
  mediaThumbnail: {
    width: '100%',
    height: 160,
    borderRadius: borderRadius.md,
  },
  mediaOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
  },

  // ── Card footer ────────────────────────────────────────
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.lg,
  },
  footerText: {
    ...typography.bodySmall,
    color: colors.textTertiary,
    marginLeft: 4,
  },
  footerSpacer: {
    flex: 1,
  },
  footerTime: {
    ...typography.bodySmall,
    color: colors.textTertiary,
  },

  // ── Empty state ────────────────────────────────────────
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.xxxl * 2,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.accentSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 22,
  },

  // ── Loading / skeleton ─────────────────────────────────
  skeletonCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skeletonCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.gray100,
    marginRight: spacing.md,
  },
  skeletonLine: {
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.gray100,
  },
  skeletonLineShort: {
    width: '40%',
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.gray100,
    marginTop: 6,
  },
  skeletonBody: {
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.gray100,
    marginTop: spacing.md,
    width: '90%',
  },
  skeletonBodyShort: {
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.gray100,
    marginTop: spacing.sm,
    width: '60%',
  },

  // ── Load more ──────────────────────────────────────────
  loadMoreContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  loadMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  loadMoreText: {
    ...typography.label,
    color: colors.accent,
    marginLeft: spacing.sm,
  },

  // ── Detail sheet ───────────────────────────────────────
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.gray300,
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  sheetTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    flex: 1,
  },
  sheetClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetBody: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  sheetSection: {
    marginBottom: spacing.xl,
  },
  sheetSectionTitle: {
    ...typography.labelSmall,
    color: colors.textTertiary,
    marginBottom: spacing.md,
  },

  // ── Notes ──────────────────────────────────────────────
  noteItem: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  noteAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    marginTop: 2,
  },
  noteAvatarText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.accent,
  },
  noteBubble: {
    flex: 1,
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  noteAuthor: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  noteText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: 4,
  },
  noteTime: {
    ...typography.bodySmall,
    color: colors.textTertiary,
    marginTop: 4,
    fontSize: 11,
  },

  // ── Tags row ───────────────────────────────────────────
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.sm,
  },
  tag: {
    backgroundColor: colors.gray100,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    marginRight: 4,
    marginBottom: 4,
  },
  tagText: {
    ...typography.bodySmall,
    fontSize: 10,
    color: colors.textTertiary,
    fontWeight: '500',
  },

  // ── Dropdown overlay ───────────────────────────────────
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  dropdownSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '60%',
    paddingBottom: spacing.xxxl,
  },
  dropdownHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.gray300,
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  dropdownTitle: {
    ...typography.label,
    color: colors.textPrimary,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  dropdownOptionActive: {
    backgroundColor: colors.accentSubtle,
  },
  dropdownOptionText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  dropdownOptionTextActive: {
    color: colors.accent,
    fontWeight: '600',
  },

  // ── Sheet done button ───────────────────────────────────
  sheetDoneButton: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.accent,
    alignItems: 'center',
  },
  sheetDoneButtonText: {
    ...typography.label,
    color: colors.textInverse,
    fontWeight: '600',
  },

  // ── Comment composer ───────────────────────────────────
  composerSafeArea: {
    backgroundColor: colors.surface,
  },
  composerBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    backgroundColor: colors.surface,
  },
  composerInput: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    maxHeight: 100,
    minHeight: 40,
  },
  composerSend: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  composerSendDisabled: {
    opacity: 0.4,
  },
});
