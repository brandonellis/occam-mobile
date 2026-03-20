import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SCREENS } from '../constants/navigation.constants';
import { colors } from '../theme/colors';
import CoachScheduleScreen from '../screens/Coach/CoachScheduleScreen';
import { bookingScreens } from './BookingScreens';

const Stack = createNativeStackNavigator();

const CoachScheduleStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen
        name={SCREENS.COACH_SCHEDULE}
        component={CoachScheduleScreen}
        options={{ gestureEnabled: false }}
      />
      {bookingScreens(Stack)}
    </Stack.Navigator>
  );
};

export default CoachScheduleStack;
