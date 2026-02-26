import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { SCREENS } from '../constants/navigation.constants';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import ClientHomeScreen from '../screens/Client/ClientHomeScreen';
import ClientProgressScreen from '../screens/Client/ClientProgressScreen';
import ClientProfileScreen from '../screens/Client/ClientProfileScreen';

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  [SCREENS.CLIENT_HOME]: { focused: 'home', unfocused: 'home-outline' },
  [SCREENS.CLIENT_PROGRESS]: { focused: 'trending-up', unfocused: 'trending-up-outline' },
  [SCREENS.CLIENT_PROFILE]: { focused: 'person-circle', unfocused: 'person-circle-outline' },
};

const ClientTabNavigator = () => {
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
        name={SCREENS.CLIENT_HOME}
        component={ClientHomeScreen}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name={SCREENS.CLIENT_PROGRESS}
        component={ClientProgressScreen}
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
