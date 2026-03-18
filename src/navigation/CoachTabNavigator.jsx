import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SCREENS } from '../constants/navigation.constants';
import { colors } from '../theme/colors';
import CustomTabBar from '../components/CustomTabBar';
import CoachDashboardScreen from '../screens/Coach/CoachDashboardScreen';
import CoachScheduleStack from './CoachScheduleStack';
import CoachClientsStack from './CoachClientsStack';
import CoachProfileScreen from '../screens/Coach/CoachProfileScreen';
import MarshalScreen from '../screens/Marshal/MarshalScreen';
import { createTabResetListener } from '../helpers/navigation.helper';

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  [SCREENS.COACH_DASHBOARD]: { focused: 'view-dashboard', unfocused: 'view-dashboard-outline' },
  ScheduleTab: { focused: 'calendar', unfocused: 'calendar-outline' },
  ClientsTab: { focused: 'account-group', unfocused: 'account-group-outline' },
  [SCREENS.MARSHAL]: { focused: 'robot', unfocused: 'robot-outline' },
  [SCREENS.COACH_PROFILE]: { focused: 'account-circle', unfocused: 'account-circle-outline' },
};

const CoachTabNavigator = () => {
  return (
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
        name={SCREENS.COACH_DASHBOARD}
        component={CoachDashboardScreen}
        options={{ tabBarLabel: 'Dashboard' }}
      />
      <Tab.Screen
        name="ScheduleTab"
        component={CoachScheduleStack}
        options={{ tabBarLabel: 'Schedule' }}
        listeners={createTabResetListener('ScheduleTab', SCREENS.COACH_SCHEDULE)}
      />
      <Tab.Screen
        name="ClientsTab"
        component={CoachClientsStack}
        options={{ tabBarLabel: 'Clients' }}
        listeners={createTabResetListener('ClientsTab', SCREENS.COACH_CLIENTS)}
      />
      <Tab.Screen
        name={SCREENS.MARSHAL}
        component={MarshalScreen}
        options={{ tabBarLabel: 'Marshal' }}
      />
      <Tab.Screen
        name={SCREENS.COACH_PROFILE}
        component={CoachProfileScreen}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

export default CoachTabNavigator;
