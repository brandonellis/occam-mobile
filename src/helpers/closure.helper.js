/**
 * Mobile Closure Helpers
 *
 * Port of the web client's closureHelpers.js for React Native.
 * Uses native Date objects instead of dayjs to match the mobile app's conventions.
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

/**
 * Parse a local time string "HH:mm" or "HH:mm:ss" into { hours, minutes } components.
 */
const parseLocalTime = (timeStr) => {
  if (!timeStr) return { hours: 0, minutes: 0 };
  const parts = timeStr.split(':').map(Number);
  return { hours: parts[0] || 0, minutes: parts[1] || 0 };
};

/**
 * Build a Date for a specific date string + local time string.
 * @param {string} dateStr - "YYYY-MM-DD"
 * @param {string} timeStr - "HH:mm" or "HH:mm:ss"
 * @returns {Date}
 */
const buildDateTime = (dateStr, timeStr) => {
  const { hours, minutes } = parseLocalTime(timeStr);
  const d = new Date(`${dateStr}T00:00:00`);
  d.setHours(hours, minutes, 0, 0);
  return d;
};

/**
 * Check if two time ranges overlap.
 */
const hasOverlap = (startA, endA, startB, endB) => {
  return startA < endB && endA > startB;
};

/**
 * Check if a time slot is blocked by any active closure for a given service type.
 *
 * @param {Object} resource - Resource object with closures array
 * @param {string|Date} startTime - Slot start (ISO string or Date)
 * @param {string|Date} endTime - Slot end (ISO string or Date)
 * @param {string} serviceType - Service type to check (e.g., 'practice', 'lesson')
 * @returns {boolean} True if the slot is blocked by a closure
 */
export const isSlotBlockedByClosure = (resource, startTime, endTime, serviceType) => {
  if (!resource?.closures || !Array.isArray(resource.closures) || !serviceType) {
    return false;
  }

  const slotStart = new Date(startTime);
  const slotEnd = new Date(endTime);
  const slotDayOfWeek = slotStart.getDay(); // 0 = Sunday, 6 = Saturday
  const dateStr = `${slotStart.getFullYear()}-${String(slotStart.getMonth() + 1).padStart(2, '0')}-${String(slotStart.getDate()).padStart(2, '0')}`;

  for (const closure of resource.closures) {
    if (!closure.is_active) continue;

    const blockedTypes = closure.blocked_service_types || [];
    if (!blockedTypes.includes(serviceType)) continue;

    if (closure.closure_type === 'daily') {
      if (closure.day_of_week !== slotDayOfWeek) continue;

      const closureStartTime = closure.start_time_local || '00:00:00';
      const closureEndTime = closure.end_time_local || '23:59:59';

      const closureStart = buildDateTime(dateStr, closureStartTime);
      const closureEnd = buildDateTime(dateStr, closureEndTime);

      if (hasOverlap(slotStart.getTime(), slotEnd.getTime(), closureStart.getTime(), closureEnd.getTime())) {
        return true;
      }
    } else if (closure.closure_type === 'date_range') {
      const closureStart = new Date(closure.start_time_utc);
      const closureEnd = new Date(closure.end_time_utc);

      if (hasOverlap(slotStart.getTime(), slotEnd.getTime(), closureStart.getTime(), closureEnd.getTime())) {
        return true;
      }
    }
  }

  return false;
};

/**
 * Check if a resource is fully blocked for an entire day by closures.
 * A resource is "fully blocked" if its closures cover all operating hours
 * with no gap large enough for a minimum slot.
 *
 * @param {Object} resource - Resource object with closures array
 * @param {string} dateStr - "YYYY-MM-DD" of the selected date
 * @param {string} serviceType - Service type to check
 * @param {Object} locationHours - { open_time: "HH:mm", close_time: "HH:mm" }
 * @param {number} [minSlotMinutes=15] - Minimum slot duration in minutes
 * @returns {boolean} True if the resource has NO available time (should be hidden)
 */
