import { StyleSheet } from 'react-native';
import { colors, spacing } from '../theme';

export const lessonFeedbackStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  card: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 2,
    color: colors.textPrimary,
  },
  helperText: {
    color: colors.textTertiary,
    marginBottom: spacing.sm,
    lineHeight: 18,
  },
  detailText: {
    color: colors.textPrimary,
    marginBottom: 2,
  },
  secondaryText: {
    color: colors.textSecondary,
    marginTop: 4,
  },
  textInput: {
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  toggleLabel: {
    flex: 1,
  },
  divider: {
    marginVertical: spacing.md,
  },
  searchbar: {
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
  },
  searchResultsCard: {
    marginBottom: spacing.sm,
    maxHeight: 240,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    minHeight: 52,
    gap: spacing.sm,
  },
  searchResultThumb: {
    width: 36,
    height: 36,
    borderRadius: 4,
  },
  searchResultIcon: {
    width: 36,
    height: 36,
    borderRadius: 4,
    backgroundColor: colors.gray50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchResultIconVideo: {
    backgroundColor: colors.accentLight || colors.gray50,
  },
  searchResultInfo: {
    flex: 1,
    minWidth: 0,
  },
  searchResultTitle: {
    color: colors.textPrimary,
  },
  searchResultType: {
    color: colors.textTertiary,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.xs,
  },
  emptyStateText: {
    color: colors.textTertiary,
    textAlign: 'center',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  chip: {
    marginBottom: spacing.xs,
  },
  loader: {
    marginVertical: spacing.md,
  },

  // Compose mode action buttons
  composeActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  composeActionButton: {
    flex: 1,
    minHeight: 44,
  },

  // Preview mode
  webViewContainer: {
    flex: 1,
    marginHorizontal: spacing.sm,
    marginTop: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  previewActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  previewActionButton: {
    flex: 1,
    minHeight: 44,
  },
});
