export const STEP_LABELS = ['Service', 'Coach', 'Date & Time', 'Confirm'];

export const formatPrice = (amount) => {
  if (amount == null) return '$0';
  const num = Number(amount);
  return `$${num.toFixed(num % 1 === 0 ? 0 : 2)}`;
};

export const formatDuration = (minutes) => {
  if (!minutes) return '';
  if (minutes < 60) return `${minutes} min`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hrs} hr${hrs > 1 ? 's' : ''}`;
  return `${hrs} hr ${mins} min`;
};

/**
 * Format a time string using device-local timezone.
 *
 * IMPORTANT: For displaying booking/session times, prefer formatTimeInTz()
 * from helpers/timezone.helper.js which uses the company timezone instead
 * of the device timezone.
 */
export const formatTime = (timeString) => {
  if (!timeString) return '';

  // Handle ISO 8601 datetime strings (e.g. "2026-02-24T18:00:00+00:00")
  if (timeString.includes('T')) {
    const date = new Date(timeString);
    if (isNaN(date.getTime())) return '';
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  }

  // Handle simple "HH:MM" time strings
  const [hours, minutes] = timeString.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
};
