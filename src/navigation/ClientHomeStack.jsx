import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SCREENS } from '../constants/navigation.constants';
import ClientHomeScreen from '../screens/Client/ClientHomeScreen';
import LocationSelectionScreen from '../screens/Booking/LocationSelectionScreen';
import ClientSelectionScreen from '../screens/Booking/ClientSelectionScreen';
import ServiceSelectionScreen from '../screens/Booking/ServiceSelectionScreen';
import DurationSelectionScreen from '../screens/Booking/DurationSelectionScreen';
import CoachSelectionScreen from '../screens/Booking/CoachSelectionScreen';
import TimeSlotSelectionScreen from '../screens/Booking/TimeSlotSelectionScreen';
import BookingConfirmationScreen from '../screens/Booking/BookingConfirmationScreen';
import MembershipPlansScreen from '../screens/Membership/MembershipPlansScreen';
import MembershipCheckoutScreen from '../screens/Membership/MembershipCheckoutScreen';
import ProgressReportDetailScreen from '../screens/Coach/ProgressReportDetailScreen';
import NotificationsScreen from '../screens/Shared/NotificationsScreen';
import VideoPlayerScreen from '../screens/Shared/VideoPlayerScreen';

const Stack = createNativeStackNavigator();

const ClientHomeStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name={SCREENS.CLIENT_HOME}
        component={ClientHomeScreen}
      />
      <Stack.Screen
        name={SCREENS.LOCATION_SELECTION}
        component={LocationSelectionScreen}
        options={{ animation: 'slide_from_right' }}
      />
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
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name={SCREENS.MEMBERSHIP_PLANS}
        component={MembershipPlansScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name={SCREENS.MEMBERSHIP_CHECKOUT}
        component={MembershipCheckoutScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name={SCREENS.PROGRESS_REPORT_DETAIL}
        component={ProgressReportDetailScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name={SCREENS.NOTIFICATIONS}
        component={NotificationsScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name={SCREENS.VIDEO_PLAYER}
        component={VideoPlayerScreen}
        options={{ animation: 'slide_from_right' }}
      />
    </Stack.Navigator>
  );
};

export default ClientHomeStack;
