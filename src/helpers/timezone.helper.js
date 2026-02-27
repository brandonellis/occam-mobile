import { getEffectiveTimezone } from '../utils/dayjs';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * HERMES-SAFE TIMEZONE HELPERS
 * ─────────────────────────────────────────────────────────────────────────────
 * dayjs .tz().format() is broken on Hermes — it silently ignores the timezone
 * and outputs raw UTC digits. These helpers use native Intl.DateTimeFormat with
 * the `timeZone` option, which Hermes supports correctly.
 *
 * ALL display formatting in the mobile app should go through these functions.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ── Intl formatter cache (avoid re-creating on every call) ──────────────────
const _cache = {};
const getFormatter = (tz, options) => {
  const key = `${tz}|${JSON.stringify(options)}`;
  if (!_cache[key]) {
    _cache[key] = new Intl.DateTimeFormat('en-US', { ...options, timeZone: tz });
  }
  return _cache[key];
};

/**
 * Get the individual date parts in the target timezone.
 * Returns { year, month, day, hour, minute, second, weekday, dayPeriod }
 */
const getPartsInTz = (date, tz) => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    weekday: 'short',
    hour12: true,
  });

  const parts = {};
  formatter.formatToParts(date).forEach(({ type, value }) => {
    parts[type] = value;
  });
  return parts;
};

const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAY_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_SHORT = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_LONG = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/**
 * Convert any time-like input to a native Date object.
 * Handles ISO 8601, "YYYY-MM-DD", and epoch ms.
 */
const toDate = (input) => {
  if (input instanceof Date) return input;
  if (typeof input === 'number') return new Date(input);
  if (typeof input === 'string') return new Date(input);
  return new Date();
};

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Format an ISO 8601 datetime string (UTC) into the company's local time.
 *
 * Examples:
 *   formatTimeInTz("2026-02-28T00:00:00+00:00", company) → "4:00 PM"  (PST)
 *   formatTimeInTz("14:30", company)                      → "2:30 PM"
 *
 * @param {string} timeString - ISO 8601 datetime or "HH:mm" time string
 * @param {Object|null} company - Company object with timezone property
 * @returns {string} Formatted time like "4:00 PM"
 */
