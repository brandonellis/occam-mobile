/**
 * Mobile Closure Helpers
 *
 * Faithful port of occam-client/src/utils/closureHelpers.js for React Native.
 * Uses dayjs with timezone support matching the web client's implementation.
 *
 * NOTE: This module intentionally duplicates logic from the backend's
 * AvailabilityService.isBlockedByClosure() method. This duplication is by design:
 *
 * 1. Performance: Frontend filtering happens client-side without API calls.
 * 2. Backend remains authoritative: The backend still validates closures
 *    during booking creation, so this frontend filtering is purely for UX.
 *
 * If closure logic changes, update BOTH:
 * - Backend: app/Services/AvailabilityService.php -> isBlockedByClosure()
 * - Web client: src/utils/closureHelpers.js
 * - Mobile: this file
 */
import dayjs, { getEffectiveTimezone, parseDateTimeInTz } from '../utils/dayjs';

/**
 * Check if a time slot is blocked by any active closure for a given service type
 *
 * @param {Object} resource - Resource object with closures array
 * @param {string} startTime - ISO string or dayjs object for slot start
 * @param {string} endTime - ISO string or dayjs object for slot end
 * @param {string} serviceType - Service type to check (e.g., 'practice', 'lesson')
 * @param {string} tz - Timezone for local time comparisons
 * @returns {boolean} True if the slot is blocked by a closure
 */
export const isSlotBlockedByClosure = (resource, startTime, endTime, serviceType, tz = 'UTC') => {
  if (!resource?.closures || !Array.isArray(resource.closures) || !serviceType) {
    return false;
  }

  const slotStart = dayjs(startTime).tz(tz);
  const slotEnd = dayjs(endTime).tz(tz);
  const slotDayOfWeek = slotStart.day(); // 0 = Sunday, 6 = Saturday

  for (const closure of resource.closures) {
    // Skip inactive closures
    if (!closure.is_active) continue;

    // Check if this closure blocks the service type
    const blockedTypes = closure.blocked_service_types || [];
    if (!blockedTypes.includes(serviceType)) continue;

    if (closure.closure_type === 'daily') {
      // Daily closure - check day of week and time
      if (closure.day_of_week !== slotDayOfWeek) continue;

      // Parse closure times (stored as HH:mm:ss)
      const closureStartTime = closure.start_time_local || '00:00:00';
      const closureEndTime = closure.end_time_local || '23:59:59';

      const closureStart = parseDateTimeInTz(slotStart.format('YYYY-MM-DD'), closureStartTime, tz);
      const closureEnd = parseDateTimeInTz(slotStart.format('YYYY-MM-DD'), closureEndTime, tz);

      // Check for overlap
      if (slotStart.isBefore(closureEnd) && slotEnd.isAfter(closureStart)) {
        return true;
      }
    } else if (closure.closure_type === 'date_range') {
      // Date range closure - check if slot falls within the range
      const closureStart = dayjs(closure.start_time_utc);
      const closureEnd = dayjs(closure.end_time_utc);

      // Check for overlap
      if (slotStart.isBefore(closureEnd) && slotEnd.isAfter(closureStart)) {
        return true;
      }
    }
  }

  return false;
};

/**
 * Filter resources to exclude those blocked by closures for a given time and service type
 *
 * @param {Array} resources - Array of resource objects with closures
 * @param {string} startTime - ISO string or dayjs object for slot start
 * @param {string} endTime - ISO string or dayjs object for slot end
 * @param {string} serviceType - Service type to check
 * @param {string} tz - Timezone for local time comparisons
 * @returns {Array} Filtered array of resources not blocked by closures
 */
export const filterResourcesByClosures = (resources, startTime, endTime, serviceType, tz = 'UTC') => {
  if (!Array.isArray(resources) || !serviceType) {
    return resources;
  }

  return resources.filter(resource =>
    !isSlotBlockedByClosure(resource, startTime, endTime, serviceType, tz)
  );
};

/**
 * Check if a resource has any available time during operating hours
 * considering closures for a specific service type.
 *
 * @param {Object} resource - Resource object with closures array
 * @param {Object} selectedDate - dayjs object of the selected date
 * @param {string} serviceType - Service type to check
 * @param {Object} locationHours - Location operating hours { open_time: 'HH:mm', close_time: 'HH:mm' }
 * @param {string} tz - Timezone for local time comparisons
 * @param {number} minSlotMinutes - Minimum slot duration in minutes (default 15)
 * @returns {boolean} True if the resource has NO available time (should be hidden)
 */
