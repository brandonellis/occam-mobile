import { StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

export const agentFeedbackStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    paddingHorizontal: 2,
  },
  button: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonActive: {
    backgroundColor: colors.gray100,
  },
  thanks: {
    fontSize: 11,
    color: colors.textTertiary,
    marginLeft: 4,
  },
  reasons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
    paddingHorizontal: 2,
  },
  reasonChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray200,
    backgroundColor: colors.white,
  },
  reasonText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