export const formatTimeInTz = (timeString, company) => {
  if (!timeString) return '';

  // Handle simple "HH:mm" time strings — interpret as company-local time
  if (!timeString.includes('T') && !timeString.includes('-')) {
    const [hours, minutes] = timeString.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return '';
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
  }

  const tz = getEffectiveTimezone(company);
  const date = toDate(timeString);
  if (isNaN(date.getTime())) return '';

  const formatter = getFormatter(tz, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return formatter.format(date);
};

/**
 * Format an ISO 8601 datetime string into a date string in the company timezone.
 *
 * Examples:
 *   formatDateInTz("2026-02-28T00:00:00+00:00", company)          → "Thu, Feb 27"  (PST)
 *   formatDateInTz("2026-02-28T00:00:00+00:00", company, 'long')  → "Thursday, February 27, 2026"
 *   formatDateInTz("2026-02-28T00:00:00+00:00", company, 'short') → "Feb 27"
 *
 * @param {string} isoString - ISO 8601 datetime string
 * @param {Object|null} company - Company object with timezone property
 * @param {'default'|'long'|'short'} variant - Date format variant
 * @returns {string} Formatted date string
 */
export const formatDateInTz = (isoString, company, variant = 'default') => {
  if (!isoString) return '';

  const tz = getEffectiveTimezone(company);
  const date = toDate(isoString);
  if (isNaN(date.getTime())) return '';

  const parts = getPartsInTz(date, tz);
  const monthNum = parseInt(parts.month, 10);
  const dayNum = parseInt(parts.day, 10);
  const year = parts.year;

  // Map the weekday from Intl (may include period) to our clean format
  const weekdayShort = parts.weekday?.replace('.', '') || '';
  const weekdayIdx = WEEKDAY_SHORT.indexOf(weekdayShort);

  switch (variant) {
    case 'long': {
      const longDay = weekdayIdx >= 0 ? WEEKDAY_LONG[weekdayIdx] : weekdayShort;
      return `${longDay}, ${MONTH_LONG[monthNum]} ${dayNum}, ${year}`;
    }
    case 'short':
      return `${MONTH_SHORT[monthNum]} ${dayNum}`;
    default:
      return `${weekdayShort}, ${MONTH_SHORT[monthNum]} ${dayNum}`;
  }
};

/**
 * Format an ISO 8601 datetime as a combined "time · date" string.
 *
 * @param {string} isoString - ISO 8601 datetime string
 * @param {Object|null} company - Company object with timezone property
 * @returns {string} e.g. "4:00 PM · Fri, Feb 27"
 */
export const formatDateTimeInTz = (isoString, company) => {
  if (!isoString) return '';
  const time = formatTimeInTz(isoString, company);
  const date = formatDateInTz(isoString, company);
  return `${time} · ${date}`;
};

/**
 * Format a YYYY-MM-DD date key string into a long display format.
 * Uses Intl so it works correctly on Hermes.
 *
 * @param {string} dateKey - Date string like "2026-02-27"
 * @returns {string} e.g. "Friday, February 27"
 */
export const formatDateKeyLong = (dateKey) => {
  if (!dateKey) return '';
  // Parse as noon UTC to avoid date-shift from timezone offset
  const date = new Date(`${dateKey}T12:00:00Z`);
  if (isNaN(date.getTime())) return '';

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  return formatter.format(date);
};

/**
 * Get today's date key (YYYY-MM-DD) in the company timezone.
 *
 * @param {Object|null} company - Company object with timezone property
 * @returns {string} Date key like "2026-02-27"
 */
export const getTodayKey = (company) => {
  const tz = getEffectiveTimezone(company);
  return dateKeyInTz(new Date(), tz);
};

/**
 * Get a future date key (YYYY-MM-DD) in the company timezone.
 *
 * @param {Object|null} company - Company object with timezone property
 * @param {number} daysAhead - Number of days from today
 * @returns {string} Date key like "2026-03-30"
 */
export const getFutureDateKey = (company, daysAhead = 30) => {
  const tz = getEffectiveTimezone(company);
  const future = new Date(Date.now() + daysAhead * 86400000);
  return dateKeyInTz(future, tz);
};

/**
 * Generate a date range array starting from today in the company timezone.
 * Used for date strip UI on schedule and booking screens.
 *
 * @param {Object|null} company - Company object with timezone property
 * @param {number} days - Number of days to generate
 * @returns {Array<{key: string, dayName: string, dayNumber: number, month: string, isToday: boolean}>}
 */
export const generateDateRangeInTz = (company, days = 14) => {
  const tz = getEffectiveTimezone(company);
  const now = new Date();
  const todayKey = dateKeyInTz(now, tz);
  const dates = [];

  for (let i = 0; i < days; i++) {
    const d = new Date(now.getTime() + i * 86400000);
    const parts = getPartsInTz(d, tz);
    const monthNum = parseInt(parts.month, 10);
    const dayNum = parseInt(parts.day, 10);
    const key = dateKeyFromParts(parts);
    const weekdayShort = parts.weekday?.replace('.', '') || '';

    dates.push({
      key,
      dayName: weekdayShort,
      dayNumber: dayNum,
      month: MONTH_SHORT[monthNum],
      isToday: key === todayKey,
    });
  }
  return dates;
};

/**
 * Convert an ISO 8601 datetime string to "HH:mm" in the company timezone.
 * Hermes-safe — uses Intl.DateTimeFormat instead of dayjs .tz().format().
 *
 * @param {string} isoString - ISO 8601 datetime string
 * @param {string} tz - IANA timezone string
 * @returns {string} e.g. "16:00"
 */
export const isoToHHmm = (isoString, tz) => {
  if (!isoString) return '00:00';
  const date = toDate(isoString);
  if (isNaN(date.getTime())) return '00:00';

  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return formatter.format(date);
};

/**
 * Convert an ISO 8601 datetime string to a full local ISO string in the
 * target timezone, preserving the correct offset. Hermes-safe.
 *
 * @param {string} isoString - ISO 8601 datetime string (UTC or with offset)
 * @param {string} tz - IANA timezone string
 * @returns {string} ISO-like string with the correct local digits, e.g. "2026-02-27T16:00:00"
 */
export const isoToLocalIso = (isoString, tz) => {
  if (!isoString) return '';
  const date = toDate(isoString);
  if (isNaN(date.getTime())) return '';

  const parts = getPartsInTz(date, tz);

  const formatter24 = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const time24 = formatter24.format(date); // "16:00:00"

  return `${parts.year}-${parts.month}-${parts.day}T${time24}`;
};

// ── Internal utilities ──────────────────────────────────────────────────────

/**
 * Get a YYYY-MM-DD string for a Date in a given timezone.
 */
const dateKeyInTz = (date, tz) => {
  const parts = getPartsInTz(date, tz);
  return dateKeyFromParts(parts);
};

/**
 * Build YYYY-MM-DD from Intl parts object.
 */
const dateKeyFromParts = (parts) => {
  return `${parts.year}-${parts.month}-${parts.day}`;
};