export const isResourceFullyBlockedForDay = (resource, selectedDate, serviceType, locationHours, tz = 'UTC', minSlotMinutes = 15) => {
  if (!resource?.closures || !Array.isArray(resource.closures) || !serviceType) {
    return false;
  }

  const activeClosures = resource.closures.filter(closure =>
    closure.is_active &&
    (closure.blocked_service_types || []).includes(serviceType)
  );

  if (activeClosures.length === 0) {
    return false;
  }

  const dayOfWeek = selectedDate.day(); // 0 = Sunday, 6 = Saturday
  const dateStr = selectedDate.format('YYYY-MM-DD');

  // Get location operating hours for the day
  const openTime = locationHours?.open_time || '00:00';
  const closeTime = locationHours?.close_time || '23:59';

  const dayStart = parseDateTimeInTz(dateStr, openTime, tz);
  const dayEnd = parseDateTimeInTz(dateStr, closeTime, tz);

  // Collect all closure windows that apply to this day
  const closureWindows = [];

  for (const closure of activeClosures) {
    if (closure.closure_type === 'daily') {
      // Daily closure - check if it's for this day of week
      if (closure.day_of_week === dayOfWeek) {
        const closureStartTime = closure.start_time_local || '00:00:00';
        const closureEndTime = closure.end_time_local || '23:59:59';

        const closureStart = parseDateTimeInTz(dateStr, closureStartTime, tz);
        const closureEnd = parseDateTimeInTz(dateStr, closureEndTime, tz);

        closureWindows.push({ start: closureStart, end: closureEnd });
      }
    } else if (closure.closure_type === 'date_range') {
      // Date range closure - check if it overlaps with this day
      const closureStart = dayjs(closure.start_time_utc).tz(tz);
      const closureEnd = dayjs(closure.end_time_utc).tz(tz);

      // Only include if it overlaps with this day's operating hours
      if (closureStart.isBefore(dayEnd) && closureEnd.isAfter(dayStart)) {
        closureWindows.push({
          start: closureStart.isBefore(dayStart) ? dayStart : closureStart,
          end: closureEnd.isAfter(dayEnd) ? dayEnd : closureEnd
        });
      }
    }
  }

  if (closureWindows.length === 0) {
    return false;
  }

  // Sort closure windows by start time
  closureWindows.sort((a, b) => a.start.valueOf() - b.start.valueOf());

  // Merge overlapping closure windows
  const mergedWindows = [];
  for (const window of closureWindows) {
    if (mergedWindows.length === 0) {
      mergedWindows.push({ ...window });
    } else {
      const last = mergedWindows[mergedWindows.length - 1];
      if (window.start.isSameOrBefore(last.end)) {
        // Overlapping or adjacent - merge
        last.end = window.end.isAfter(last.end) ? window.end : last.end;
      } else {
        mergedWindows.push({ ...window });
      }
    }
  }

  // Check if there's any gap of at least minSlotMinutes between closures
  let currentTime = dayStart;

  for (const window of mergedWindows) {
    // Check gap before this closure window
    const gapMinutes = window.start.diff(currentTime, 'minute');
    if (gapMinutes >= minSlotMinutes) {
      // Found an available slot - resource is NOT fully blocked
      return false;
    }
    // Move current time to end of this closure
    currentTime = window.end.isAfter(currentTime) ? window.end : currentTime;
  }

  // Check gap after last closure to end of day
  const finalGapMinutes = dayEnd.diff(currentTime, 'minute');
  if (finalGapMinutes >= minSlotMinutes) {
    return false;
  }

  // No available slots found - resource is fully blocked
  return true;
};

/**
 * Filter resources to exclude those fully blocked for a day
 *
 * @param {Array} resources - Array of resource objects with closures
 * @param {Object} selectedDate - dayjs object of the selected date
 * @param {string} serviceType - Service type to check
 * @param {Object} location - Location object with business_hours
 * @param {string} tz - Timezone for local time comparisons
 * @returns {Array} Filtered array of resources not fully blocked
 */
export const filterResourcesNotFullyBlocked = (resources, selectedDate, serviceType, location, tz = 'UTC') => {
  if (!Array.isArray(resources) || !serviceType || !selectedDate) {
    return resources;
  }

  // Get location hours for the selected day
  const dayName = selectedDate.format('dddd').toLowerCase();
  const businessHours = location?.business_hours || location?.hours;
  const dayHours = businessHours?.[dayName] || {};

  // If location is closed on this day, return empty
  if (dayHours.is_open === false) {
    return [];
  }

  const locationHours = {
    open_time: dayHours.open_time || '00:00',
    close_time: dayHours.close_time || '23:59'
  };

  return resources.filter(resource =>
    !isResourceFullyBlockedForDay(resource, selectedDate, serviceType, locationHours, tz)
  );
};

/**
 * Filter time slots by resource closures.
 * For each slot, checks which resources from the pool are not blocked by closures.
 * Updates slot.available_resource_ids to only include non-blocked resources.
 * Removes slots where all resources are blocked.
 *
 * @param {Array} slots - Array of time slot objects
 * @param {Object} params
 * @param {Object} params.service - Service object with service_type
 * @param {Object} [params.selectedResource] - Explicitly selected resource
 * @param {Array} [params.resourcePool=[]] - Resource pool with closures data
 * @param {Object} [params.company] - Company object for timezone
 * @returns {Array} Filtered slots with updated available_resource_ids
 */
export const filterSlotsByClosures = (slots, { service, selectedResource, resourcePool = [], company }) => {
  const serviceType = service?.service_type;
  const tz = getEffectiveTimezone(company);
  if (!serviceType || (!selectedResource && resourcePool.length === 0)) return slots;
  if (!Array.isArray(slots) || slots.length === 0) return slots;

  return slots.filter(slot => {
    const slotStart = slot.start_time || slot.start;
    const slotEnd = slot.end_time || slot.end;
    if (selectedResource) {
      return !isSlotBlockedByClosure(selectedResource, slotStart, slotEnd, serviceType, tz);
    }
    if (resourcePool.length > 0) {
      const notBlockedIds = resourcePool
        .filter(r => !isSlotBlockedByClosure(r, slotStart, slotEnd, serviceType, tz))
        .map(r => r.id);
      if (notBlockedIds.length === 0) return false;
      // Intersect with existing available_resource_ids from booking-conflict filtering
      // to avoid re-adding resources that were already excluded as booked
      if (Array.isArray(slot.available_resource_ids) && slot.available_resource_ids.length > 0) {
        const existingSet = new Set(slot.available_resource_ids.map(id => id.toString()));
        slot.available_resource_ids = notBlockedIds.filter(id => existingSet.has(id.toString()));
      } else {
        slot.available_resource_ids = notBlockedIds;
      }
      if (slot.available_resource_ids.length === 0) return false;
    }
    return true;
  });
};
