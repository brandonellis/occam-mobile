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
  sendButton: {
    marginTop: spacing.md,
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
});
