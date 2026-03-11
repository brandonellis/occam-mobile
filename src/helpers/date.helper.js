export const parseDateKey = (dateKey) => new Date(`${dateKey}T12:00:00Z`);

export const formatDateKey = (date) => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const shiftDateKey = (dateKey, offset) => {
  const next = parseDateKey(dateKey);
  next.setUTCDate(next.getUTCDate() + offset);
  return formatDateKey(next);
};

const _weekdayFormatter = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'UTC' });
const _dayFormatter = new Intl.DateTimeFormat('en-US', { day: 'numeric', timeZone: 'UTC' });

export const buildDateStrip = (selectedDateKey, todayKey) => {
  return Array.from({ length: 7 }, (_, index) => {
    const key = shiftDateKey(selectedDateKey, index - 3);
    const date = parseDateKey(key);
    return {
      key,
      dayName: _weekdayFormatter.format(date),
      dayNumber: _dayFormatter.format(date),
      isToday: key === todayKey,
    };
  });
};

/**
 * Returns a human-readable relative time string (e.g. "5m ago", "2h ago", "3d ago").
 * Falls back to a short date format for older dates.
 *
 * @param {string|null} dateStr - ISO 8601 date string
 * @returns {string}
 */
export const getTimeAgo = (dateStr) => {
  if (!dateStr) return '';
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};
