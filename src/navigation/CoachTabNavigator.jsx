import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { SCREENS } from '../constants/navigation.constants';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
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
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textInverseMuted,
        tabBarLabelStyle: {
          fontFamily: typography.fontFamily,
          fontSize: 10,
          fontWeight: '600',
          lineHeight: 14,
          letterSpacing: 0,
        },
        tabBarAllowFontScaling: false,
        tabBarStyle: {
          backgroundColor: colors.primary,
          borderTopColor: colors.gray800,
          borderTopWidth: 1,
          paddingBottom: 4,
          paddingTop: 4,
          height: 56,
        },
        tabBarIcon: ({ focused, color, size }) => {
          const icons = TAB_ICONS[route.name];
          const iconName = focused ? icons.focused : icons.unfocused;
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name={SCREENS.COACH_DASHBOARD}
        component={CoachDashboardScreen}
        options={{ tabBarLabel: 'Dashboard' }}
      />
      <Tab.Screen
        name="ScheduleTab"
        component={CoachScheduleStack}
        options={{ tabBarLabel: 'Schedule', unmountOnBlur: true }}
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
