import dayjs, { getEffectiveTimezone } from '../utils/dayjs';

/**
 * Format an ISO 8601 datetime string (UTC) into the company's local time.
 *
 * Examples:
 *   formatTimeInTz("2026-02-28T16:00:00+00:00", company) → "8:00 AM"
 *   formatTimeInTz("14:30", company)                      → "2:30 PM"
 *
 * @param {string} timeString - ISO 8601 datetime or "HH:mm" time string
 * @param {Object|null} company - Company object with timezone property
 * @returns {string} Formatted time like "8:00 AM"
 */
export const formatTimeInTz = (timeString, company) => {
  if (!timeString) return '';

  const tz = getEffectiveTimezone(company);

  // Handle ISO 8601 datetime strings (e.g. "2026-02-28T16:00:00+00:00")
  if (timeString.includes('T')) {
    const d = dayjs(timeString).tz(tz);
    if (!d.isValid()) return '';
    return d.format('h:mm A');
  }

  // Handle simple "HH:mm" time strings — interpret as company-local time
  const [hours, minutes] = timeString.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) return '';
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
};

/**
 * Format an ISO 8601 datetime string into a date string in the company timezone.
 *
 * Examples:
 *   formatDateInTz("2026-02-28T16:00:00+00:00", company)          → "Sat, Feb 28"
 *   formatDateInTz("2026-02-28T16:00:00+00:00", company, 'long')  → "Saturday, February 28, 2026"
 *   formatDateInTz("2026-02-28T16:00:00+00:00", company, 'short') → "Feb 28"
 *
 * @param {string} isoString - ISO 8601 datetime string
 * @param {Object|null} company - Company object with timezone property
 * @param {'default'|'long'|'short'} variant - Date format variant
 * @returns {string} Formatted date string
 */
export const formatDateInTz = (isoString, company, variant = 'default') => {
  if (!isoString) return '';

  const tz = getEffectiveTimezone(company);
  const d = dayjs(isoString).tz(tz);
  if (!d.isValid()) return '';

  switch (variant) {
    case 'long':
      return d.format('dddd, MMMM D, YYYY');
    case 'short':
      return d.format('MMM D');
    default:
      return d.format('ddd, MMM D');
  }
};

/**
 * Get today's date key (YYYY-MM-DD) in the company timezone.
 * Avoids the bug where `new Date().toISOString().split('T')[0]` returns
 * a UTC date that can be wrong near midnight in non-UTC timezones.
 *
 * @param {Object|null} company - Company object with timezone property
 * @returns {string} Date key like "2026-02-28"
 */
export const getTodayKey = (company) => {
  const tz = getEffectiveTimezone(company);
  return dayjs().tz(tz).format('YYYY-MM-DD');
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
  return dayjs().tz(tz).add(daysAhead, 'day').format('YYYY-MM-DD');
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
  const today = dayjs().tz(tz);
  const todayKey = today.format('YYYY-MM-DD');
  const dates = [];

  for (let i = 0; i < days; i++) {
    const date = today.add(i, 'day');
    dates.push({
      key: date.format('YYYY-MM-DD'),
      dayName: date.format('ddd'),
      dayNumber: date.date(),
      month: date.format('MMM'),
      isToday: date.format('YYYY-MM-DD') === todayKey,
    });
  }
  return dates;
};
