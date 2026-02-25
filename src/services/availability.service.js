import { getCoachSchedule, getBookingsCompact } from './bookings.api';

/**
 * Mobile Availability Service
 *
 * Simplified version of the web app's availabilityService.js + timeSlotGenerator.js.
 * Uses the same backend endpoints (coach schedule, bookings compact) but with
 * streamlined client-side slot computation suitable for mobile.
 *
 * Flow:
 * 1. Fetch coach's schedule for the selected date (availability windows + bookings)
 * 2. Optionally fetch resource bookings if service requires_resource
 * 3. Generate candidate time slots from availability windows
 * 4. Filter out slots that conflict with existing bookings
 * 5. Return array of { start_time, end_time, display_time } objects
 */

/**
 * Parse a time value into a Date object for the given date string.
 * Handles ISO strings, "HH:mm", and "HH:mm:ss" formats.
 */
const parseTime = (timeValue, dateStr) => {
  if (!timeValue) return null;
  const str = String(timeValue);

  // Already an ISO string with date component
  if (str.includes('T') || str.includes(' ') && str.length > 8) {
    return new Date(str);
  }

  // Time-only string like "08:00" or "08:00:00"
  const [hours, minutes] = str.split(':').map(Number);
  const d = new Date(`${dateStr}T00:00:00`);
  d.setHours(hours, minutes || 0, 0, 0);
  return d;
};

/**
 * Format a Date object as ISO 8601 with timezone offset for the backend.
 * Uses the device's local timezone offset.
 */
const toISO = (date) => {
  const pad = (n) => String(n).padStart(2, '0');
  const offset = -date.getTimezoneOffset();
  const sign = offset >= 0 ? '+' : '-';
  const absOffset = Math.abs(offset);
  const tzHours = pad(Math.floor(absOffset / 60));
  const tzMinutes = pad(absOffset % 60);

  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}` +
    `${sign}${tzHours}:${tzMinutes}`
  );
};

/**
 * Format a Date as "h:mm AM/PM"
 */
const formatDisplayTime = (date) => {
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${ampm}`;
};

/**
 * Check if two time ranges overlap.
 */
const hasOverlap = (startA, endA, startB, endB) => {
  return startA < endB && endA > startB;
};

/**
 * Generate available time slots for a given date.
 *
 * @param {Object} params
 * @param {Object} params.service - Service object with id, duration_minutes, requires_coach, requires_resource
 * @param {Object} params.coach - Coach object with id (if selected)
 * @param {Object} params.location - Location object with id, hours
 * @param {string} params.dateStr - Date string "YYYY-MM-DD"
 * @param {number} [params.durationMinutes] - Override duration for variable-duration services
 * @param {number} [params.slotInterval=15] - Interval between slot starts in minutes
 * @returns {Promise<Array>} Array of { start_time, end_time, display_time }
 */
