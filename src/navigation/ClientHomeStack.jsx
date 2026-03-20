import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SCREENS } from '../constants/navigation.constants';
import { colors } from '../theme/colors';
import ClientHomeScreen from '../screens/Client/ClientHomeScreen';
import { bookingScreens } from './BookingScreens';
import MembershipPlansScreen from '../screens/Membership/MembershipPlansScreen';
import MembershipCheckoutScreen from '../screens/Membership/MembershipCheckoutScreen';
import PackageListScreen from '../screens/Package/PackageListScreen';
import PackageCheckoutScreen from '../screens/Package/PackageCheckoutScreen';
import ProgressReportDetailScreen from '../screens/Coach/ProgressReportDetailScreen';
import NotificationsScreen from '../screens/Shared/NotificationsScreen';
import VideoPlayerScreen from '../screens/Shared/VideoPlayerScreen';

const Stack = createNativeStackNavigator();

const ClientHomeStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen
        name={SCREENS.CLIENT_HOME}
        component={ClientHomeScreen}
        options={{ gestureEnabled: false }}
      />
      {bookingScreens(Stack)}
      <Stack.Screen
        name={SCREENS.MEMBERSHIP_PLANS}
        component={MembershipPlansScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name={SCREENS.MEMBERSHIP_CHECKOUT}
        component={MembershipCheckoutScreen}
        options={{ animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name={SCREENS.PACKAGE_LIST}
        component={PackageListScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name={SCREENS.PACKAGE_CHECKOUT}
        component={PackageCheckoutScreen}
        options={{ animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name={SCREENS.PROGRESS_REPORT_DETAIL}
        component={ProgressReportDetailScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name={SCREENS.NOTIFICATIONS}
        component={NotificationsScreen}
        options={{ animation: 'slide_from_bottom' }}
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
