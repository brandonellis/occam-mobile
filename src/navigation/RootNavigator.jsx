import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import useAuth from '../hooks/useAuth';
import { SCREENS } from '../constants/navigation.constants';
import { COACH_ROLES } from '../constants/auth.constants';
import { colors } from '../theme/colors';
import LoginScreen from '../screens/Auth/LoginScreen';
import CoachTabNavigator from './CoachTabNavigator';
import ClientTabNavigator from './ClientTabNavigator';
import LocationSelectionScreen from '../screens/Booking/LocationSelectionScreen';
import ClientSelectionScreen from '../screens/Booking/ClientSelectionScreen';
import ServiceSelectionScreen from '../screens/Booking/ServiceSelectionScreen';
import DurationSelectionScreen from '../screens/Booking/DurationSelectionScreen';
import CoachSelectionScreen from '../screens/Booking/CoachSelectionScreen';
import TimeSlotSelectionScreen from '../screens/Booking/TimeSlotSelectionScreen';
import BookingConfirmationScreen from '../screens/Booking/BookingConfirmationScreen';
import MembershipPlansScreen from '../screens/Membership/MembershipPlansScreen';
import MembershipCheckoutScreen from '../screens/Membership/MembershipCheckoutScreen';
import ClientDetailScreen from '../screens/Coach/ClientDetailScreen';
import CurriculumEditorScreen from '../screens/Coach/CurriculumEditorScreen';
import ProgressReportDetailScreen from '../screens/Coach/ProgressReportDetailScreen';
import VideoRecordingScreen from '../screens/Coach/VideoRecordingScreen';
import VideoReviewScreen from '../screens/Coach/VideoReviewScreen';
import VideoAnnotationScreen from '../screens/Coach/VideoAnnotationScreen';
import ClientBookingsScreen from '../screens/Client/ClientBookingsScreen';
import NotificationsScreen from '../screens/Shared/NotificationsScreen';

const Stack = createNativeStackNavigator();

const RootNavigator = () => {
  const { isLoading, isAuthenticated, activeRole } = useAuth();

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.white,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const isCoachOrAdmin = COACH_ROLES.includes(activeRole);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <Stack.Screen
          name={SCREENS.LOGIN}
          component={LoginScreen}
          options={{ animationTypeForReplace: 'pop' }}
        />
      ) : (
        <>
          {isCoachOrAdmin ? (
            <Stack.Screen
              name={SCREENS.COACH_TABS}
              component={CoachTabNavigator}
            />
          ) : (
            <Stack.Screen
              name={SCREENS.CLIENT_TABS}
              component={ClientTabNavigator}
            />
          )}

          {/* Booking flow — shared by both Coach and Client */}
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

          {/* Membership flow */}
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

          {/* Coach detail screens */}
          <Stack.Screen
            name={SCREENS.CLIENT_DETAIL}
            component={ClientDetailScreen}
            options={{ animation: 'slide_from_right' }}
          />

          {/* Curriculum editor */}
          <Stack.Screen
            name={SCREENS.CURRICULUM_EDITOR}
            component={CurriculumEditorScreen}
            options={{ animation: 'slide_from_right' }}
          />

          {/* Progress report detail */}
          <Stack.Screen
            name={SCREENS.PROGRESS_REPORT_DETAIL}
            component={ProgressReportDetailScreen}
            options={{ animation: 'slide_from_right' }}
          />

          {/* Video recording flow */}
          <Stack.Screen
            name={SCREENS.VIDEO_RECORDING}
            component={VideoRecordingScreen}
            options={{ animation: 'slide_from_bottom', gestureEnabled: false }}
          />
          <Stack.Screen
            name={SCREENS.VIDEO_REVIEW}
            component={VideoReviewScreen}
            options={{ animation: 'slide_from_right', gestureEnabled: false }}
          />

          {/* Video annotation */}
          <Stack.Screen
            name={SCREENS.VIDEO_ANNOTATION}
            component={VideoAnnotationScreen}
            options={{ animation: 'slide_from_right' }}
          />

          {/* Client bookings list */}
          <Stack.Screen
            name={SCREENS.CLIENT_BOOKINGS}
            component={ClientBookingsScreen}
            options={{ animation: 'slide_from_right' }}
          />

          {/* Shared screens */}
          <Stack.Screen
            name={SCREENS.NOTIFICATIONS}
            component={NotificationsScreen}
            options={{ animation: 'slide_from_right' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
};

export default RootNavigator;
