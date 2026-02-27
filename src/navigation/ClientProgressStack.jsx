import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SCREENS } from '../constants/navigation.constants';
import { colors } from '../theme/colors';
import ClientProgressScreen from '../screens/Client/ClientProgressScreen';
import ProgressReportDetailScreen from '../screens/Coach/ProgressReportDetailScreen';
import VideoPlayerScreen from '../screens/Shared/VideoPlayerScreen';

const Stack = createNativeStackNavigator();

const ClientProgressStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen
        name={SCREENS.CLIENT_PROGRESS}
        component={ClientProgressScreen}
      />
      <Stack.Screen
        name={SCREENS.PROGRESS_REPORT_DETAIL}
        component={ProgressReportDetailScreen}
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

export default ClientProgressStack;
