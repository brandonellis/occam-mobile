import { StyleSheet } from 'react-native';
import { typography } from '../theme/typography';
import { spacing, borderRadius } from '../theme/spacing';
import { colors } from '../theme/colors';

export const videoRecordingStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  camera: {
    flex: 1,
    justifyContent: 'space-between',
  },

  // Top bar
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: spacing.lg,
  },
  topButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.85)',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
    gap: 8,
  },
  timerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.textInverse,
  },
  timerText: {
    ...typography.label,
    color: colors.textInverse,
    fontSize: 15,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },

  // Bottom controls
  bottomBar: {
    alignItems: 'center',
    paddingBottom: 48,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 36,
    marginBottom: spacing.md,
  },
  recordButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: colors.textInverse,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  recordButtonActive: {
    borderColor: 'rgba(255, 59, 48, 0.6)',
  },
  recordDot: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.destructive,
  },
  stopIcon: {
    width: 28,
    height: 28,
    borderRadius: 4,
    backgroundColor: colors.destructive,
  },
  hint: {
    ...typography.bodySmall,
    color: colors.textInverseMuted,
    fontSize: 13,
  },

  // Permission screen
  permissionContainer: {
    flex: 1,
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  permissionTitle: {
    ...typography.h3,
    color: colors.textInverse,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  permissionMessage: {
    ...typography.body,
    color: colors.textInverseMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  permissionButton: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: 14,
    marginTop: spacing.lg,
  },
  permissionButtonText: {
    ...typography.button,
    color: colors.textInverse,
    fontSize: 15,
    fontWeight: '600',
  },
  permissionBack: {
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
  },
  permissionBackText: {
    ...typography.body,
    color: colors.textInverseMuted,
    fontSize: 14,
  },
});
