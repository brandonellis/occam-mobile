import React from 'react';
import { View, Platform } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { reportFrontendError } from '../services/errorReporting.api';
import { colors } from '../theme';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error);

    reportFrontendError({
      message: error?.message || error?.toString() || 'Unknown error',
      name: error?.name || 'Error',
      stack: error?.stack || null,
      componentStack: errorInfo?.componentStack || null,
      url: null,
      userAgent: `${Platform.OS} ${Platform.Version}`,
      timestamp: new Date().toISOString(),
      environment: __DEV__ ? 'development' : 'production',
      extra: { source: 'ErrorBoundary', platform: Platform.OS },
    });
  }

  handleRestart = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 32,
          backgroundColor: colors.background,
        }}>
          <Text
            variant="headlineMedium"
            style={{ color: colors.textPrimary, marginBottom: 12, textAlign: 'center' }}
          >
            Something went wrong
          </Text>
          <Text
            variant="bodyMedium"
            style={{ color: colors.textSecondary, marginBottom: 24, textAlign: 'center' }}
          >
            An unexpected error occurred. The error has been reported to our team.
          </Text>
          {__DEV__ && this.state.error && (
            <Text
              variant="bodySmall"
              style={{ color: colors.error, marginBottom: 24, textAlign: 'center' }}
            >
              {this.state.error.toString()}
            </Text>
          )}
          <Button mode="contained" onPress={this.handleRestart}>
            Try Again
          </Button>
        </View>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
