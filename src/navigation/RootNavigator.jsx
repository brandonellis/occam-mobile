import React, { useEffect } from 'react';
import { ActivityIndicator } from 'react-native-paper';
import { View } from 'react-native';
import OfflineBanner from '../components/OfflineBanner';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import useAuth from '../hooks/useAuth';
import usePushNotifications from '../hooks/usePushNotifications';
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
import BookingDetailScreen from '../screens/Client/BookingDetailScreen';
import BookingScreens from './BookingScreens';

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
            />
          ) : isCoach ? (
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

          {/* Booking flow — accessed from Dashboard quick actions */}
          <BookingScreens Stack={Stack} />

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
        </>
      )}
    </Stack.Navigator>
    </View>
  );
};

export default RootNavigator;
