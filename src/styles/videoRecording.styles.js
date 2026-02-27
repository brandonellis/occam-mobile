import { StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

export const videoRecordingStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