export const getAvailableTimeSlots = async ({
  service,
  coach,
  location,
  dateStr,
  durationMinutes = null,
  slotInterval = 15,
}) => {
  if (!service || !location) return [];

  const serviceDuration = durationMinutes || service.duration_minutes || 60;
  const now = new Date();

  // --- Step 1: Get availability windows ---
  let availabilityWindows = [];
  let existingBookings = [];

  if (service.requires_coach && coach?.id) {
    // Fetch coach schedule for the day (returns { events: [...], coach: {...} })
    const startISO = new Date(`${dateStr}T00:00:00`).toISOString();
    const endISO = new Date(`${dateStr}T23:59:59`).toISOString();

    try {
      const scheduleData = await getCoachSchedule(coach.id, {
        start: startISO,
        end: endISO,
      });

      const events = scheduleData?.events || (Array.isArray(scheduleData) ? scheduleData : []);

      // Availability events: id starts with "avail_" or title is "Available"/"Daily"
      availabilityWindows = events
        .filter((e) => {
          const id = e?.id || '';
          const title = e?.title || '';
          return id.startsWith('avail_') || title === 'Available' || title === 'Daily';
        })
        .map((e) => ({
          start: parseTime(e.start_time || e.start, dateStr),
          end: parseTime(e.end_time || e.end, dateStr),
        }))
        .filter((w) => w.start && w.end);

      // Booking events: id starts with "book_" or is a class session
      existingBookings = events
        .filter((e) => {
          const id = e?.id || '';
          const type = e?.type || e?.extendedProps?.type || '';
          return id.startsWith('book_') || type === 'class_session';
        })
        .map((e) => ({
          start: new Date(e.start_time || e.start),
          end: new Date(e.end_time || e.end),
          status: e.status || e.extendedProps?.status,
        }))
        .filter((b) => b.start && b.end && b.status !== 'cancelled');
    } catch (error) {
      console.warn('Failed to fetch coach schedule:', error.message);
      return [];
    }
  } else {
    // No coach required — use location operating hours
    const dayOfWeek = new Date(`${dateStr}T12:00:00`)
      .toLocaleDateString('en-US', { weekday: 'long' })
      .toLowerCase();

    const dayHours = location.hours?.[dayOfWeek];
    if (dayHours?.is_open && dayHours.open_time && dayHours.close_time) {
      availabilityWindows.push({
        start: parseTime(dayHours.open_time, dateStr),
        end: parseTime(dayHours.close_time, dateStr),
      });
    }
  }

  if (availabilityWindows.length === 0) return [];

  // --- Step 1b: Intersect with location hours if coach is used ---
  if (service.requires_coach && location.hours) {
    const dayOfWeek = new Date(`${dateStr}T12:00:00`)
      .toLocaleDateString('en-US', { weekday: 'long' })
      .toLowerCase();
    const dayHours = location.hours?.[dayOfWeek];

    if (dayHours?.is_open && dayHours.open_time && dayHours.close_time) {
      const locOpen = parseTime(dayHours.open_time, dateStr);
      const locClose = parseTime(dayHours.close_time, dateStr);

      // Intersect each coach window with location hours
      availabilityWindows = availabilityWindows
        .map((w) => ({
          start: new Date(Math.max(w.start.getTime(), locOpen.getTime())),
          end: new Date(Math.min(w.end.getTime(), locClose.getTime())),
        }))
        .filter((w) => w.start < w.end);
    } else if (dayHours && !dayHours.is_open) {
      // Location explicitly closed
      return [];
    }
  }

  // --- Step 2: Fetch resource bookings if needed ---
  if (service.requires_resource) {
    try {
      const resp = await getBookingsCompact({
        start_date: dateStr,
        end_date: dateStr,
        location_id: location.id,
      });
      const resourceBookings = (resp?.data || [])
        .filter((b) => b.status !== 'cancelled')
        .map((b) => ({
          start: new Date(b.start_time || b.start),
          end: new Date(b.end_time || b.end),
        }));
      existingBookings = [...existingBookings, ...resourceBookings];
    } catch {
      // Non-fatal — proceed without resource conflict data
    }
  }

  // --- Step 3: Generate candidate time slots ---
  const slots = [];
  const interval = Math.max(slotInterval, 1);

  availabilityWindows.forEach((window) => {
    // Round up window start to nearest interval
    const windowStartMs = window.start.getTime();
    const windowEndMs = window.end.getTime();
    const intervalMs = interval * 60 * 1000;
    const durationMs = serviceDuration * 60 * 1000;

    // Align to interval grid
    const midnight = new Date(`${dateStr}T00:00:00`).getTime();
    const offsetFromMidnight = windowStartMs - midnight;
    const roundedOffset = Math.ceil(offsetFromMidnight / intervalMs) * intervalMs;
    let cursor = midnight + roundedOffset;

    while (cursor + durationMs <= windowEndMs) {
      const slotStart = new Date(cursor);
      const slotEnd = new Date(cursor + durationMs);

      // Skip past slots
      if (slotStart > now) {
        // Check for conflicts with existing bookings
        const hasConflict = existingBookings.some((booking) =>
          hasOverlap(
            slotStart.getTime(),
            slotEnd.getTime(),
            booking.start.getTime(),
            booking.end.getTime()
          )
        );

        if (!hasConflict) {
          slots.push({
            start_time: toISO(slotStart),
            end_time: toISO(slotEnd),
            display_time: formatDisplayTime(slotStart),
          });
        }
      }

      cursor += intervalMs;
    }
  });

  return slots;
};
