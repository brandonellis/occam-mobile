import { Alert } from 'react-native';
import { CommonActions } from '@react-navigation/native';

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
          // Pop to the root of the current stack navigator
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: navigation.getState().routes[0].name }],
            })
          );
        },
      },
    ]
  );
};
