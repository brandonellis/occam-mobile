import { getEffectiveTimezone } from '../utils/dayjs';
import { getAvailabilityTimeslots } from './bookings.api';
import { formatTimeInTz } from '../helpers/timezone.helper';
import logger from '../helpers/logger.helper';

/**
 * Mobile Availability Service
 *
 * All time slot generation is handled by the backend via /availability/timeslots.
 * This service transforms the backend response into the frontend slot shape.
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

  const tz = getEffectiveTimezone(company);

  return (backendSlots || []).map(slot => {
    // Hermes-safe display formatting via Intl.DateTimeFormat
    const displayTime = formatTimeInTz(slot.start_time, company);

    // Build a short ID from the UTC start_time — extract HHmm in company TZ
    // Use Intl-based parts extraction for Hermes safety
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
  excludeBookingId = null,
  clientId = null,
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

    const backendResult = await getAvailabilityTimeslots({
      service_id: service.id,
      location_id: location.id,
      date: selectedDate.format('YYYY-MM-DD'),
      coach_ids: coach?.id ? [coach.id] : [],
      resource_ids: resourceIds,
      ...(excludeBookingId ? { exclude_booking_id: excludeBookingId } : {}),
      ...(clientId ? { client_id: clientId } : {}),
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
    logger.error('[Timeslots] Backend endpoint failed:', error?.message);
    throw error;
  }
};
