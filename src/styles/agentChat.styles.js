import { StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, borderRadius, shadows } from '../theme/spacing';

export const agentChatStyles = StyleSheet.create({
  messagesPanel: {
    flex: 1,
    marginTop: spacing.md,
  },
  messageListContent: {
    paddingBottom: spacing.lg,
    gap: spacing.xs,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  assistantRow: {
    justifyContent: 'flex-start',
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  avatarWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assistantAvatar: {
    backgroundColor: colors.gray100,
  },
  userAvatar: {
    backgroundColor: colors.accent,
  },
  avatarText: {
    ...typography.labelSmall,
    fontSize: 11,
    color: colors.textSecondary,
  },
  userAvatarText: {
    ...typography.labelSmall,
    fontSize: 11,
    color: colors.textInverse,
  },
  avatarSpacer: {
    width: 28,
  },
  bubbleContentWrap: {
    flex: 0,
    maxWidth: '80%',
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 20,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  assistantBubble: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  successBubble: {
    borderWidth: 1,
    borderColor: colors.success,
    backgroundColor: colors.successLight,
  },
  errorBubble: {
    borderWidth: 1,
    borderColor: colors.error,
    backgroundColor: colors.errorLight,
  },
  userBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 6,
  },
  assistantText: {
    ...typography.body,
    color: colors.textPrimary,
    lineHeight: 21,
  },
  userText: {
    ...typography.body,
    color: colors.textInverse,
    lineHeight: 21,
  },
  messageTimestamp: {
    ...typography.bodySmall,
    fontSize: 10,
    color: colors.textTertiary,
    marginTop: 2,
    paddingHorizontal: spacing.xs,
  },
  timestampRight: {
    textAlign: 'right',
  },
  responseCard: {
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bookingCard: {
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primaryLight,
  },
  bookingCardTitle: {
    ...typography.bodySmall,
    color: colors.primary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  bookingPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  bookingPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bookingPillText: {
    ...typography.bodySmall,
    color: colors.textPrimary,
  },
  bookingEligibility: {
    ...typography.bodySmall,
    color: colors.primary,
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  bookingButton: {
    borderRadius: borderRadius.sm,
  },
  responseCardTitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  responseStatsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  responseStatItem: {
    minWidth: 88,
    flex: 1,
  },
  responseStatValue: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  responseStatLabel: {
    ...typography.bodySmall,
    color: colors.textTertiary,
  },
  responseFields: {
    gap: spacing.sm,
  },
  responseField: {
    gap: spacing.xs,
  },
  responseFieldLabel: {
    ...typography.bodySmall,
    color: colors.textTertiary,
    textTransform: 'uppercase',
  },
  responseFieldValue: {
    ...typography.body,
    color: colors.textPrimary,
  },
  responseTable: {
    gap: spacing.xs,
  },
  responseTableRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  responseTableHeader: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    flex: 1,
  },
  responseTableCell: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    flex: 1,
  },
  handoffCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  handoffCardGradientBg: {
    backgroundColor: colors.primary,
  },
  handoffCardLightBg: {
    backgroundColor: colors.infoLight,
    borderWidth: 1,
    borderColor: colors.info,
  },
  handoffEyebrow: {
    ...typography.labelSmall,
    fontSize: 10,
    color: colors.aquaLight,
    marginBottom: spacing.sm,
    letterSpacing: 1,
  },
  handoffEyebrowLight: {
    color: colors.info,
  },
  handoffTitle: {
    ...typography.h3,
    fontSize: 16,
    color: colors.textInverse,
    marginBottom: spacing.xs,
  },
  handoffTitleLight: {
    color: colors.textPrimary,
  },
  handoffSummary: {
    ...typography.body,
    color: colors.textInverseMuted,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  handoffSummaryLight: {
    color: colors.textSecondary,
  },
  handoffDetailToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  handoffDetailToggleText: {
    ...typography.bodySmall,
    color: colors.aquaLight,
  },
  handoffDetailToggleTextLight: {
    color: colors.accent,
  },
  handoffPromptWrap: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  handoffPromptWrapLight: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  handoffPromptLabel: {
    ...typography.labelSmall,
    fontSize: 9,
    color: colors.textInverseMuted,
    marginBottom: spacing.xs,
    letterSpacing: 0.8,
  },
  handoffPromptLabelLight: {
    color: colors.textTertiary,
  },
  handoffPrompt: {
    ...typography.bodySmall,
    color: colors.textInverse,
    lineHeight: 18,
  },
  handoffPromptLight: {
    color: colors.textPrimary,
  },
  handoffAction: {
    marginTop: spacing.xs,
  },
  confirmationList: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  confirmationCard: {
    backgroundColor: colors.warningLight,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
    borderWidth: 1,
    borderColor: colors.border,
  },
  confirmationEyebrow: {
    ...typography.labelSmall,
    fontSize: 10,
    color: colors.warning,
    marginBottom: spacing.sm,
    letterSpacing: 0.8,
  },
  confirmationTitle: {
    ...typography.label,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  confirmationDescription: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  confirmationActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionDivider: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    backgroundColor: colors.border,
  },
  actionNextStep: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  composerWrap: {
    marginTop: spacing.md,
  },
  composerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    paddingLeft: spacing.lg,
    paddingRight: spacing.xs,
    paddingVertical: spacing.xs,
  },
  composerRowFocused: {
    borderColor: colors.accent,
  },
  composerInput: {
    flex: 1,
    backgroundColor: 'transparent',
    minHeight: 40,
    maxHeight: 100,
    paddingVertical: 0,
    marginVertical: 0,
    ...typography.body,
    color: colors.textPrimary,
  },
  sendButtonCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  sendButtonDisabled: {
    backgroundColor: colors.gray300,
  },
  sendButtonIcon: {
    color: colors.textInverse,
  },
  loadingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingLeft: 36,
  },
  loadingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  loadingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
  },
  loadingText: {
    ...typography.bodySmall,
    color: colors.textTertiary,
    marginLeft: spacing.xs,
  },
  suggestionsWrap: {
    marginBottom: spacing.sm,
  },
  suggestionScrollContent: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  suggestionChip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  suggestionChipPressed: {
    backgroundColor: colors.accentSubtle,
    borderColor: colors.accent,
  },
  suggestionChipIcon: {
    color: colors.accent,
  },
  suggestionChipText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  insightsRow: {
    gap: spacing.md,
    paddingRight: spacing.lg,
  },
  insightCard: {
    width: 240,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  insightCardAccent: {
    borderLeftWidth: 3,
  },
  insightCardAccentBlue: {
    borderLeftColor: colors.accent,
  },
  insightCardAccentGold: {
    borderLeftColor: colors.warning,
  },
  insightCardAccentCoral: {
    borderLeftColor: colors.error,
  },
  insightTitle: {
    ...typography.label,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  insightBody: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  insightActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  insightActionText: {
    ...typography.bodySmall,
    color: colors.accent,
    fontWeight: '600',
  },
  insightActionArrow: {
    color: colors.accent,
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.error,
    marginTop: spacing.sm,
  },

  // Availability card
  availabilityCard: {
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  availabilityHeader: {
    marginBottom: spacing.md,
  },
  availabilityService: {
    ...typography.label,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  availabilityLocation: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  availabilityEligibility: {
    ...typography.bodySmall,
    color: colors.accent,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  availabilityDayTabs: {
    marginBottom: spacing.md,
  },
  availabilityDayTabScroll: {
    gap: spacing.sm,
  },
  availabilityDayTab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  availabilityDayTabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  availabilityDayTabText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  availabilityDayTabTextActive: {
    color: colors.textInverse,
  },
  availabilityDayTabCount: {
    ...typography.bodySmall,
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  availabilityDayTabCountActive: {
    color: colors.textInverseMuted,
  },
  availabilitySlotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  availabilitySlot: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    minWidth: 80,
  },
  availabilitySlotPressed: {
    backgroundColor: colors.accentSubtle,
    borderColor: colors.accent,
  },
  availabilitySlotTime: {
    ...typography.label,
    color: colors.textPrimary,
  },
  availabilitySlotCoach: {
    ...typography.bodySmall,
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },
  availabilityFooter: {
    ...typography.bodySmall,
    color: colors.textTertiary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  availabilityShowMore: {
    alignSelf: 'center',
    marginTop: spacing.sm,
  },
});
