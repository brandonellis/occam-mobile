import dayjs, { getEffectiveTimezone } from '../utils/dayjs';
import { getCoachSchedule, getBookingsCompact } from './bookings.api';
import { hasOverlap } from '../helpers/closure.helper';

/**
 * Mobile Availability Service
 *
 * Timezone-aware version matching the web app's availabilityService.js + timeSlotGenerator.js.
 * All date math is performed in the company's timezone using dayjs.tz to avoid
 * device-timezone mismatches that cause slots to be dropped.
 *
 * Flow:
 * 1. Fetch coach's schedule for the selected date (availability windows + bookings)
 * 2. Optionally fetch resource bookings if service requires_resource
 * 3. Generate candidate time slots from availability windows
 * 4. Filter out slots that conflict with existing bookings
 * 5. Return array of { start_time, end_time, display_time } objects
 */

/**
 * Parse a time value into a dayjs object in the company timezone.
 * Handles ISO strings, "HH:mm", and "HH:mm:ss" formats.
 */
const parseTimeTz = (timeValue, dateStr, tz) => {
  if (!timeValue) return null;
  const str = String(timeValue);

  // Already an ISO string with date component
  if (str.includes('T') || (str.includes(' ') && str.length > 8)) {
    return dayjs(str).tz(tz);
  }

  // Time-only string like "08:00" or "08:00:00" — interpret in company timezone
  return dayjs.tz(`${dateStr} ${str}`, tz);
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
 * @param {Array} [params.resourcePool=[]] - Resources of the required type at location (for auto-selection)
 * @param {Object} [params.company=null] - Company object with timezone property
 * @returns {Promise<Array>} Array of { start_time, end_time, display_time, available_resource_ids? }
 */
export const getAvailableTimeSlots = async ({
  service,
  coach,
  location,
  dateStr,
  durationMinutes = null,
  slotInterval = 15,
  resourcePool = [],
  company = null,
}) => {
  if (!service || !location) return [];

  const tz = getEffectiveTimezone(company);
  const serviceDuration = durationMinutes || service.duration_minutes || 60;
  const now = dayjs().tz(tz);

  // --- Step 1: Get availability windows (as dayjs objects in company tz) ---
  let availabilityWindows = [];
  let existingBookings = [];

  if (service.requires_coach && coach?.id) {
    // Send the raw YYYY-MM-DD string so the backend applies the company timezone
    try {
      const scheduleData = await getCoachSchedule(coach.id, {
        start: dateStr,
        end: dateStr,
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
          start: parseTimeTz(e.start_time || e.start, dateStr, tz),
          end: parseTimeTz(e.end_time || e.end, dateStr, tz),
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
          start: dayjs(e.start_time || e.start).tz(tz),
          end: dayjs(e.end_time || e.end).tz(tz),
          status: e.status || e.extendedProps?.status,
        }))
        .filter((b) => b.start.isValid() && b.end.isValid() && b.status !== 'cancelled');
    } catch (error) {
      console.warn('Failed to fetch coach schedule:', error.message);
      return [];
    }
  } else {
    // No coach required — use location operating hours
    const dayOfWeek = dayjs.tz(`${dateStr} 12:00`, tz).format('dddd').toLowerCase();

    const dayHours = location.hours?.[dayOfWeek];
    if (dayHours?.is_open && dayHours.open_time && dayHours.close_time) {
      availabilityWindows.push({
        start: dayjs.tz(`${dateStr} ${dayHours.open_time}`, tz),
        end: dayjs.tz(`${dateStr} ${dayHours.close_time}`, tz),
      });
    }
  }

  if (availabilityWindows.length === 0) return [];

  // --- Step 1b: Intersect with location hours if coach is used ---
  if (service.requires_coach && location.hours) {
    const dayOfWeek = dayjs.tz(`${dateStr} 12:00`, tz).format('dddd').toLowerCase();
    const dayHours = location.hours?.[dayOfWeek];

    if (dayHours?.is_open && dayHours.open_time && dayHours.close_time) {
      const locOpen = dayjs.tz(`${dateStr} ${dayHours.open_time}`, tz);
      const locClose = dayjs.tz(`${dateStr} ${dayHours.close_time}`, tz);

      // Intersect each coach window with location hours
      availabilityWindows = availabilityWindows
        .map((w) => ({
          start: w.start.isAfter(locOpen) ? w.start : locOpen,
          end: w.end.isBefore(locClose) ? w.end : locClose,
        }))
        .filter((w) => w.start.isBefore(w.end));
    } else if (dayHours && !dayHours.is_open) {
      // Location explicitly closed
      return [];
    }
  }

  // --- Step 2: Fetch resource bookings if needed ---
  const resourceBookingMap = {};
  if (service.requires_resource && resourcePool.length > 0) {
    try {
      const resourceIds = resourcePool.map((r) => r.id || r.resource_id).filter(Boolean);
      const resp = await getBookingsCompact({
        start_date: dateStr,
        end_date: dateStr,
        location_id: location.id,
        resource_ids: resourceIds,
      });
      const allResourceBookings = (resp?.data || [])
        .filter((b) => b.status !== 'cancelled');

      allResourceBookings.forEach((b) => {
        const rIds = b.resource_ids || (b.resource_id ? [b.resource_id] : []);
        const booking = {
          start: dayjs(b.start_time || b.start).tz(tz),
          end: dayjs(b.end_time || b.end).tz(tz),
        };
        rIds.forEach((rid) => {
          if (!resourceBookingMap[rid]) resourceBookingMap[rid] = [];
          resourceBookingMap[rid].push(booking);
        });
        existingBookings.push(booking);
      });
    } catch (err) {
      console.warn('Failed to fetch resource bookings:', err.message);
    }
  } else if (service.requires_resource) {
    try {
      const resp = await getBookingsCompact({
        start_date: dateStr,
        end_date: dateStr,
        location_id: location.id,
      });
      const resourceBookings = (resp?.data || [])
        .filter((b) => b.status !== 'cancelled')
        .map((b) => ({
          start: dayjs(b.start_time || b.start).tz(tz),
          end: dayjs(b.end_time || b.end).tz(tz),
        }));
      existingBookings = [...existingBookings, ...resourceBookings];
    } catch (err) {
      console.warn('Failed to fetch resource bookings:', err.message);
    }
  }

  // --- Step 3: Generate candidate time slots (matching web timeSlotGenerator.js) ---
  const slots = [];
  const interval = Math.max(slotInterval, 1);

  // Round up to nearest interval from windowStart (in company tz minutes)
  const roundUpToInterval = (d, intervalMin) => {
    const m = d.hour() * 60 + d.minute();
    const rounded = Math.ceil(m / intervalMin) * intervalMin;
    const delta = rounded - m;
    return d.add(delta, 'minute');
  };

  availabilityWindows.forEach((window) => {
    const windowEnd = window.end;

    // Align cursor to interval grid in company timezone
    let cursor = roundUpToInterval(window.start.startOf('minute'), interval);

    while (cursor.isBefore(windowEnd)) {
      const slotEnd = cursor.add(serviceDuration, 'minute');

      // Slot must fit within the window
      if (slotEnd.isAfter(windowEnd)) break;

      // Skip past slots
      if (cursor.isAfter(now)) {
        // Check for conflicts with existing bookings
        const cursorMs = cursor.valueOf();
        const slotEndMs = slotEnd.valueOf();

        const hasConflict = existingBookings.some((booking) =>
          hasOverlap(cursorMs, slotEndMs, booking.start.valueOf(), booking.end.valueOf())
        );

        if (!hasConflict) {
          const slot = {
            start_time: cursor.format(),
            end_time: slotEnd.format(),
            display_time: cursor.format('h:mm A'),
          };

          // When service requires_resource, determine which resources are free
          let includeSlot = true;
          if (service.requires_resource && resourcePool.length > 0) {
            const availableResourceIds = resourcePool
              .map((r) => r.id || r.resource_id)
              .filter((rid) => {
                const bookings = resourceBookingMap[rid] || [];
                return !bookings.some((b) =>
                  hasOverlap(cursorMs, slotEndMs, b.start.valueOf(), b.end.valueOf())
                );
              });
            slot.available_resource_ids = availableResourceIds;
            if (availableResourceIds.length === 0) {
              includeSlot = false;
            }
          }

          if (includeSlot) {
            slots.push(slot);
          }
        }
      }

      cursor = cursor.add(interval, 'minute');
    }
  });

  return slots;
};
