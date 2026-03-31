import React, { useEffect } from 'react';
import { ActivityIndicator } from 'react-native-paper';
import { View, BackHandler, Platform } from 'react-native';
import OfflineBanner from '../components/OfflineBanner';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import useAuth from '../hooks/useAuth';
import usePushNotifications from '../hooks/usePushNotifications';
import { navigationRef } from '../helpers/navigation.helper';
import { SCREENS } from '../constants/navigation.constants';
import { colors } from '../theme/colors';
import { styles } from '../styles/rootNavigator.styles';
import LoginScreen from '../screens/Auth/LoginScreen';
import AdminTabNavigator from './AdminTabNavigator';
import CoachTabNavigator from './CoachTabNavigator';
import ClientTabNavigator from './ClientTabNavigator';
import VideoRecordingScreen from '../screens/Coach/VideoRecordingScreen';
import VideoReviewScreen from '../screens/Coach/VideoReviewScreen';
import NotificationsScreen from '../screens/Shared/NotificationsScreen';
import NotificationPreferencesScreen from '../screens/Shared/NotificationPreferencesScreen';
import PaymentLinkScreen from '../screens/Shared/PaymentLinkScreen';
import BookingDetailScreen from '../screens/Client/BookingDetailScreen';
import CalendarSyncScreen from '../screens/Client/CalendarSyncScreen';
import LessonFeedbackScreen from '../screens/Coach/LessonFeedbackScreen';
import { bookingScreens } from './BookingScreens';

const Stack = createNativeStackNavigator();

const RootNavigator = () => {
  const { isLoading, isAuthenticated, activeRole, previousRole, switchRole } = useAuth();
  const { registerToken } = usePushNotifications();

  useEffect(() => {
    if (isAuthenticated) {
      registerToken();
    }
  }, [isAuthenticated, registerToken]);

  // Android: switch back to previous role when pressing hardware back at the root
  useEffect(() => {
    if (Platform.OS !== 'android' || !isAuthenticated || !previousRole) return;

    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      const canGoBack = navigationRef.current?.canGoBack();
      if (!canGoBack && previousRole) {
        switchRole(previousRole);
        return true;
      }
      return false;
    });

    return () => handler.remove();
  }, [isAuthenticated, previousRole, switchRole]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const isAdmin = activeRole === 'admin';
  const isCoach = activeRole === 'coach';
  const navigatorKey = isAuthenticated ? `app-${activeRole}` : 'auth';

  return (
    <View style={styles.container}>
      <OfflineBanner />
    <Stack.Navigator key={navigatorKey} screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      {!isAuthenticated ? (
        <Stack.Screen
          name={SCREENS.LOGIN}
          component={LoginScreen}
          options={{ animationTypeForReplace: 'pop' }}
        />
      ) : (
        <>
          {isAdmin ? (
            <Stack.Screen
              name={SCREENS.ADMIN_TABS}
              component={AdminTabNavigator}
              options={{ gestureEnabled: false }}
            />
          ) : isCoach ? (
            <Stack.Screen
              name={SCREENS.COACH_TABS}
              component={CoachTabNavigator}
              options={{ gestureEnabled: false }}
            />
          ) : (
            <Stack.Screen
              name={SCREENS.CLIENT_TABS}
              component={ClientTabNavigator}
              options={{ gestureEnabled: false }}
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

          {/* Payment link — deep link from payment request email */}
          <Stack.Screen
            name={SCREENS.PAYMENT_LINK}
            component={PaymentLinkScreen}
            options={{ animation: 'slide_from_bottom' }}
          />

          {/* Booking detail — accessed from direct tab screens (Dashboard, Bookings) */}
          <Stack.Screen
            name={SCREENS.BOOKING_DETAIL}
            component={BookingDetailScreen}
            options={{ animation: 'slide_from_right' }}
          />

          {/* Lesson feedback — accessed from BookingDetail */}
          <Stack.Screen
            name={SCREENS.LESSON_FEEDBACK}
            component={LessonFeedbackScreen}
            options={{ animation: 'slide_from_right' }}
          />

          {/* Booking flow — accessed from Dashboard quick actions */}
          {bookingScreens(Stack)}

          {/* Notifications — accessed from direct tab screens (Dashboard) */}
          <Stack.Screen
            name={SCREENS.NOTIFICATIONS}
            component={NotificationsScreen}
            options={{ animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name={SCREENS.NOTIFICATION_PREFERENCES}
            component={NotificationPreferencesScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name={SCREENS.CALENDAR_SYNC}
            component={CalendarSyncScreen}
            options={{ animation: 'slide_from_right' }}
          />
        </>
      )}
    </Stack.Navigator>
    </View>
  );
};

export default RootNavigator;
