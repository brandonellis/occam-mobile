import dayjs, { getEffectiveTimezone } from './dayjs';
import { EVENT_TYPES } from '../constants/events.constants';
import { isClassLike } from '../helpers/normalizers.helper';

/**
 * Parse a "YYYY-MM-DD HH:mm" or "YYYY-MM-DD HH:mm:ss" local-time string
 * in the given timezone. Uses the three-argument dayjs.tz() form so the
 * string is interpreted IN the timezone, not parsed as UTC.
 */
const parseDateTimeInTz = (dateStr, timeStr, tz) => {
  const normalizedTime = timeStr ? timeStr.substring(0, 5) : '00:00';
  return dayjs.tz(`${dateStr} ${normalizedTime}`, 'YYYY-MM-DD HH:mm', tz);
};

/**
 * Generate available time slots based on availability windows and existing bookings
 *
 * Exact port of occam-client/src/utils/timeSlotGenerator.js.
 * All date math uses dayjs with timezone support.
 *
 * IMPORTANT — Hermes (React Native JS engine) compatibility notes:
 *  - NEVER call .startOf() / .endOf() on a tz-aware dayjs object; it strips
 *    the timezone and reinterprets the local digits as UTC.
 *  - NEVER call .toISOString() on a tz-aware dayjs object; same problem.
 *  - Use .format() to serialize (preserves offset, e.g. "2026-02-25T08:00:00-08:00").
 *  - Use dayjs(string).tz(tz) to deserialize (respects embedded offset).
 *
 * @param {Array} availability - Array of availability windows from coach/location
 * @param {Array} bookings - Array of existing bookings to check for conflicts
 * @param {Object} selectedDate - dayjs object of the selected date
 * @param {Object} service - Service object with duration_minutes
 * @param {Object} company - Company object for timezone
 * @param {Object} selectedResource - Selected resource object (for explicit selection flow)
 * @param {Array} resourcePool - Array of resources (same type/location) when auto-selecting
 * @param {Number} durationMinutes - Duration of the time slot in minutes
 * @returns {Array} Array of available time slots
 */
