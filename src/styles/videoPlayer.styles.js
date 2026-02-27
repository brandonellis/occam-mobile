import { StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';

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
});
