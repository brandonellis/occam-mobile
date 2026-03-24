import { StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, borderRadius } from '../theme/spacing';

export const emailDraftStyles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.gray50,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerText: {
    ...typography.label,
    color: colors.textPrimary,
    flex: 1,
  },
  recipientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  recipientLabel: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.textTertiary,
    width: 56,
  },
  recipientValue: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    flex: 1,
  },
  errorRow: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.errorLight,
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.error,
  },
  editForm: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  subjectInput: {
    backgroundColor: colors.surface,
  },
  bodyInput: {
    backgroundColor: colors.surface,
    minHeight: 120,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  actionsSpacer: {
    flex: 1,
  },
  actionButton: {
    minHeight: 44,
  },
  webViewContainer: {
    marginHorizontal: spacing.sm,
    marginTop: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: 'hidden',
    position: 'relative',
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  fadeOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: spacing.xs,
    backgroundColor: colors.whiteOverlay85,
  },
  sentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.successLight,
    marginBottom: spacing.sm,
  },
  sentText: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  discardedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray50,
    marginBottom: spacing.sm,
  },
  discardedText: {
    ...typography.bodySmall,
    color: colors.textTertiary,
  },
});
