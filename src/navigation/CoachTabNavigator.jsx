import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { CommonActions } from '@react-navigation/native';
import { SCREENS } from '../constants/navigation.constants';
import { colors } from '../theme/colors';
import CustomTabBar from '../components/CustomTabBar';
import CoachDashboardScreen from '../screens/Coach/CoachDashboardScreen';
import CoachScheduleStack from './CoachScheduleStack';
import CoachClientsScreen from '../screens/Coach/CoachClientsScreen';
import CoachProfileScreen from '../screens/Coach/CoachProfileScreen';

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  [SCREENS.COACH_DASHBOARD]: { focused: 'grid', unfocused: 'grid-outline' },
  ScheduleTab: { focused: 'calendar', unfocused: 'calendar-outline' },
  [SCREENS.COACH_CLIENTS]: { focused: 'people', unfocused: 'people-outline' },
  [SCREENS.COACH_PROFILE]: { focused: 'person-circle', unfocused: 'person-circle-outline' },
};

const CoachTabNavigator = () => {
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
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            const state = navigation.getState();
            const scheduleTabRoute = state.routes.find((r) => r.name === 'ScheduleTab');
            const isOnScheduleTab = state.index === state.routes.indexOf(scheduleTabRoute);
            const isNested = scheduleTabRoute?.state?.routes?.length > 1;

            if (isOnScheduleTab && isNested) {
              e.preventDefault();
              navigation.navigate('ScheduleTab', {
                screen: SCREENS.COACH_SCHEDULE,
              });
            }
          },
        })}
      />
      <Tab.Screen
        name={SCREENS.COACH_CLIENTS}
        component={CoachClientsScreen}
        options={{ tabBarLabel: 'Clients' }}
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
