import React, { useMemo } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SCREENS } from '../constants/navigation.constants';
import { colors } from '../theme/colors';
import CustomTabBar from '../components/CustomTabBar';
import ClientHomeStack from './ClientHomeStack';
import ClientBookingsScreen from '../screens/Client/ClientBookingsScreen';
import ClientActivityFeedScreen from '../screens/Client/ClientActivityFeedScreen';
import ClientProgressStack from './ClientProgressStack';
import ClientProfileScreen from '../screens/Client/ClientProfileScreen';
import useActivityBadge from '../hooks/useActivityBadge';
import { createTabResetListener } from '../helpers/navigation.helper';
import { BadgeProvider } from '../context/BadgeContext';

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  HomeTab: { focused: 'home', unfocused: 'home-outline' },
  [SCREENS.CLIENT_BOOKINGS]: { focused: 'calendar', unfocused: 'calendar-outline' },
  [SCREENS.CLIENT_ACTIVITY]: { focused: 'pulse', unfocused: 'pulse' },
  ProgressTab: { focused: 'trending-up', unfocused: 'trending-up' },
  [SCREENS.CLIENT_PROFILE]: { focused: 'account-circle', unfocused: 'account-circle-outline' },
};

const ClientTabNavigator = () => {
  const { unreadCount, clearBadge } = useActivityBadge();

  const badgeValue = useMemo(() => ({ [SCREENS.CLIENT_ACTIVITY]: unreadCount }), [unreadCount]);

  return (
    <BadgeProvider value={badgeValue}>
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        freezeOnBlur: true,
        sceneStyle: { backgroundColor: colors.background },
        tabBarStyle: { position: 'absolute', backgroundColor: 'transparent', borderTopWidth: 0, elevation: 0, shadowOpacity: 0 },
        animation: 'shift',
      }}
      lazy={false}
      detachInactiveScreens={false}
      tabBar={(props) => <CustomTabBar {...props} tabIcons={TAB_ICONS} />}
    >
      <Tab.Screen
        name="HomeTab"
        component={ClientHomeStack}
        options={{ tabBarLabel: 'Home' }}
        listeners={createTabResetListener('HomeTab', SCREENS.CLIENT_HOME)}
      />
      <Tab.Screen
        name={SCREENS.CLIENT_BOOKINGS}
        component={ClientBookingsScreen}
        options={{ tabBarLabel: 'Bookings' }}
      />
      <Tab.Screen
        name={SCREENS.CLIENT_ACTIVITY}
        component={ClientActivityFeedScreen}
        options={{ tabBarLabel: 'Activity' }}
        listeners={{
          tabPress: () => {
            clearBadge();
          },
        }}
      />
      <Tab.Screen
        name="ProgressTab"
        component={ClientProgressStack}
        options={{ tabBarLabel: 'Progress' }}
        listeners={createTabResetListener('ProgressTab', SCREENS.CLIENT_PROGRESS)}
      />
      <Tab.Screen
        name={SCREENS.CLIENT_PROFILE}
        component={ClientProfileScreen}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
    </BadgeProvider>
  );
};

export default ClientTabNavigator;
