import { StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, borderRadius, shadows } from '../theme/spacing';

export const videoPlayerStyles = StyleSheet.create({
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
    flex: 1,
    textAlign: 'center',
    marginHorizontal: spacing.sm,
  },
  videoWrapper: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: colors.black,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  controlsRow: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  controlButton: {
    padding: spacing.sm,
  },
  headerSpacer: {
    width: 24,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  errorText: {
    ...typography.body,
    color: colors.textInverse,
    textAlign: 'center',
    opacity: 0.8,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.whiteOverlay15,
    marginTop: spacing.sm,
  },
  retryText: {
    ...typography.label,
    color: colors.textInverse,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.overlayDark40,
  },

  // Video container (fixed height when annotations are shown)
  videoContainer: {
    backgroundColor: colors.black,
    position: 'relative',
  },

  // Drawing overlay for annotations
  drawingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },

  // Controls row when annotations are present
  annotationControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    gap: spacing.sm,
  },
  annotationControlButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  annotationsBadge: {
    ...typography.label,
    color: colors.textSecondary,
    fontSize: 13,
  },

  // Annotations list
  annotationsListContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
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
  annotationItemActive: {
    borderWidth: 1.5,
    borderColor: colors.accent,
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
  drawingPreview: {
    marginTop: 4,
    width: 60,
    height: 34,
    borderRadius: 4,
    backgroundColor: colors.gray800,
    overflow: 'hidden',
  },
  drawingPreviewThumbnail: {
    ...StyleSheet.absoluteFillObject,
    width: 60,
    height: 34,
  },
  drawingPreviewSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  annotationAuthor: {
    ...typography.bodySmall,
    color: colors.textTertiary,
    fontSize: 11,
    marginTop: 4,
  },

  // Annotations loading & empty
  annotationsLoadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    paddingVertical: spacing.xl,
  },
  annotationsEmptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
    backgroundColor: colors.background,
  },
  annotationsEmptyText: {
    ...typography.body,
    color: colors.textTertiary,
    fontSize: 13,
  },
});
