import { Alert } from 'react-native';

/**
 * Shows a confirmation dialog and navigates back to the tab root,
 * discarding the entire booking flow.
 *
 * @param {object} navigation - React Navigation object
 */
export const confirmCancelBooking = (navigation) => {
  Alert.alert(
    'Discard Booking?',
    'Your booking selections will be lost.',
    [
      { text: 'Keep Editing', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: () => {
          navigation.popToTop();
        },
      },
    ]
  );
};
