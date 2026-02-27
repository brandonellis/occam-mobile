import { StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, borderRadius } from '../theme/spacing';

export const videoReviewStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.textInverse,
    fontSize: 17,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 48,
  },

  // Video preview
  videoContainer: {
    width: '100%',
    aspectRatio: 9 / 16,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: colors.darkSurface,
    marginBottom: spacing.xl,
    maxHeight: 400,
  },
  video: {
    flex: 1,
  },

  // Form fields
  fieldGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.label,
    color: colors.textInverseMuted,
    fontSize: 13,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.textInverseDisabled,
    borderWidth: 1,
    borderColor: colors.textInverseDisabled,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    ...typography.body,
    color: colors.textInverse,
    minHeight: 48,
  },

  // Upload progress
  progressSection: {
    marginBottom: spacing.xl,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: colors.textInverseDisabled,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 3,
  },
  progressText: {
    ...typography.bodySmall,
    color: colors.textInverseMuted,
    fontSize: 13,
    textAlign: 'center',
  },

  // Action buttons
  actions: {
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  uploadButton: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    minHeight: 52,
  },
  uploadButtonDisabled: {
    opacity: 0.5,
  },
  uploadButtonText: {
    ...typography.button,
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: '700',
  },
  discardButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  discardButtonText: {
    ...typography.body,
    color: colors.textInverseMuted,
    fontSize: 14,
  },

  // Sharing overlay
  sharingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  sharingText: {
    ...typography.body,
    color: colors.textInverse,
    fontSize: 16,
  },
});
