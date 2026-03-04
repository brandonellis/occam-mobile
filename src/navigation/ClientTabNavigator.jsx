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
import { setLastSeenTimestamp } from '../helpers/activity.helper';

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  HomeTab: { focused: 'home', unfocused: 'home-outline' },
  [SCREENS.CLIENT_BOOKINGS]: { focused: 'calendar', unfocused: 'calendar-outline' },
  [SCREENS.CLIENT_ACTIVITY]: { focused: 'pulse', unfocused: 'pulse-outline' },
  ProgressTab: { focused: 'trending-up', unfocused: 'trending-up-outline' },
  [SCREENS.CLIENT_PROFILE]: { focused: 'person-circle', unfocused: 'person-circle-outline' },
};

const ClientTabNavigator = () => {
  const { unreadCount, refreshBadge } = useActivityBadge();

  const badges = useMemo(() => ({
    [SCREENS.CLIENT_ACTIVITY]: unreadCount,
  }), [unreadCount]);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        freezeOnBlur: true,
        sceneStyle: { backgroundColor: colors.background },
        animation: 'shift',
      }}
      lazy={false}
      detachInactiveScreens={false}
      tabBar={(props) => <CustomTabBar {...props} tabIcons={TAB_ICONS} badges={badges} />}
    >
      <Tab.Screen
        name="HomeTab"
        component={ClientHomeStack}
        options={{ tabBarLabel: 'Home' }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            const state = navigation.getState();
            const homeTabRoute = state.routes.find((r) => r.name === 'HomeTab');
            const isOnHomeTab = state.index === state.routes.indexOf(homeTabRoute);
            const isNested = homeTabRoute?.state?.routes?.length > 1;

            if (isOnHomeTab && isNested) {
              e.preventDefault();
              navigation.navigate('HomeTab', {
                screen: SCREENS.CLIENT_HOME,
              });
            }
          },
        })}
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
            setLastSeenTimestamp().then(refreshBadge);
          },
        }}
      />
      <Tab.Screen
        name="ProgressTab"
        component={ClientProgressStack}
        options={{ tabBarLabel: 'Progress' }}
      />
      <Tab.Screen
        name={SCREENS.CLIENT_PROFILE}
        component={ClientProfileScreen}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

export default ClientTabNavigator;
