import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

export const DEFAULT_TIMEZONE = 'UTC';

/**
 * Get the effective timezone from a company object.
 * @param {Object} company - Company object with timezone property
 * @returns {string}
 */
export const getEffectiveTimezone = (company) => {
  return company?.timezone || DEFAULT_TIMEZONE;
};

/**
 * Parse a "YYYY-MM-DD HH:mm" or "YYYY-MM-DD HH:mm:ss" local-time string
 * in the given timezone. Uses the three-argument dayjs.tz() form so the
 * string is interpreted IN the timezone, not parsed as UTC.
 */
export const parseDateTimeInTz = (dateStr, timeStr, tz) => {
  const normalizedTime = timeStr ? timeStr.substring(0, 5) : '00:00';
  return dayjs.tz(`${dateStr} ${normalizedTime}`, 'YYYY-MM-DD HH:mm', tz);
};

export default dayjs;
