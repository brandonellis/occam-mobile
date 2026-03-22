import {
  getBookingSteps,
  getBookingStepIndex,
  getNextBookingScreen,
  resolveLocationAndRoute,
  getServiceLocations,
} from '../../src/helpers/booking.helper';
import { SCREENS } from '../../src/constants/navigation.constants';

// ── getBookingSteps ──

describe('getBookingSteps', () => {
  const baseService = { id: 1, requires_coach: true };

  test('client flow includes coach selection for requires_coach service', () => {
    const steps = getBookingSteps({ service: baseService, isCoach: false });
    expect(steps).toContain(SCREENS.COACH_SELECTION);
  });

  test('coach flow skips coach selection (auto-assigns self)', () => {
    const steps = getBookingSteps({ service: baseService, isCoach: true });
    expect(steps).not.toContain(SCREENS.COACH_SELECTION);
  });

  test('class service skips coach selection even for client', () => {
    const classService = { ...baseService, service_type: 'class' };
    const steps = getBookingSteps({ service: classService, isCoach: false });
    expect(steps).not.toContain(SCREENS.COACH_SELECTION);
  });

  test('includes location step when hasMultipleLocations', () => {
    const steps = getBookingSteps({ service: baseService, hasMultipleLocations: true, isCoach: false });
    expect(steps).toContain(SCREENS.LOCATION_SELECTION);
  });

  test('includes duration step for variable duration services', () => {
    const variableService = { ...baseService, is_variable_duration: true, allowed_durations: [30, 60] };
    const steps = getBookingSteps({ service: variableService, isCoach: false });
    expect(steps).toContain(SCREENS.DURATION_SELECTION);
  });

  test('always starts with service selection and ends with confirmation', () => {
    const steps = getBookingSteps({ service: baseService, isCoach: false });
    expect(steps[0]).toBe(SCREENS.SERVICE_SELECTION);
    expect(steps[steps.length - 1]).toBe(SCREENS.BOOKING_CONFIRMATION);
  });
});

describe('getBookingStepIndex', () => {
  test('returns 1-based index', () => {
    const steps = [SCREENS.SERVICE_SELECTION, SCREENS.TIME_SLOT_SELECTION, SCREENS.BOOKING_CONFIRMATION];
    expect(getBookingStepIndex(SCREENS.TIME_SLOT_SELECTION, steps)).toBe(2);
  });

  test('returns null for unknown screen', () => {
    expect(getBookingStepIndex('NonExistent', [])).toBeNull();
  });
});

// ── getNextBookingScreen ──

describe('getNextBookingScreen', () => {
  const coachUser = { id: 10, first_name: 'Coach', last_name: 'A' };

  test('coach auto-assigns self and goes to time slot', () => {
    const service = { requires_coach: true };
    const { screen, params } = getNextBookingScreen({ service }, true, coachUser);
    expect(screen).toBe(SCREENS.TIME_SLOT_SELECTION);
    expect(params.bookingData.coach).toEqual(coachUser);
  });

  test('client goes to coach selection when service requires coach', () => {
    const service = { requires_coach: true };
    const { screen } = getNextBookingScreen({ service }, false, null);
    expect(screen).toBe(SCREENS.COACH_SELECTION);
  });

  test('class service goes to time slot with null coach', () => {
    const service = { requires_coach: true, service_type: 'class' };
    const { screen, params } = getNextBookingScreen({ service }, false, null);
    expect(screen).toBe(SCREENS.TIME_SLOT_SELECTION);
    expect(params.bookingData.coach).toBeNull();
  });

  test('variable duration goes to duration selection first', () => {
    const service = { is_variable_duration: true, allowed_durations: [30, 60] };
    const { screen } = getNextBookingScreen({ service }, false, null);
    expect(screen).toBe(SCREENS.DURATION_SELECTION);
  });

  test('service with no special requirements goes to time slot', () => {
    const service = { requires_coach: false };
    const { screen, params } = getNextBookingScreen({ service }, false, null);
    expect(screen).toBe(SCREENS.TIME_SLOT_SELECTION);
    expect(params.bookingData.coach).toBeNull();
  });
});

// ── resolveLocationAndRoute ──

describe('resolveLocationAndRoute', () => {
  const locations = [
    { id: 1, name: 'North' },
    { id: 2, name: 'South' },
    { id: 3, name: 'East' },
  ];
  const service = { id: 5, requires_coach: false, location_ids: [1, 2, 3] };

  test('coach with location_ids filters to their locations', () => {
    const coachUser = { id: 10, location_ids: [1] };
    const result = resolveLocationAndRoute({
      bookingData: { service },
      allLocations: locations,
      isCoach: true,
      user: coachUser,
    });
    // Only 1 location — auto-resolved
    expect(result.resolved).toBe(true);
    expect(result.bookingData.location).toEqual({ id: 1, name: 'North' });
  });

  test('client sees all service locations (no coach filtering)', () => {
    const result = resolveLocationAndRoute({
      bookingData: { service },
      allLocations: locations,
      isCoach: false,
      user: { id: 9 },
    });
    // 3 locations — not resolved, show picker
    expect(result.resolved).toBe(false);
    expect(result.serviceLocations).toHaveLength(3);
  });

  test('coach with no location_ids sees all service locations', () => {
    const coachUser = { id: 10, location_ids: [] };
    const result = resolveLocationAndRoute({
      bookingData: { service },
      allLocations: locations,
      isCoach: true,
      user: coachUser,
    });
    expect(result.resolved).toBe(false);
    expect(result.serviceLocations).toHaveLength(3);
  });

  test('single location auto-resolves for any role', () => {
    const singleLocService = { id: 5, requires_coach: false, location_ids: [2] };
    const result = resolveLocationAndRoute({
      bookingData: { service: singleLocService },
      allLocations: locations,
      isCoach: false,
      user: { id: 9 },
    });
    expect(result.resolved).toBe(true);
    expect(result.bookingData.location).toEqual({ id: 2, name: 'South' });
  });

  test('preferred location is honored when available', () => {
    const result = resolveLocationAndRoute({
      bookingData: { service },
      allLocations: locations,
      isCoach: false,
      user: { id: 9 },
      preferredLocationId: 2,
    });
    expect(result.resolved).toBe(true);
    expect(result.bookingData.location.id).toBe(2);
  });

  test('preferred location ignored if not in effective list', () => {
    const coachUser = { id: 10, location_ids: [1] };
    const result = resolveLocationAndRoute({
      bookingData: { service },
      allLocations: locations,
      isCoach: true,
      user: coachUser,
      preferredLocationId: 3, // coach not assigned to location 3
    });
    // Falls back to auto-resolve (only 1 effective location)
    expect(result.resolved).toBe(true);
    expect(result.bookingData.location.id).toBe(1);
  });
});

// ── getServiceLocations ──

describe('getServiceLocations', () => {
  const all = [{ id: 1 }, { id: 2 }, { id: 3 }];

  test('filters to service location_ids', () => {
    expect(getServiceLocations({ location_ids: [1, 3] }, all)).toEqual([{ id: 1 }, { id: 3 }]);
  });

  test('returns all when service has no location_ids', () => {
    expect(getServiceLocations({}, all)).toEqual(all);
  });

  test('returns all when no matched ids (fallback)', () => {
    expect(getServiceLocations({ location_ids: [999] }, all)).toEqual(all);
  });
});