export const generateTimeSlots = (
  availability,
  bookings,
  selectedDate,
  service,
  company,
  selectedResource = null,
  resourcePool = [],
  durationMinutes = null
) => {
  const slots = [];
  if (!service || !availability || availability.length === 0) {
    return slots;
  }

  const companyTimezone = getEffectiveTimezone(company);
  const serviceDuration = durationMinutes || service.duration_minutes || 60;
  // Configurable buffer between time-slot starts (in minutes). Default 0.
  const bufferMinutesRaw = (company?.settings?.slot_buffer_minutes ?? company?.slot_buffer_minutes ?? 0);
  const bufferMinutes = Number.isFinite(bufferMinutesRaw) ? Number(bufferMinutesRaw) : parseInt(bufferMinutesRaw, 10) || 0;
  // Start interval grid in minutes (default 15). This controls the cadence of candidate starts.
  const startIntervalRaw = (company?.settings?.slot_start_interval_minutes ?? company?.slot_start_interval_minutes ?? 15);
  const startInterval = Number.isFinite(startIntervalRaw) ? Number(startIntervalRaw) : parseInt(startIntervalRaw, 10) || 15;

  // Generate potential slots from availability windows
  const potentialSlots = [];

  // ── Hermes-safe helpers ──
  // On Hermes, tz-aware dayjs objects are unreliable for .startOf(), .toISOString(),
  // and even .format() can produce wrong offsets. So we do ALL arithmetic with
  // epoch-ms and only touch dayjs for parsing input strings and formatting output.

  /**
   * Parse an availability time string → epoch ms.
   * Handles HH:mm (local), ISO with offset, and plain ISO/UTC strings.
   */
  const parseToMs = (timeStr, fallbackDateStr) => {
    if (!timeStr) return null;
    // Pure time string like "08:00" or "20:00:00"
    if (!timeStr.includes('T') && !timeStr.includes(' ') && timeStr.includes(':')) {
      return parseDateTimeInTz(fallbackDateStr, timeStr, companyTimezone).valueOf();
    }
    // ISO with offset (e.g. "2026-02-25T08:00:00-08:00") or UTC "Z"
    return dayjs(timeStr).valueOf();
  };

  const intervalMs = Math.max(startInterval, 1) * 60000;
  const durationMs = serviceDuration * 60000;
  const bufferMs = Math.max(bufferMinutes, 0) * 60000;
  const nowMs = Date.now();
  const selectedDateStr = selectedDate.format('YYYY-MM-DD');

  // We need "start of selected day" and "end of selected day" in epoch ms
  // to filter candidates to the correct calendar day.
  const dayStartMs = parseDateTimeInTz(selectedDateStr, '00:00', companyTimezone).valueOf();
  const dayEndMs = dayStartMs + 86400000; // +24h

  // Process each availability window to generate slots
  availability.forEach(avail => {
    const startTime = avail.start_time || avail.start;
    const endTimeValue = avail.end_time || avail.end;
    const dateForParsing = avail.date || selectedDateStr;

    const windowStartMs = parseToMs(startTime, dateForParsing);
    const windowEndMs = parseToMs(endTimeValue, dateForParsing);
    if (windowStartMs == null || windowEndMs == null || windowStartMs >= windowEndMs) return;

    // Build a de-duplicated set of candidate start times (epoch ms)
    const candidateStarts = new Set();

    // 1) Grid candidates aligned to startInterval
    // Figure out ms offset from midnight-in-tz, round up to next interval boundary.
    const msFromDayStart = windowStartMs - dayStartMs;
    const minutesFromMidnight = msFromDayStart / 60000;
    const roundedMinutes = Math.ceil(minutesFromMidnight / startInterval) * startInterval;
    let cursorMs = dayStartMs + roundedMinutes * 60000;

    while (cursorMs < windowEndMs) {
      candidateStarts.add(cursorMs);
      cursorMs += intervalMs;
    }

    // 2) Off-grid candidates immediately after booking end + buffer
    if (Array.isArray(bookings) && bookings.length > 0) {
      bookings.forEach((booking) => {
        const endTimeStr = booking.end_time || booking.end;
        if (!endTimeStr) return;
        const bookingEndMs = dayjs(endTimeStr).valueOf();
        const candidateMs = bookingEndMs + bufferMs;
        if (
          candidateMs >= dayStartMs && candidateMs < dayEndMs &&
          candidateMs >= windowStartMs && candidateMs < windowEndMs
        ) {
          candidateStarts.add(candidateMs);
        }
      });
    }

    // Emit potential slots for each candidate
    Array.from(candidateStarts)
      .sort((a, b) => a - b)
      .forEach((ms) => {
        const endMs = ms + durationMs;
        if (endMs > windowEndMs) return;   // slot extends past window
        if (ms < nowMs) return;            // slot is in the past
        if (ms < dayStartMs || ms >= dayEndMs) return; // wrong day

        // Only create dayjs objects for display formatting
        const start = parseDateTimeInTz(
          selectedDateStr,
          `${String(Math.floor((ms - dayStartMs) / 3600000)).padStart(2, '0')}:${String(Math.floor(((ms - dayStartMs) % 3600000) / 60000)).padStart(2, '0')}`,
          companyTimezone
        );
        const end = parseDateTimeInTz(
          selectedDateStr,
          `${String(Math.floor((endMs - dayStartMs) / 3600000)).padStart(2, '0')}:${String(Math.floor(((endMs - dayStartMs) % 3600000) / 60000)).padStart(2, '0')}`,
          companyTimezone
        );
        potentialSlots.push({
          start,
          end,
          start_time: start.format(),
          end_time: end.format(),
          display_time: start.format('h:mm A'),
          _startMs: ms,
          _endMs: endMs
        });
      });
  });

  if (potentialSlots.length === 0) {
    return [];
  }

  // Prepare resource pool ids for capacity calculations
  const resourcePoolIds = Array.isArray(resourcePool)
    ? resourcePool.map(r => (r.id || r.resource_id)).filter(Boolean).map(id => id.toString())
    : [];

  potentialSlots.forEach((slot) => {
    const slotStartMs = slot._startMs;
    const slotEndMs = slot._endMs;

    // Check for booking conflicts and compute resource usage for capacity
    let bookedResourceIdsForSlot = new Set();
    const hasConflict = bookings.some((booking) => {
      // Skip cancelled bookings
      if (booking.status === 'cancelled') {
        return false;
      }

      // Parse booking times to epoch ms
      const startTimeStr = booking.start_time || booking.start;
      const endTimeStr = booking.end_time || booking.end;

      if (!startTimeStr || !endTimeStr) {
        return false;
      }

      const bookingStartMs = dayjs(startTimeStr).valueOf();
      const bookingEndMs = dayjs(endTimeStr).valueOf();

      // Check for time overlap using epoch ms
      const hasTimeOverlap = slotStartMs < bookingEndMs && slotEndMs > bookingStartMs;

      if (!hasTimeOverlap) {
        return false;
      }

      // Check if this booking conflicts with the coach or resource
      let hasCoachConflict = false;
      let hasResourceConflict = false;

      // Check for coach conflicts (coach bookings OR class sessions make coach unavailable)
      if (service.requires_coach) {
        const bookingType = booking.type || booking.extendedProps?.type;
        // Treat explicit coach links as conflicts
        if (booking.coach_id || booking.coaches) {
          hasCoachConflict = true;
        }
        // Treat normal bookings as conflicts
        if (booking.extendedProps && booking.extendedProps.type === EVENT_TYPES.BOOKING) {
          hasCoachConflict = true;
        }
        // Treat class sessions as coach conflicts as well
        if (bookingType === EVENT_TYPES.CLASS_SESSION) {
          hasCoachConflict = true;
        }
      }

      // Check for resource conflicts if service requires resource
      if (service.requires_resource) {
        const bookingResourceIds = [];

        // From resources array
        if (booking.resources && Array.isArray(booking.resources)) {
          booking.resources.forEach(resource => {
            const resourceId = resource.id || resource.resource_id || resource.bookable_id;
            if (resourceId) bookingResourceIds.push(resourceId.toString());
          });
        }

        // From bookable_id if bookable_type is resource
        if ((booking.bookable_type === 'App\\Models\\Resource' || booking.bookable_type === 'resource') && booking.bookable_id) {
          bookingResourceIds.push(booking.bookable_id.toString());
        }

        // From resource_ids array
        if (booking.resource_ids && Array.isArray(booking.resource_ids)) {
          booking.resource_ids.forEach(resourceId => {
            if (resourceId) bookingResourceIds.push(resourceId.toString());
          });
        }

        if (selectedResource) {
          // Explicit selection flow: any overlap with selected resource blocks
          hasResourceConflict = bookingResourceIds.includes(selectedResource.id.toString());
        } else if (resourcePoolIds.length > 0) {
          // Auto-select flow: collect booked resource ids intersecting the pool for capacity
          bookingResourceIds.forEach(id => {
            if (resourcePoolIds.includes(id)) {
              bookedResourceIdsForSlot.add(id);
            }
          });
        }
      }

      // Return true if there's either a coach conflict OR resource conflict
      return hasCoachConflict || hasResourceConflict;
    });

    // For auto-select resource mode, compute capacity and only include slot if capacity > 0
    if (service.requires_resource && !selectedResource && resourcePoolIds.length > 0) {
      const uniqueBookedIds = Array.from(bookedResourceIdsForSlot);
      const capacity = Math.max(resourcePoolIds.length - uniqueBookedIds.length, 0);
      if (!hasConflict && capacity > 0) {
        // Determine available resource ids = pool - booked
        const availableIds = resourcePoolIds.filter(id => !bookedResourceIdsForSlot.has(id));
        slots.push({
          id: `slot_${slot.start.format('HHmm')}`,
          start_time: slot.start_time,
          end_time: slot.end_time,
          display_time: slot.display_time,
          date: selectedDate.format('YYYY-MM-DD'),
          capacity,
          available_resource_ids: availableIds
        });
      }
    } else {
      // Legacy / explicit resource selection or coach-only services
      if (!hasConflict) {
        slots.push({
          id: `slot_${slot.start.format('HHmm')}`,
          start_time: slot.start_time,
          end_time: slot.end_time,
          display_time: slot.display_time,
          date: selectedDate.format('YYYY-MM-DD')
        });
      }
    }
  });

  return slots;
};

