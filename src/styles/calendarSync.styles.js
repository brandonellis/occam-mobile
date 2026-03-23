import { StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { spacing, borderRadius } from '../theme/spacing';

export const calendarSyncStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.md,
  },
  loadingIndicator: {
    marginTop: spacing.xl,
  },
  surface: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  feedUrlContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  feedUrlInput: {
    fontSize: 12,
    marginBottom: spacing.xs,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  sectionTitle: {
    marginBottom: spacing.xs,
  },
  sectionDescription: {
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  connectedSection: {
    gap: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  emailText: {
    color: colors.textSecondary,
  },
  errorText: {
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});
