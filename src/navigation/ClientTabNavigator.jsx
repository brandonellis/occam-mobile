import React, { useMemo } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SCREENS } from '../constants/navigation.constants';
import { colors } from '../theme/colors';
import CustomTabBar from '../components/CustomTabBar';
import ClientHomeStack from './ClientHomeStack';
import ClientBookingsScreen from '../screens/Client/ClientBookingsScreen';
import ClientProgressStack from './ClientProgressStack';
import ClientProfileScreen from '../screens/Client/ClientProfileScreen';
import CaddieScreen from '../screens/Caddie/CaddieScreen';
import useActivityBadge from '../hooks/useActivityBadge';
import { createTabResetListener } from '../helpers/navigation.helper';
import { BadgeProvider } from '../context/BadgeContext';

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  HomeTab: { focused: 'home', unfocused: 'home-outline' },
  [SCREENS.CLIENT_BOOKINGS]: { focused: 'calendar', unfocused: 'calendar-outline' },
  ActivityTab: { focused: 'pulse', unfocused: 'pulse' },
  [SCREENS.CADDIE]: { focused: 'robot', unfocused: 'robot-outline' },
  [SCREENS.CLIENT_PROFILE]: { focused: 'account-circle', unfocused: 'account-circle-outline' },
};

const ClientTabNavigator = () => {
  const { unreadCount, clearBadge } = useActivityBadge();

  const badgeValue = useMemo(() => ({ ActivityTab: unreadCount }), [unreadCount]);

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
        name="ActivityTab"
        component={ClientProgressStack}
        options={{ tabBarLabel: 'Activity' }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            clearBadge();
            // Reset to root screen if nested (same logic as createTabResetListener)
            const state = navigation.getState();
            const tabRoute = state.routes.find((r) => r.name === 'ActivityTab');
            const isNested = tabRoute?.state?.routes?.length > 1;
            if (isNested) {
              e.preventDefault();
              navigation.navigate('ActivityTab', { screen: SCREENS.CLIENT_PROGRESS });
            }
          },
        })}
      />
      <Tab.Screen
        name={SCREENS.CADDIE}
        component={CaddieScreen}
        options={{ tabBarLabel: 'Caddie' }}
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
