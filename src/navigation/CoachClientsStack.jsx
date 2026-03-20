import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SCREENS } from '../constants/navigation.constants';
import { colors } from '../theme/colors';
import CoachClientsScreen from '../screens/Coach/CoachClientsScreen';
import ClientDetailScreen from '../screens/Coach/ClientDetailScreen';
import ClientSharedMediaScreen from '../screens/Coach/ClientSharedMediaScreen';
import ClientActivityFeedScreen from '../screens/Coach/ClientActivityFeedScreen';
import CurriculumEditorScreen from '../screens/Coach/CurriculumEditorScreen';
import ProgressReportDetailScreen from '../screens/Coach/ProgressReportDetailScreen';
import VideoRecordingScreen from '../screens/Coach/VideoRecordingScreen';
import VideoReviewScreen from '../screens/Coach/VideoReviewScreen';
import VideoAnnotationScreen from '../screens/Coach/VideoAnnotationScreen';
import VideoPlayerScreen from '../screens/Shared/VideoPlayerScreen';

const Stack = createNativeStackNavigator();

const CoachClientsStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen
        name={SCREENS.COACH_CLIENTS}
        component={CoachClientsScreen}
        options={{ gestureEnabled: false }}
      />
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
      <Stack.Screen
        name={SCREENS.CLIENT_ACTIVITY_FEED}
        component={ClientActivityFeedScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name={SCREENS.CURRICULUM_EDITOR}
        component={CurriculumEditorScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name={SCREENS.PROGRESS_REPORT_DETAIL}
        component={ProgressReportDetailScreen}
        options={{ animation: 'slide_from_right' }}
      />
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
      <Stack.Screen
        name={SCREENS.VIDEO_ANNOTATION}
        component={VideoAnnotationScreen}
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

export default CoachClientsStack;
