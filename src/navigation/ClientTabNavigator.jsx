import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { CommonActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SCREENS } from '../constants/navigation.constants';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import ClientHomeStack from './ClientHomeStack';
import ClientBookingsScreen from '../screens/Client/ClientBookingsScreen';
import ClientProgressStack from './ClientProgressStack';
import ClientProfileScreen from '../screens/Client/ClientProfileScreen';

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  HomeTab: { focused: 'home', unfocused: 'home-outline' },
  [SCREENS.CLIENT_BOOKINGS]: { focused: 'calendar', unfocused: 'calendar-outline' },
  ProgressTab: { focused: 'trending-up', unfocused: 'trending-up-outline' },
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
        name="HomeTab"
        component={ClientHomeStack}
        options={{ tabBarLabel: 'Home' }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [
                  {
                    name: 'HomeTab',
                    state: {
                      routes: [{ name: SCREENS.CLIENT_HOME }],
                    },
                  },
                ],
              })
            );
          },
        })}
      />
      <Tab.Screen
        name={SCREENS.CLIENT_BOOKINGS}
        component={ClientBookingsScreen}
        options={{ tabBarLabel: 'Bookings' }}
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
