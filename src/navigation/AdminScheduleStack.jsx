import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SCREENS } from '../constants/navigation.constants';
import { colors } from '../theme/colors';
import AdminScheduleScreen from '../screens/Admin/AdminScheduleScreen';
import { bookingScreens } from './BookingScreens';

const Stack = createNativeStackNavigator();

const AdminScheduleStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen
        name={SCREENS.ADMIN_SCHEDULE}
        component={AdminScheduleScreen}
        options={{ gestureEnabled: false }}
      />
      {bookingScreens(Stack)}
    </Stack.Navigator>
  );
};

export default AdminScheduleStack;
