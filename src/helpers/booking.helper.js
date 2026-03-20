import { SCREENS } from '../constants/navigation.constants';
import { isClassLike } from './normalizers.helper';

/**
 * Compute the ordered list of booking flow steps for a given service configuration.
 * Returns string[] — the ordered screen names.
 * Each screen can call getBookingStepIndex(screenName, steps) to find its position.
 */
export const getBookingSteps = ({ service, hasMultipleLocations = false, isCoach = false }) => {
  const steps = [SCREENS.SERVICE_SELECTION];
  if (hasMultipleLocations) steps.push(SCREENS.LOCATION_SELECTION);
  if (service?.is_variable_duration && service?.allowed_durations?.length > 0) {
    steps.push(SCREENS.DURATION_SELECTION);
  }
  if (service?.requires_coach && !isCoach && !isClassLike(service)) {
    steps.push(SCREENS.COACH_SELECTION);
  }
  steps.push(SCREENS.TIME_SLOT_SELECTION);
  steps.push(SCREENS.BOOKING_CONFIRMATION);
  return steps;
};

export const getBookingStepIndex = (screenName, steps) => {
  const idx = steps.indexOf(screenName);
  return idx >= 0 ? idx + 1 : null;
};

export const getSessionCoaches = (booking) => {
  if (Array.isArray(booking?.coaches) && booking.coaches.length > 0) {
    return booking.coaches;
  }
  if (booking?.coach) {
    return [booking.coach];
  }
  return [];
};

export const getSessionServices = (booking) => {
  if (Array.isArray(booking?.services) && booking.services.length > 0) {
    return booking.services;
  }
  if (booking?.service) {
    return [booking.service];
  }
  return [];
};

export const getSessionCoachNames = (booking) => {
  return getSessionCoaches(booking)
    .map((coach) => `${coach.first_name || ''} ${coach.last_name || ''}`.trim())
    .filter(Boolean)
    .join(', ');
};

export const getSessionServiceName = (booking) => {
  const services = getSessionServices(booking);
  return services.map((service) => service.name).filter(Boolean).join(', ') || 'Session';
};

export const getSessionResourceNames = (booking) => {
  return (Array.isArray(booking?.resources) ? booking.resources : [])
    .map((resource) => resource?.name)
    .filter(Boolean)
    .join(', ');
};

export const matchesCoach = (booking, coachId) => {
  if (!coachId) return true;
  return getSessionCoaches(booking).some((coach) => coach.id === coachId);
};

export const matchesService = (booking, serviceId) => {
  if (!serviceId) return true;
  return getSessionServices(booking).some((service) => service.id === serviceId);
};

export const matchesLocation = (booking, locationId) => {
  if (!locationId) return true;
  return booking?.location?.id === locationId;
};

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

/**
 * Resolve the effective locations for a service (intersected with coach
 * locations when applicable), auto-set the location if only one exists,
 * and return a navigation target.
 *
 * Returns one of:
 *   { resolved: true, bookingData, screen, params }   – location resolved, navigate to next screen
 *   { resolved: false, bookingData, serviceLocations } – multiple locations, show picker
 *
 * @param {Object} opts
 * @param {Object} opts.bookingData - Current bookingData (must include service; location will be set)
 * @param {Array}  opts.allLocations - Full company location list
 * @param {boolean} opts.isCoach
 * @param {Object|null} opts.user
 * @param {number|null} [opts.preferredLocationId] - Optional hint to prefer a specific location
 */
export const resolveLocationAndRoute = ({ bookingData, allLocations, isCoach, user, preferredLocationId = null }) => {
  const service = bookingData.service;
  const updatedData = { ...bookingData, location: null };

  const serviceLocations = getServiceLocations(service, allLocations);
  const coachLocationIds = isCoach ? (user?.location_ids || []) : [];
  const effectiveLocations = coachLocationIds.length > 0
    ? serviceLocations.filter((loc) => coachLocationIds.includes(loc.id))
    : serviceLocations;

  // Try preferred location first
  if (preferredLocationId) {
    const preferred = effectiveLocations.find((loc) => loc.id === preferredLocationId);
    if (preferred) updatedData.location = preferred;
  }

  // Fall back to single-location auto-set
  if (!updatedData.location && effectiveLocations.length === 1) {
    updatedData.location = effectiveLocations[0];
  }

  if (updatedData.location) {
    const { screen, params } = getNextBookingScreen(updatedData, isCoach, user);
    return { resolved: true, bookingData: updatedData, screen, params };
  }

  if (effectiveLocations.length > 1) {
    return {
      resolved: false,
      bookingData: updatedData,
      serviceLocations: effectiveLocations,
    };
  }

  // No locations — proceed anyway
  const { screen, params } = getNextBookingScreen(updatedData, isCoach, user);
  return { resolved: true, bookingData: updatedData, screen, params };
};
