import React from 'react';
import { SCREENS } from '../constants/navigation.constants';
import LocationSelectionScreen from '../screens/Booking/LocationSelectionScreen';
import ClientSelectionScreen from '../screens/Booking/ClientSelectionScreen';
import ServiceSelectionScreen from '../screens/Booking/ServiceSelectionScreen';
import DurationSelectionScreen from '../screens/Booking/DurationSelectionScreen';
import CoachSelectionScreen from '../screens/Booking/CoachSelectionScreen';
import TimeSlotSelectionScreen from '../screens/Booking/TimeSlotSelectionScreen';
import BookingConfirmationScreen from '../screens/Booking/BookingConfirmationScreen';

/**
 * Shared booking flow screen registrations.
 * Call as {bookingScreens(Stack)} inside any Stack.Navigator.
 *
 * @param {object} Stack - The Stack navigator from createNativeStackNavigator
 */
export const bookingScreens = (Stack) => (
  <React.Fragment>
    <Stack.Screen
      name={SCREENS.CLIENT_SELECTION}
      component={ClientSelectionScreen}
      options={{ animation: 'slide_from_right' }}
    />
    <Stack.Screen
      name={SCREENS.SERVICE_SELECTION}
      component={ServiceSelectionScreen}
      options={{ animation: 'slide_from_right' }}
    />
    <Stack.Screen
      name={SCREENS.LOCATION_SELECTION}
      component={LocationSelectionScreen}
      options={{ animation: 'slide_from_right' }}
    />
    <Stack.Screen
      name={SCREENS.DURATION_SELECTION}
      component={DurationSelectionScreen}
      options={{ animation: 'slide_from_right' }}
    />
    <Stack.Screen
      name={SCREENS.COACH_SELECTION}
      component={CoachSelectionScreen}
      options={{ animation: 'slide_from_right' }}
    />
    <Stack.Screen
      name={SCREENS.TIME_SLOT_SELECTION}
      component={TimeSlotSelectionScreen}
      options={{ animation: 'slide_from_right' }}
    />
    <Stack.Screen
      name={SCREENS.BOOKING_CONFIRMATION}
      component={BookingConfirmationScreen}
      options={{ animation: 'slide_from_bottom' }}
    />
  </React.Fragment>
);
