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
import ClientDetailScreen from '../screens/Coach/ClientDetailScreen';
import ClientSharedMediaScreen from '../screens/Coach/ClientSharedMediaScreen';
import CurriculumEditorScreen from '../screens/Coach/CurriculumEditorScreen';
import ProgressReportDetailScreen from '../screens/Coach/ProgressReportDetailScreen';
import VideoRecordingScreen from '../screens/Coach/VideoRecordingScreen';
import VideoReviewScreen from '../screens/Coach/VideoReviewScreen';
import VideoAnnotationScreen from '../screens/Coach/VideoAnnotationScreen';
import NotificationsScreen from '../screens/Shared/NotificationsScreen';
import VideoPlayerScreen from '../screens/Shared/VideoPlayerScreen';
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

          {/* Coach detail screens */}
          <Stack.Screen
            name={SCREENS.CLIENT_DETAIL}
            component={ClientDetailScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name={SCREENS.CLIENT_SHARED_MEDIA}
            component={ClientSharedMediaScreen}
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

          {/* Booking detail */}
          <Stack.Screen
            name={SCREENS.BOOKING_DETAIL}
            component={BookingDetailScreen}
            options={{ animation: 'slide_from_right' }}
          />

          {/* Shared screens */}
          <Stack.Screen
            name={SCREENS.VIDEO_PLAYER}
            component={VideoPlayerScreen}
            options={{ animation: 'slide_from_right' }}
          />
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
