import React from 'react';
import { View } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import AuthProvider from './src/providers/AuthProvider';
import QueryClientProvider from './src/providers/QueryClientProvider';
import MarshalIntentProvider from './src/providers/MarshalIntentProvider';
import StripeConnectProvider from './src/providers/StripeConnectProvider';
import NotificationBadgeProvider from './src/providers/NotificationBadgeProvider';
import RootNavigator from './src/navigation/RootNavigator';
import { navigationRef } from './src/helpers/navigation.helper';
import linking from './src/navigation/linking';
import ErrorBoundary from './src/components/ErrorBoundary';
import { initGlobalErrorHandler } from './src/services/errorReporting.service';
import { paperTheme } from './src/theme';
import { colors } from './src/theme/colors';
import { styles } from './src/styles/app.styles';

initGlobalErrorHandler();

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
  },
};

const LinkingFallback = () => (
  <View style={styles.linkingFallbackContainer}>
    <ActivityIndicator size="large" color={colors.primary} />
  </View>
);

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={paperTheme}>
        <ErrorBoundary>
          <AuthProvider>
            <QueryClientProvider>
            <MarshalIntentProvider>
              <StripeConnectProvider>
                <NavigationContainer ref={navigationRef} theme={navigationTheme} linking={linking} fallback={<LinkingFallback />}>
                  <NotificationBadgeProvider>
                    <StatusBar style="dark" />
                    <RootNavigator />
                  </NotificationBadgeProvider>
                </NavigationContainer>
              </StripeConnectProvider>
            </MarshalIntentProvider>
            </QueryClientProvider>
          </AuthProvider>
        </ErrorBoundary>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
