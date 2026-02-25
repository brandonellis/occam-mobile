import { StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, borderRadius, shadows } from '../theme/spacing';

export const videoAnnotationStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Video
  videoContainer: {
    backgroundColor: colors.black,
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  drawingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  svgCanvas: {
    width: '100%',
    height: '100%',
  },

  // Controls
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    gap: spacing.sm,
  },
  controlButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: colors.surface,
  },
  timeDisplay: {
    ...typography.label,
    color: colors.textPrimary,
    fontSize: 13,
    fontVariant: ['tabular-nums'],
    minWidth: 40,
  },
  controlActions: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  captureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.accent + '15',
  },
  captureButtonText: {
    ...typography.label,
    color: colors.accent,
    fontSize: 12,
    fontWeight: '600',
  },

  // Color picker
  colorPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  colorSwatch: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorSwatchActive: {
    borderColor: colors.textPrimary,
    transform: [{ scale: 1.15 }],
  },

  // Comment bar
  commentBar: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  commentInput: {
    ...typography.body,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 14,
    maxHeight: 80,
    minHeight: 40,
  },
  commentActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  commentCancelButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  commentCancelText: {
    ...typography.label,
    color: colors.textSecondary,
    fontSize: 13,
  },
  commentSaveButton: {
    backgroundColor: colors.accent,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: borderRadius.sm,
    minWidth: 60,
    alignItems: 'center',
  },
  commentSaveText: {
    ...typography.label,
    color: colors.textInverse,
    fontSize: 13,
    fontWeight: '600',
  },

  // Annotations list
  annotationsList: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxxl,
  },
  annotationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
    ...shadows.sm,
  },
  annotationTimestamp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.accent + '15',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: borderRadius.sm,
  },
  annotationTimeText: {
    ...typography.label,
    color: colors.accent,
    fontSize: 12,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  annotationContent: {
    flex: 1,
  },
  annotationComment: {
    ...typography.body,
    color: colors.textPrimary,
    fontSize: 13,
    lineHeight: 18,
  },
  drawingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 4,
  },
  drawingBadgeText: {
    ...typography.bodySmall,
    color: colors.accent,
    fontSize: 11,
  },
  annotationAuthor: {
    ...typography.bodySmall,
    color: colors.textTertiary,
    fontSize: 11,
    marginTop: 4,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: spacing.sm,
  },
  emptyText: {
    ...typography.h3,
    color: colors.textPrimary,
    fontSize: 16,
  },
  emptyHint: {
    ...typography.body,
    color: colors.textTertiary,
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
    lineHeight: 18,
  },
});
