import { Platform } from 'react-native';
import { reportFrontendError } from './errorReporting.api';

/**
 * Initialize global JS error handlers for unhandled errors and
 * unhandled promise rejections. Reports them to the backend
 * (which relays to Slack), matching the web client's pattern.
 *
 * Call once at app startup (before React renders).
 */
export const initGlobalErrorHandler = () => {
  const defaultHandler = ErrorUtils.getGlobalHandler();

  ErrorUtils.setGlobalHandler((error, isFatal) => {
    reportFrontendError({
      message: error?.message || error?.toString() || 'Unknown error',
      name: error?.name || 'Error',
      stack: error?.stack || null,
      componentStack: null,
      url: null,
      userAgent: `${Platform.OS} ${Platform.Version}`,
      timestamp: new Date().toISOString(),
      environment: __DEV__ ? 'development' : 'production',
      extra: {
        source: 'GlobalHandler',
        platform: Platform.OS,
        isFatal: !!isFatal,
      },
    });

    // Call the default handler so the red screen still shows in dev
    if (defaultHandler) {
      defaultHandler(error, isFatal);
    }
  });
};
