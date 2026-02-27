import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SCREENS } from '../constants/navigation.constants';
import { colors } from '../theme/colors';
import CustomTabBar from '../components/CustomTabBar';
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