export const isResourceFullyBlockedForDay = (resource, dateStr, serviceType, locationHours, minSlotMinutes = 15) => {
  if (!resource?.closures || !Array.isArray(resource.closures) || !serviceType) {
    return false;
  }

  const activeClosures = resource.closures.filter(
    (c) => c.is_active && (c.blocked_service_types || []).includes(serviceType)
  );

  if (activeClosures.length === 0) return false;

  const date = new Date(`${dateStr}T12:00:00`);
  const dayOfWeek = date.getDay();

  const openTime = locationHours?.open_time || '00:00';
  const closeTime = locationHours?.close_time || '23:59';

  const dayStart = buildDateTime(dateStr, openTime);
  const dayEnd = buildDateTime(dateStr, closeTime);

  // Collect all closure windows that apply to this day
  const closureWindows = [];

  for (const closure of activeClosures) {
    if (closure.closure_type === 'daily') {
      if (closure.day_of_week !== dayOfWeek) continue;

      const closureStartTime = closure.start_time_local || '00:00:00';
      const closureEndTime = closure.end_time_local || '23:59:59';

      closureWindows.push({
        start: buildDateTime(dateStr, closureStartTime),
        end: buildDateTime(dateStr, closureEndTime),
      });
    } else if (closure.closure_type === 'date_range') {
      const closureStart = new Date(closure.start_time_utc);
      const closureEnd = new Date(closure.end_time_utc);

      // Only include if it overlaps with this day's operating hours
      if (closureStart < dayEnd && closureEnd > dayStart) {
        closureWindows.push({
          start: closureStart < dayStart ? dayStart : closureStart,
          end: closureEnd > dayEnd ? dayEnd : closureEnd,
        });
      }
    }
  }

  if (closureWindows.length === 0) return false;

  // Sort by start time
  closureWindows.sort((a, b) => a.start.getTime() - b.start.getTime());

  // Merge overlapping windows
  const merged = [];
  for (const win of closureWindows) {
    if (merged.length === 0) {
      merged.push({ start: new Date(win.start), end: new Date(win.end) });
    } else {
      const last = merged[merged.length - 1];
      if (win.start.getTime() <= last.end.getTime()) {
        // Overlapping or adjacent — merge
        if (win.end.getTime() > last.end.getTime()) {
          last.end = new Date(win.end);
        }
      } else {
        merged.push({ start: new Date(win.start), end: new Date(win.end) });
      }
    }
  }

  // Check if there's any gap >= minSlotMinutes between closures
  let currentTime = dayStart.getTime();
  const minGapMs = minSlotMinutes * 60 * 1000;

  for (const win of merged) {
    const gapMs = win.start.getTime() - currentTime;
    if (gapMs >= minGapMs) {
      return false; // Found an available gap
    }
    currentTime = Math.max(currentTime, win.end.getTime());
  }

  // Check gap after last closure to end of day
  const finalGapMs = dayEnd.getTime() - currentTime;
  if (finalGapMs >= minGapMs) {
    return false;
  }

  return true; // Fully blocked
};

/**
 * Filter resources to exclude those fully blocked for a day.
 *
 * @param {Array} resources - Array of resource objects with closures
 * @param {string} dateStr - "YYYY-MM-DD" of the selected date
 * @param {string} serviceType - Service type to check
 * @param {Object} location - Location object with hours property
 * @returns {Array} Filtered array of resources not fully blocked
 */
export const filterResourcesNotFullyBlocked = (resources, dateStr, serviceType, location) => {
  if (!Array.isArray(resources) || !serviceType || !dateStr) {
    return resources || [];
  }

  // Get day name for the selected date
  const date = new Date(`${dateStr}T12:00:00`);
  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const dayHours = location?.hours?.[dayName] || location?.business_hours?.[dayName] || {};

  // If location is closed on this day, return empty
  if (dayHours.is_open === false) {
    return [];
  }

  const locationHours = {
    open_time: dayHours.open_time || '00:00',
    close_time: dayHours.close_time || '23:59',
  };

  return resources.filter(
    (resource) => !isResourceFullyBlockedForDay(resource, dateStr, serviceType, locationHours)
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
 * @param {Array} [params.resourcePool=[]] - Resource pool with closures data
 * @returns {Array} Filtered slots with updated available_resource_ids
 */
export const filterSlotsByClosures = (slots, { service, resourcePool = [] }) => {
  const serviceType = service?.service_type;
  if (!serviceType || resourcePool.length === 0) return slots;
  if (!Array.isArray(slots) || slots.length === 0) return slots;

  return slots.filter((slot) => {
    const slotStart = slot.start_time || slot.start;
    const slotEnd = slot.end_time || slot.end;

    // Filter available_resource_ids to only those not blocked by closures
    if (Array.isArray(slot.available_resource_ids) && slot.available_resource_ids.length > 0) {
      const nonBlockedIds = slot.available_resource_ids.filter((rid) => {
        const resource = resourcePool.find(
          (r) => (r.id || r.resource_id)?.toString() === rid?.toString()
        );
        if (!resource) return true; // Keep unknown resources (no closure data)
        return !isSlotBlockedByClosure(resource, slotStart, slotEnd, serviceType);
      });

      if (nonBlockedIds.length === 0) return false; // All resources blocked
      slot.available_resource_ids = nonBlockedIds;
    } else if (resourcePool.length > 0) {
      // No available_resource_ids yet — build from pool minus closures
      const available = resourcePool.filter(
        (r) => !isSlotBlockedByClosure(r, slotStart, slotEnd, serviceType)
      );
      if (available.length === 0) return false;
      slot.available_resource_ids = available.map((r) => r.id || r.resource_id);
    }

    return true;
  });
};
