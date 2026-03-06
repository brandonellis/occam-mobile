import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import useAuth from '../hooks/useAuth';
import usePushNotifications from '../hooks/usePushNotifications';
import { SCREENS } from '../constants/navigation.constants';
import { COACH_ROLES } from '../constants/auth.constants';
import { colors } from '../theme/colors';
import LoginScreen from '../screens/Auth/LoginScreen';
import CoachTabNavigator from './CoachTabNavigator';
import ClientTabNavigator from './ClientTabNavigator';
import VideoRecordingScreen from '../screens/Coach/VideoRecordingScreen';
import VideoReviewScreen from '../screens/Coach/VideoReviewScreen';
import NotificationsScreen from '../screens/Shared/NotificationsScreen';
import BookingDetailScreen from '../screens/Client/BookingDetailScreen';

const Stack = createNativeStackNavigator();

const RootNavigator = () => {
  const { isLoading, isAuthenticated, activeRole } = useAuth();
  const { registerToken } = usePushNotifications();

  useEffect(() => {
    if (isAuthenticated) {
      registerToken();
    }
  }, [isAuthenticated, registerToken]);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const isCoachOrAdmin = COACH_ROLES.includes(activeRole);
  const navigatorKey = isAuthenticated ? `app-${activeRole}` : 'auth';

  return (
    <Stack.Navigator key={navigatorKey} screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
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

          {/* Video recording flow — accessed from Dashboard quick actions */}
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

          {/* Booking detail — accessed from direct tab screens (Dashboard, Bookings) */}
          <Stack.Screen
            name={SCREENS.BOOKING_DETAIL}
            component={BookingDetailScreen}
            options={{ animation: 'slide_from_right' }}
          />

          {/* Notifications — accessed from direct tab screens (Dashboard) */}
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
