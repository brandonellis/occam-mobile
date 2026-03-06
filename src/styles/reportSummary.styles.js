import { StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

// Compact report summary styles — used in ActivityCard
export const reportCardStyles = StyleSheet.create({
  container: {
    marginTop: 8,
    padding: 10,
    backgroundColor: colors.gray50,
    borderRadius: 10,
  },
  section: {
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    flex: 1,
  },
  value: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.gray200,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
  },
  scoresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  scoreChip: {
    backgroundColor: colors.white,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
    minWidth: 60,
  },
  scoreLabel: {
    fontSize: 10,
    color: colors.textTertiary,
    marginBottom: 1,
  },
  scoreValue: {
    fontSize: 14,
    fontWeight: '700',
  },
});

// Detailed report section styles — used in ActivityDetailSheet
export const reportDetailStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
  },
  coachText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  section: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    flex: 1,
  },
  sectionValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.gray200,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
  },
  moduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  moduleTitle: {
    fontSize: 13,
    color: colors.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  moduleCount: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  assessmentDate: {
    fontSize: 12,
    color: colors.textTertiary,
    marginBottom: 8,
  },
  scoresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  scoreCard: {
    backgroundColor: colors.gray50,
    borderRadius: 8,
    padding: 10,
    minWidth: '45%',
    flex: 1,
  },
  scoreLabel: {
    fontSize: 11,
    color: colors.textTertiary,
    marginBottom: 2,
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  scoreBar: {
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.gray200,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: 3,
    borderRadius: 1.5,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textTertiary,
    fontStyle: 'italic',
    marginTop: spacing.sm,
  },
});
