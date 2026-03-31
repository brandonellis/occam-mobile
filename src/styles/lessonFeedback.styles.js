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
    marginBottom: spacing.xs,
    color: colors.textPrimary,
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
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingVertical: spacing.xs,
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
    maxHeight: 200,
  },
  searchResultItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    minHeight: 44,
    justifyContent: 'center',
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
