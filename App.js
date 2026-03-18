import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import AuthProvider from './src/providers/AuthProvider';
import StripeConnectProvider from './src/providers/StripeConnectProvider';
import NotificationBadgeProvider from './src/providers/NotificationBadgeProvider';
import RootNavigator from './src/navigation/RootNavigator';
import { navigationRef } from './src/helpers/navigation.helper';
import linking from './src/navigation/linking';
import ErrorBoundary from './src/components/ErrorBoundary';
import { initGlobalErrorHandler } from './src/services/errorReporting.service';
import { paperTheme } from './src/theme';
import { colors } from './src/theme/colors';

initGlobalErrorHandler();

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
  },
};

const LinkingFallback = () => (
  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
    <ActivityIndicator size="large" color={colors.primary} />
  </View>
);

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={paperTheme}>
        <ErrorBoundary>
          <AuthProvider>
            <StripeConnectProvider>
              <NavigationContainer ref={navigationRef} theme={navigationTheme} linking={linking} fallback={<LinkingFallback />}>
                <NotificationBadgeProvider>
                  <StatusBar style="dark" />
                  <RootNavigator />
                </NotificationBadgeProvider>
              </NavigationContainer>
            </StripeConnectProvider>
          </AuthProvider>
        </ErrorBoundary>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
