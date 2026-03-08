import dayjs, { getEffectiveTimezone } from '../utils/dayjs';
import { getCoachSchedule, getBookingsCompact, getAvailabilityTimeslots } from './bookings.api';
import { processAvailabilityData, generateTimeSlots } from '../utils/timeSlotGenerator';
import { filterSlotsByClosures } from '../helpers/closure.helper';
import { formatTimeInTz } from '../helpers/timezone.helper';
import logger from '../helpers/logger.helper';

/**
 * Mobile Availability Service
 *
 * Backend-first: calls /availability/timeslots endpoint, falls back to
 * client-side generation if the backend call fails.
 *
 * Flow (backend-first):
 * 1. Call GET /availability/timeslots with service, location, date, coaches, resources
 * 2. Transform backend response to frontend slot shape
 * 3. Return slots
 *
 * Flow (fallback):
 * 1. Fetch coach schedule + resource bookings
 * 2. processAvailabilityData() + generateTimeSlots()
 * 3. filterSlotsByClosures()
 * 4. Return slots
 */

/**
 * Transform backend timeslot response into the frontend slot shape.
 * Backend: { start_time, end_time, available_coach_ids, available_resource_ids }
 * Frontend: { id, start_time, end_time, display_time, date, capacity?, available_resource_ids? }
 *
 * IMPORTANT: Uses formatTimeInTz (Intl.DateTimeFormat) for display_time
 * because dayjs .tz().format() is broken on Hermes.
 */
const transformBackendSlots = (backendSlots, selectedDate, company, resourcePool = []) => {
  const resourcePoolIds = Array.isArray(resourcePool)
    ? resourcePool.map(r => (r.id || r.resource_id)).filter(Boolean).map(id => id.toString())
    : [];

  return (backendSlots || []).map(slot => {
    // Hermes-safe display formatting via Intl.DateTimeFormat
    const displayTime = formatTimeInTz(slot.start_time, company);

    // Build a short ID from the UTC start_time — extract HHmm in company TZ
    // Use Intl-based parts extraction for Hermes safety
    const tz = getEffectiveTimezone(company);
    const startDate = new Date(slot.start_time);
    const hourStr = String(startDate.toLocaleString('en-US', { hour: '2-digit', hour12: false, timeZone: tz })).padStart(2, '0');
    const minStr = String(startDate.toLocaleString('en-US', { minute: '2-digit', timeZone: tz })).padStart(2, '0');
    const slotId = `slot_${hourStr}${minStr}`;

    const transformed = {
      id: slotId,
      start_time: slot.start_time,
      end_time: slot.end_time,
      display_time: displayTime,
      date: selectedDate.format('YYYY-MM-DD'),
    };

    // Include available_resource_ids for resource pool mode
    if (Array.isArray(slot.available_resource_ids) && slot.available_resource_ids.length > 0) {
      const availIds = slot.available_resource_ids.map(id => id.toString());
      transformed.available_resource_ids = availIds;
      // Capacity = how many pool resources are available for this slot
      if (resourcePoolIds.length > 0) {
        transformed.capacity = availIds.filter(id => resourcePoolIds.includes(id)).length;
      }
    }

    return transformed;
  });
};

/**
 * Client-side slot generation (legacy fallback).
 * Used when the backend timeslots endpoint is unavailable.
 */
