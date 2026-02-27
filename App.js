import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import AuthProvider from './src/providers/AuthProvider';
import StripeConnectProvider from './src/providers/StripeConnectProvider';
import RootNavigator from './src/navigation/RootNavigator';
import { navigationRef } from './src/helpers/navigation.helper';
import ErrorBoundary from './src/components/ErrorBoundary';
import { initGlobalErrorHandler } from './src/services/errorReporting.service';
import { paperTheme } from './src/theme';

initGlobalErrorHandler();

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={paperTheme}>
        <ErrorBoundary>
          <AuthProvider>
            <StripeConnectProvider>
              <NavigationContainer ref={navigationRef}>
                <StatusBar style="dark" />
                <RootNavigator />
              </NavigationContainer>
            </StripeConnectProvider>
          </AuthProvider>
        </ErrorBoundary>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
