import { SCREENS } from '../constants/navigation.constants';
import { isClassLike } from './normalizers.helper';

/**
 * Determine the next booking screen and params after location is resolved.
 * Centralizes the service-requirement branching logic used by both
 * ServiceSelectionScreen and LocationSelectionScreen.
 *
 * @param {Object} bookingData - Current booking data (must include service and location)
 * @param {boolean} isCoach - Whether the current user is a coach
 * @param {Object|null} user - The current user (used as coach when isCoach is true)
 * @returns {{ screen: string, params: Object }}
 */
export const getNextBookingScreen = (bookingData, isCoach, user) => {
  const service = bookingData.service;

  if (service?.is_variable_duration && service?.allowed_durations?.length > 0) {
    return { screen: SCREENS.DURATION_SELECTION, params: { bookingData } };
  }

  if (isClassLike(service)) {
    return {
      screen: SCREENS.TIME_SLOT_SELECTION,
      params: { bookingData: { ...bookingData, coach: null } },
    };
  }

  if (service?.requires_coach) {
    if (isCoach) {
      return {
        screen: SCREENS.TIME_SLOT_SELECTION,
        params: { bookingData: { ...bookingData, coach: user } },
      };
    }
    return { screen: SCREENS.COACH_SELECTION, params: { bookingData } };
  }

  return {
    screen: SCREENS.TIME_SLOT_SELECTION,
    params: { bookingData: { ...bookingData, coach: null } },
  };
};

/**
 * Resolve locations for a service from the full location list.
 * Returns the effective locations scoped to the service, with a fallback
 * to all locations when the service has no location_ids (legacy data).
 *
 * @param {Object} service - The selected service (with optional location_ids)
 * @param {Array} allLocations - All company locations
 * @returns {Array} The effective locations for the service
 */
export const getServiceLocations = (service, allLocations) => {
  const serviceLocationIds = service?.location_ids || [];
  if (serviceLocationIds.length > 0) {
    const matched = (allLocations || []).filter(loc => serviceLocationIds.includes(loc.id));
    return matched.length > 0 ? matched : allLocations || [];
  }
  return allLocations || [];
};
