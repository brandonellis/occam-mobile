/**
 * Production-safe logger utility.
 *
 * All logging in the app should go through these functions instead of
 * calling console.log / console.warn / console.error directly.
 *
 * In production builds (__DEV__ === false), log and warn are silenced.
 * Errors always log so crash-level issues remain visible in crash reporters.
 */

const noop = () => {};

const logger = {
  log: __DEV__ ? console.log.bind(console) : noop,
  info: __DEV__ ? console.log.bind(console) : noop,
  warn: __DEV__ ? console.warn.bind(console) : noop,
  error: console.error.bind(console),
};

export default logger;