const getTimeSlotsClientSide = async ({
  service, coach, selectedResource, location, selectedDate, company, resourcePool, durationMinutes
}) => {
  // IMPORTANT: Do NOT use .startOf('day') / .endOf('day') on tz-aware dayjs objects
  // in Hermes — it strips the timezone and reinterprets local digits as UTC.
  const tz = getEffectiveTimezone(company);
  const dateStr = selectedDate.format('YYYY-MM-DD');
  const dayStart = dayjs.tz(`${dateStr} 00:00`, 'YYYY-MM-DD HH:mm', tz);
  const dayEnd = dayjs.tz(`${dateStr} 23:59`, 'YYYY-MM-DD HH:mm', tz);

  const dateRange = {
    start: dayStart.utc().format(),
    end: dayEnd.utc().format()
  };

  let coachData = null;
  if (coach?.id) {
    coachData = await getCoachSchedule(coach.id, dateRange);
  }

  let resourceBookings = [];
  if (service.requires_resource) {
    const commonParams = {
      start_date: selectedDate.format('YYYY-MM-DD'),
      end_date: selectedDate.format('YYYY-MM-DD'),
      location_id: location.id
    };

    if (selectedResource?.id) {
      const resp = await getBookingsCompact({ ...commonParams, resource_ids: [selectedResource.id] });
      resourceBookings = resp?.data || [];
    } else if (Array.isArray(resourcePool) && resourcePool.length > 0) {
      const uniqueIds = Array.from(new Set(resourcePool.map(r => r.id || r.resource_id).filter(Boolean)));
      if (uniqueIds.length > 0) {
        const resp = await getBookingsCompact({ ...commonParams, resource_ids: uniqueIds });
        resourceBookings = resp?.data || [];
      }
    }
  }

  const { availability, bookings } = processAvailabilityData(
    service, coach, selectedResource, location, selectedDate, coachData, resourceBookings, company, resourcePool
  );

  let timeSlots;
  try {
    timeSlots = generateTimeSlots(availability, bookings, selectedDate, service, company, selectedResource, resourcePool, durationMinutes);
  } catch (error) {
    logger.warn('generateTimeSlots failed:', error.message);
    timeSlots = [];
  }

  timeSlots = filterSlotsByClosures(timeSlots, { service, selectedResource, resourcePool, company });
  return timeSlots;
};

/**
 * Fetch and process availability data for a booking
 *
 * @param {Object} params - Availability parameters
 * @param {Object} params.service - Service object
 * @param {Object} params.coach - Coach object (if required)
 * @param {Object} params.selectedResource - Resource object (if required)
 * @param {Object} params.location - Location object
 * @param {Object} params.selectedDate - dayjs object of selected date
 * @param {Object} params.company - Company object for timezone
 * @param {Array} params.resourcePool - Array of resources of the required type at location (auto-select mode)
 * @param {number|null} params.durationMinutes - Selected duration for variable-duration services
 * @returns {Promise<Array>} Array of available time slots
 */
export const getAvailableTimeSlots = async ({
  service,
  coach,
  selectedResource,
  location,
  selectedDate,
  company,
  resourcePool = [],
  durationMinutes = null,
  signal
}) => {
  try {
    // Build resource IDs for the backend call
    const resourceIds = [];
    if (service.requires_resource) {
      if (selectedResource?.id) {
        resourceIds.push(selectedResource.id);
      } else if (Array.isArray(resourcePool) && resourcePool.length > 0) {
        const uniqueIds = Array.from(new Set(resourcePool.map(r => r.id || r.resource_id).filter(Boolean)));
        resourceIds.push(...uniqueIds);
      }
    }

    // Backend-first: single API call replaces 2-3 calls + client-side processing
    const backendResult = await getAvailabilityTimeslots({
      service_id: service.id,
      location_id: location.id,
      date: selectedDate.format('YYYY-MM-DD'),
      coach_ids: coach?.id ? [coach.id] : [],
      resource_ids: resourceIds,
      ...(durationMinutes ? { duration_minutes: durationMinutes } : {}),
    });

    return transformBackendSlots(
      backendResult?.data || [],
      selectedDate,
      company,
      resourcePool
    );

  } catch (error) {
    // Silently ignore aborted requests
    if (error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError' || error?.name === 'AbortError') {
      return [];
    }

    // Fallback to client-side generation if backend endpoint fails
    logger.warn('[Timeslots] Backend endpoint failed, falling back to client-side generation:', error?.message);
    try {
      return await getTimeSlotsClientSide({
        service, coach, selectedResource, location, selectedDate, company, resourcePool, durationMinutes
      });
    } catch (fallbackError) {
      if (fallbackError?.code === 'ERR_CANCELED' || fallbackError?.name === 'CanceledError' || fallbackError?.name === 'AbortError') {
        return [];
      }
      logger.error('Availability service error (fallback also failed):', fallbackError);
      throw fallbackError;
    }
  }
};
