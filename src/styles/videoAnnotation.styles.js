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

  videoContainerDrawing: {
    borderWidth: 2,
    borderColor: colors.accent,
  },
  drawingModeLabel: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.accent,
    paddingVertical: 3,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    zIndex: 10,
  },
  drawingModeLabelText: {
    ...typography.labelSmall,
    color: colors.textInverse,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Scrubber / seek bar
  scrubberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    gap: spacing.sm,
  },
  scrubberTime: {
    ...typography.label,
    color: colors.textSecondary,
    fontSize: 11,
    fontVariant: ['tabular-nums'],
    minWidth: 32,
    textAlign: 'center',
  },
  scrubberTrack: {
    flex: 1,
    height: 44,
    justifyContent: 'center',
    position: 'relative',
  },
  scrubberTrackBg: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.gray200,
  },
  scrubberTrackFill: {
    position: 'absolute',
    left: 0,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.accent,
  },
  scrubberThumb: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.accent,
    borderWidth: 2,
    borderColor: colors.white,
    marginLeft: -10,
    top: 12,
    ...shadows.md,
  },
  scrubberMarker: {
    position: 'absolute',
    width: 3,
    height: 10,
    borderRadius: 1.5,
    backgroundColor: colors.warning,
    marginLeft: -1.5,
    top: 17,
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
    gap: spacing.xs,
  },
  controlButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: colors.surface,
  },
  frameStepButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  controlActions: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.xs,
  },
  captureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minHeight: 36,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.accent + '15',
  },
  captureButtonText: {
    ...typography.label,
    color: colors.accent,
    fontSize: 12,
    fontWeight: '600',
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonDone: {
    backgroundColor: colors.success + '15',
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
  colorSwatchWhite: {
    borderColor: colors.gray300,
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
    backgroundColor: colors.gray50,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 14,
    maxHeight: 80,
    minHeight: 40,
  },
  charCounter: {
    ...typography.caption,
    color: colors.textTertiary,
    textAlign: 'right',
    marginTop: spacing.xs,
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
  deleteButton: {
    padding: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawingPreview: {
    marginTop: 4,
    width: 60,
    height: 34,
    borderRadius: 4,
    backgroundColor: colors.gray800,
    overflow: 'hidden',
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
