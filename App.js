import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import { StripeProvider } from '@stripe/stripe-react-native';
import AuthProvider from './src/providers/AuthProvider';
import RootNavigator from './src/navigation/RootNavigator';
import ErrorBoundary from './src/components/ErrorBoundary';
import { initGlobalErrorHandler } from './src/services/errorReporting.service';
import { paperTheme } from './src/theme';
import config from './src/config';

initGlobalErrorHandler();

export default function App() {
  return (
    <SafeAreaProvider>
      <StripeProvider publishableKey={config.stripePublishableKey}>
        <PaperProvider theme={paperTheme}>
          <ErrorBoundary>
            <AuthProvider>
              <NavigationContainer>
                <StatusBar style="dark" />
                <RootNavigator />
              </NavigationContainer>
            </AuthProvider>
          </ErrorBoundary>
        </PaperProvider>
      </StripeProvider>
    </SafeAreaProvider>
  );
}
