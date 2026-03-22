import React from 'react';
import { View, Platform } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { reportFrontendError } from '../services/errorReporting.api';
import { buildFingerprint, shouldReport } from '../helpers/errorThrottle.helper';
import { colors, spacing } from '../theme';
import deviceMeta from '../helpers/deviceMeta.helper';

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

    const fingerprint = buildFingerprint(error?.name, error?.message, error?.stack);
    if (shouldReport(fingerprint)) {
      reportFrontendError({
        message: error?.message || error?.toString() || 'Unknown error',
        name: error?.name || 'Error',
        stack: error?.stack || null,
        componentStack: errorInfo?.componentStack || null,
        url: null,
        userAgent: `${Platform.OS} ${Platform.Version}`,
        timestamp: new Date().toISOString(),
        environment: __DEV__ ? 'development' : 'production',
        source: 'mobile',
        device: deviceMeta,
        extra: { origin: 'ErrorBoundary', platform: Platform.OS },
      });
    }
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
          padding: spacing.xxl,
          backgroundColor: colors.background,
        }}>
          <Text
            variant="headlineMedium"
            style={{ color: colors.textPrimary, marginBottom: spacing.md, textAlign: 'center' }}
          >
            Something went wrong
          </Text>
          <Text
            variant="bodyMedium"
            style={{ color: colors.textSecondary, marginBottom: spacing.xl, textAlign: 'center' }}
          >
            An unexpected error occurred. The error has been reported to our team.
          </Text>
          {__DEV__ && this.state.error && (
            <Text
              variant="bodySmall"
              style={{ color: colors.error, marginBottom: spacing.xl, textAlign: 'center' }}
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
