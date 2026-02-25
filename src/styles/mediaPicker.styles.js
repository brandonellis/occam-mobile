import { StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, borderRadius } from '../theme/spacing';

export const mediaPickerStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerCancel: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 15,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    fontSize: 17,
  },
  headerDone: {
    ...typography.label,
    color: colors.accent,
    fontSize: 15,
    fontWeight: '600',
  },

  // Search
  searchBar: {
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
  },
  searchInput: {
    ...typography.body,
    color: colors.textPrimary,
  },

  // Notes
  notesRow: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  notesInput: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    ...typography.body,
    color: colors.textPrimary,
    minHeight: 44,
    maxHeight: 80,
  },

  // Grid
  gridContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  gridRow: {
    gap: 6,
    marginBottom: 6,
  },

  // Media item
  mediaItem: {
    flex: 1,
    maxWidth: '33%',
    alignItems: 'center',
  },
  mediaItemSelected: {
    opacity: 1,
  },
  mediaItemDisabled: {
    opacity: 0.45,
  },
  mediaThumbnail: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  mediaThumbnailImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  selectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(76, 172, 213, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  sharedBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: colors.success,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  sharedBadgeText: {
    ...typography.bodySmall,
    color: colors.textInverse,
    fontSize: 9,
    fontWeight: '700',
  },
  mediaName: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
    width: '100%',
  },

  // Loading / empty
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 64,
    gap: spacing.md,
  },
  emptyText: {
    ...typography.body,
    color: colors.textTertiary,
  },
});