/**
 * Process availability data and bookings for time slot generation
 * This handles the complex logic of intersecting coach and resource availability
 *
 * Exact port of occam-client/src/utils/timeSlotGenerator.js processAvailabilityData.
 *
 * @param {Object} service - Service object
 * @param {Object} coach - Coach object (if required)
 * @param {Object} selectedResource - Resource object (if required)
 * @param {Object} location - Location object
 * @param {Object} selectedDate - dayjs object of selected date
 * @param {Array} coachData - Raw coach availability data
 * @param {Array} resourceBookings - Resource-specific bookings
 * @param {Object} company - Company object for timezone
 * @param {Array} resourcePool - Array of resources (same type/location) when auto-selecting
 * @returns {Object} Processed availability and bookings
 */
export const processAvailabilityData = (service, coach, selectedResource, location, selectedDate, coachData, resourceBookings, company, resourcePool = []) => {

  const companyTimezone = getEffectiveTimezone(company);
  let availability = [];
  let allBookings = [];

  // If the service requires neither a coach nor a resource and it's not a class-type service,
  // it should not be bookable. Return no availability to prevent slot generation.
  if (service && !service.requires_coach && !service.requires_resource && !isClassLike(service)) {
    return { availability: [], bookings: [] };
  }

  // Get location hours first and normalize to remove seconds
  let locationAvailability = [];
  const locationHours = location.hours;
  let isLocationExplicitlyClosed = false;
  if (locationHours && Object.keys(locationHours).length > 0) {
    const dayOfWeek = selectedDate.format('dddd').toLowerCase();
    const dayHours = locationHours[dayOfWeek];
    if (dayHours) {
      if (dayHours.is_open) {
        // Normalize location hours to remove seconds precision
        const openTime = parseDateTimeInTz(selectedDate.format('YYYY-MM-DD'), dayHours.open_time, companyTimezone).format('HH:mm');
        const closeTime = parseDateTimeInTz(selectedDate.format('YYYY-MM-DD'), dayHours.close_time, companyTimezone).format('HH:mm');

        locationAvailability = [{
          start_time: openTime,
          end_time: closeTime,
          date: selectedDate.format('YYYY-MM-DD')
        }];
      } else {
        // Explicitly closed for this day
        isLocationExplicitlyClosed = true;
      }
    }
  }

  // If location explicitly marked closed for the day, return no availability regardless of coach/resource
  if (isLocationExplicitlyClosed) {
    return { availability: [], bookings: [] };
  }

  // Process coach availability if required
  if (service.requires_coach && coachData) {
    let coachAvailability = [];

    if (Array.isArray(coachData)) {
      // True availability events only
      coachAvailability = coachData.filter(event => {
        const id = event?.id;
        const title = event?.title;
        return (id && id.startsWith('avail_')) || title === 'Available' || title === 'Daily';
      });
      // Bookings = events with id starting with 'book_'
      allBookings = coachData.filter(event => event?.id && event.id.startsWith('book_'));
    } else if (coachData && typeof coachData === 'object') {
      const events = coachData.events || [];
      // True availability events only
      coachAvailability = events.filter(event => {
        const id = event?.id;
        const title = event?.title;
        return (id && id.startsWith('avail_')) || title === 'Available' || title === 'Daily';
      });
      // Bookings = events with id starting with 'book_'
      allBookings = events.filter(event => event?.id && event.id.startsWith('book_'));
    }

    // Also treat class sessions as busy events for conflict detection
    // This ensures class sessions block other service bookings' time slots
    try {
      const sourceEvents = Array.isArray(coachData)
        ? coachData
        : (coachData && typeof coachData === 'object')
          ? (coachData.events || [])
          : [];
      const classSessionsRaw = sourceEvents.filter(ev => {
        const evType = ev.type || ev.extendedProps?.type;
        return evType === EVENT_TYPES.CLASS_SESSION;
      });
      if (classSessionsRaw.length > 0) {
        const classSessions = classSessionsRaw.map(ev => {
          const startISO = ev.start || ev.start_time || ev.start_at;
          const endISO = ev.end || ev.end_time || ev.end_at;
          return {
            ...ev,
            // Normalize for conflict detector which looks at start/start_time and end/end_time
            start: startISO,
            end: endISO,
            start_time: ev.start_time || startISO,
            end_time: ev.end_time || endISO,
            // Ensure type is set
            type: ev.type || ev.extendedProps?.type || EVENT_TYPES.CLASS_SESSION
          };
        });
        allBookings = [...allBookings, ...classSessions];
      }
    } catch (e) {
      // swallow - non-fatal if coachData shape changes
    }

    // Handle resource requirements
    if (service.requires_resource && (selectedResource || resourcePool.length > 0)) {
      // Add resource bookings to conflict list
      allBookings = [...allBookings, ...(resourceBookings || [])];

      // For resources, assume they're available during location hours
      // If no location hours are configured, create a default availability window
      let resourceAvailability = locationAvailability.length > 0
        ? locationAvailability
        : coachAvailability.length > 0
          ? coachAvailability.map(slot => {
              // Normalize times to remove seconds precision
              // NOTE: Do NOT use .startOf('minute') — it strips timezone in Hermes.
              const sTime = dayjs(slot.start_time).tz(companyTimezone);
              const eTime = dayjs(slot.end_time).tz(companyTimezone);
              return {
                start_time: sTime.format('HH:mm'),
                end_time: eTime.format('HH:mm'),
                date: selectedDate.format('YYYY-MM-DD')
              };
            })
          : [{
              // Default fallback: 9 AM to 7 PM
              start_time: '09:00',
              end_time: '19:00',
              date: selectedDate.format('YYYY-MM-DD')
            }];

      // Find intersection of coach and resource availability
      if (coachAvailability.length > 0) {
        const intersectedAvailability = [];

        coachAvailability.forEach((coachSlot) => {
          resourceAvailability.forEach((resourceSlot) => {
            // Parse coach availability times
            const coachStart = dayjs(coachSlot.start_time || coachSlot.start).tz(companyTimezone);
            const coachEnd = dayjs(coachSlot.end_time || coachSlot.end).tz(companyTimezone);

            // Parse resource availability times
            let resourceStart, resourceEnd;
            if (resourceSlot.date && resourceSlot.start_time && !resourceSlot.start_time.includes('T')) {
              resourceStart = parseDateTimeInTz(resourceSlot.date, resourceSlot.start_time, companyTimezone);
              resourceEnd = parseDateTimeInTz(resourceSlot.date, resourceSlot.end_time, companyTimezone);
            } else {
              resourceStart = dayjs(resourceSlot.start_time || resourceSlot.start).tz(companyTimezone);
              resourceEnd = dayjs(resourceSlot.end_time || resourceSlot.end).tz(companyTimezone);
            }

            // Find overlap between coach and resource availability
            const overlapStart = coachStart.isAfter(resourceStart) ? coachStart : resourceStart;
            const overlapEnd = coachEnd.isBefore(resourceEnd) ? coachEnd : resourceEnd;

            // Only add if there's actual overlap
            if (overlapStart.isBefore(overlapEnd)) {
              intersectedAvailability.push({
                ...coachSlot,
                start_time: overlapStart.format(),
                end_time: overlapEnd.format(),
                start: overlapStart.format(),
                end: overlapEnd.format()
              });
            }
          });
        });

        availability = intersectedAvailability;
      } else if (service.requires_coach) {
        // Coach is required but has no availability - no slots should be generated
        availability = [];
      } else {
        // Resource-only service - use resource availability, let slot generation handle conflicts
        availability = resourceAvailability;
      }
    } else {
      // Coach required but no resource.
      // Only allow slots when BOTH the coach is available AND the location is open (intersection).
      if (coachAvailability.length === 0) {
        availability = [];
      } else if (locationAvailability.length === 0) {
        // If no explicit location hours, fall back to coach availability only
        availability = coachAvailability;
      } else {
        const intersected = [];
        const selectedDateStr = selectedDate.format('YYYY-MM-DD');
        coachAvailability.forEach((coachSlot) => {
          locationAvailability.forEach((locSlot) => {
            // Coach slot times (ISO)
            const coachStartRaw = coachSlot.start_time || coachSlot.start;
            const coachEndRaw = coachSlot.end_time || coachSlot.end;
            let coachStart, coachEnd;
            if (coachStartRaw && !String(coachStartRaw).includes('T') && !String(coachStartRaw).includes(' ')) {
              coachStart = parseDateTimeInTz(selectedDateStr, coachStartRaw, companyTimezone);
            } else {
              coachStart = dayjs(coachStartRaw).tz(companyTimezone);
            }
            if (coachEndRaw && !String(coachEndRaw).includes('T') && !String(coachEndRaw).includes(' ')) {
              coachEnd = parseDateTimeInTz(selectedDateStr, coachEndRaw, companyTimezone);
            } else {
              coachEnd = dayjs(coachEndRaw).tz(companyTimezone);
            }

            // Location slot times are day-bound strings HH:mm with a date
            let locStart, locEnd;
            if (locSlot.date && locSlot.start_time && !String(locSlot.start_time).includes('T')) {
              locStart = parseDateTimeInTz(locSlot.date, locSlot.start_time, companyTimezone);
              locEnd = parseDateTimeInTz(locSlot.date, locSlot.end_time, companyTimezone);
            } else {
              locStart = dayjs(locSlot.start_time || locSlot.start).tz(companyTimezone);
              locEnd = dayjs(locSlot.end_time || locSlot.end).tz(companyTimezone);
            }

            const overlapStart = coachStart.isAfter(locStart) ? coachStart : locStart;
            const overlapEnd = coachEnd.isBefore(locEnd) ? coachEnd : locEnd;

            if (overlapStart.isBefore(overlapEnd)) {
              intersected.push({
                ...coachSlot,
                start_time: overlapStart.format(),
                end_time: overlapEnd.format(),
                start: overlapStart.format(),
                end: overlapEnd.format(),
              });
            }
          });
        });
        availability = intersected;
      }
    }
  } else {
    // Service doesn't require coach, just use location hours
    availability = locationAvailability;

    // For resource-only services, still need to include resource bookings for conflict detection
    if (service.requires_resource && (selectedResource || resourcePool.length > 0) && resourceBookings) {
      allBookings = [...allBookings, ...resourceBookings];
    }
  }

  // Remove duplicate bookings
  const uniqueBookings = allBookings.filter((booking, index, self) => {
    const currentId = booking.id.toString().replace('book_', '');
    return index === self.findIndex(b => b.id.toString().replace('book_', '') === currentId);
  });

  return { availability, bookings: uniqueBookings };
};
