import { StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';

export const fmtStyles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  bold: {
    fontWeight: '700',
  },
  inlineCode: {
    fontFamily: 'monospace',
    fontSize: 13,
    backgroundColor: colors.gray100,
    borderRadius: 3,
    paddingHorizontal: 3,
  },
  h1: {
    ...typography.h3,
    fontWeight: '700',
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  h2: {
    ...typography.label,
    fontSize: 15,
    fontWeight: '700',
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  h3: {
    ...typography.label,
    fontWeight: '600',
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  paragraph: {
    lineHeight: 21,
  },
  listWrap: {
    gap: spacing.xs,
    paddingLeft: spacing.sm,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bullet: {
    width: 16,
    lineHeight: 21,
  },
  numberedBullet: {
    width: 20,
    lineHeight: 21,
    fontWeight: '600',
  },
  listText: {
    flex: 1,
    lineHeight: 21,
  },
});
