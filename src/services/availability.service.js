import dayjs, { getEffectiveTimezone } from '../utils/dayjs';
import { getCoachSchedule, getBookingsCompact } from './bookings.api';
import { processAvailabilityData, generateTimeSlots } from '../utils/timeSlotGenerator';
import { filterSlotsByClosures } from '../helpers/closure.helper';

/**
 * Mobile Availability Service
 *
 * Faithful port of occam-client/src/services/availabilityService.js.
 * Uses the same processAvailabilityData + generateTimeSlots pipeline as the web client.
 *
 * Flow:
 * 1. Fetch coach schedule (availability windows + bookings) if coach required
 * 2. Fetch resource bookings (via compact endpoint) if resource required
 * 3. processAvailabilityData() — intersect coach/location/resource availability
 * 4. generateTimeSlots() — produce candidate slots, filter conflicts
 * 5. filterSlotsByClosures() — remove closure-blocked slots
 * 6. Return array of available time slot objects
 */

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
    // Create date range for the selected date.
    // IMPORTANT: Do NOT use .startOf('day') / .endOf('day') on tz-aware dayjs objects
    // in Hermes — it strips the timezone and reinterprets local digits as UTC.
    // Instead, construct start/end of day explicitly in the company timezone.
    const tz = getEffectiveTimezone(company);
    const dateStr = selectedDate.format('YYYY-MM-DD');
    const dayStart = dayjs.tz(`${dateStr} 00:00`, 'YYYY-MM-DD HH:mm', tz);
    const dayEnd = dayjs.tz(`${dateStr} 23:59`, 'YYYY-MM-DD HH:mm', tz);

    const dateRange = {
      start: dayStart.utc().format(),
      end: dayEnd.utc().format()
    };

    // Get coach schedule data whenever a coach is provided so class sessions can block,
    // even for services that don't strictly require a coach.
    let coachData = null;
    if (coach?.id) {
      coachData = await getCoachSchedule(coach.id, dateRange);
    }

    // Get resource bookings if resource is required (selected or pool)
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

    // Use shared utility to process availability data and generate time slots
    const { availability, bookings } = processAvailabilityData(
      service,
      coach,
      selectedResource,
      location,
      selectedDate,
      coachData,
      resourceBookings,
      company,
      resourcePool
    );

    let timeSlots;
    try {
      timeSlots = generateTimeSlots(
        availability,
        bookings,
        selectedDate,
        service,
        company,
        selectedResource,
        resourcePool,
        durationMinutes
      );
    } catch (error) {
      console.warn('generateTimeSlots failed:', error.message);
      timeSlots = [];
    }

    // Filter out time slots blocked by resource closures
    timeSlots = filterSlotsByClosures(timeSlots, { service, selectedResource, resourcePool, company });

    return timeSlots;

  } catch (error) {
    // Silently ignore aborted requests
    if (error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError' || error?.name === 'AbortError') {
      return [];
    }
    console.error('Error fetching availability:', error);
    throw error;
  }
};
