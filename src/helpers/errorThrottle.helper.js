/**
 * Deduplication / rate-limiting gate for remote error reporting.
 *
 * Two layers:
 *   1. Per-fingerprint cooldown — the same error won't be reported twice within COOLDOWN_MS.
 *   2. Global rate cap — at most GLOBAL_MAX reports within any GLOBAL_WINDOW_MS window.
 *
 * All state is in-memory and resets on app restart, which is acceptable.
 */

const COOLDOWN_MS = 60_000;       // 60s per unique error
const GLOBAL_MAX = 10;            // max 10 reports per window
const GLOBAL_WINDOW_MS = 300_000; // 5 minute window

const reported = new Map();       // fingerprint -> timestamp
const globalTimestamps = [];      // array of report timestamps

/**
 * Build a short fingerprint from an error's name, message, and first stack frame.
 * @param {string} name
 * @param {string} message
 * @param {string|null} stack
 * @returns {string}
 */
export function buildFingerprint(name, message, stack) {
  const firstFrame = stack ? stack.split('\n').find((line) => line.trim().startsWith('at ')) || '' : '';
  return `${name || ''}:${message || ''}:${firstFrame}`.slice(0, 100);
}

/**
 * Returns true if this fingerprint should be reported to the backend.
 * @param {string} fingerprint
 * @returns {boolean}
 */
export function shouldReport(fingerprint) {
  const now = Date.now();

  // Cleanup stale per-fingerprint entries
  if (reported.size > 50) {
    for (const [fp, ts] of reported) {
      if (now - ts > GLOBAL_WINDOW_MS) reported.delete(fp);
    }
  }

  // Per-fingerprint cooldown
  const lastSeen = reported.get(fingerprint);
  if (lastSeen && now - lastSeen < COOLDOWN_MS) return false;

  // Global rate limit
  while (globalTimestamps.length && now - globalTimestamps[0] > GLOBAL_WINDOW_MS) {
    globalTimestamps.shift();
  }
  if (globalTimestamps.length >= GLOBAL_MAX) return false;

  // Record
  reported.set(fingerprint, now);
  globalTimestamps.push(now);
  return true;
}
