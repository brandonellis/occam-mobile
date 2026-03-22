/**
 * Production-safe logger utility.
 *
 * All logging in the app should go through these functions instead of
 * calling console.log / console.warn / console.error directly.
 *
 * In production builds (__DEV__ === false), log and warn are silenced.
 * Errors always log locally AND are reported to the backend (with
 * deduplication) so they appear in OpenSearch alongside backend errors.
 */

import { Platform } from 'react-native';
import { reportFrontendError } from '../services/errorReporting.api';
import deviceMeta from './deviceMeta.helper';
import { buildFingerprint, shouldReport } from './errorThrottle.helper';

const noop = () => {};

/**
 * Extract a structured { message, name, stack } from logger.error() arguments.
 * Handles: logger.error('msg', error), logger.error(error), logger.error('msg')
 */
function extractErrorInfo(args) {
  let message = 'Unknown error';
  let name = 'Error';
  let stack = null;

  for (const arg of args) {
    if (arg instanceof Error) {
      message = arg.message || message;
      name = arg.name || name;
      stack = arg.stack || stack;
      return { message, name, stack };
    }
  }

  // No Error instance found — use the first string argument
  if (typeof args[0] === 'string') {
    message = args[0];
  }

  return { message, name, stack };
}

const logger = {
  log: __DEV__ ? console.log.bind(console) : noop,
  info: __DEV__ ? console.log.bind(console) : noop,
  warn: __DEV__ ? console.warn.bind(console) : noop,
  error: (...args) => {
    console.error(...args);

    // Remote reporting (fire-and-forget)
    try {
      const { message, name, stack } = extractErrorInfo(args);
      const fp = buildFingerprint(name, message, stack);
      if (!shouldReport(fp)) return;

      reportFrontendError({
        message,
        name,
        stack,
        componentStack: null,
        url: null,
        userAgent: `${Platform.OS} ${Platform.Version}`,
        timestamp: new Date().toISOString(),
        environment: __DEV__ ? 'development' : 'production',
        source: 'mobile',
        device: deviceMeta,
        extra: { origin: 'logger.error' },
      }).catch(() => {}); // swallow — never crash from reporting
    } catch {
      // swallow
    }
  },
};

export default logger;
