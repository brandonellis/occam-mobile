import { buildBookingPayload, buildUpdatePayload } from '../../src/helpers/bookingPayload.helpers';

const baseParams = {
  clientId: 9,
  isMembershipBooking: false,
  isPackageBooking: false,
  location: { id: 2 },
  service: { id: 5 },
  coach: { id: 1 },
  timeSlot: { start_time: '2026-03-22T10:00:00', end_time: '2026-03-22T11:00:00' },
  bookingData: {},
  membershipStatus: null,
  packageBenefit: null,
  bookingNotes: '',
  selectedResource: null,
};

describe('buildBookingPayload', () => {
  test('builds basic one-off booking payload', () => {
    const payload = buildBookingPayload(baseParams);

    expect(payload.client_id).toBe(9);
    expect(payload.booking_type).toBe('one_off');
    expect(payload.location_id).toBe(2);
    expect(payload.service_ids).toEqual([5]);
    expect(payload.start_time).toBe('2026-03-22T10:00:00');
    expect(payload.end_time).toBe('2026-03-22T11:00:00');
    expect(payload.status).toBe('confirmed');
    expect(payload.notes).toBe('');
  });

  test('uses pending status when specified', () => {
    const payload = buildBookingPayload(baseParams, 'pending');
    expect(payload.status).toBe('pending');
  });

  test('sets booking_type to membership', () => {
    const payload = buildBookingPayload({ ...baseParams, isMembershipBooking: true });
    expect(payload.booking_type).toBe('membership');
  });

  test('sets booking_type to package', () => {
    const payload = buildBookingPayload({ ...baseParams, isPackageBooking: true });
    expect(payload.booking_type).toBe('package');
  });

  test('membership takes precedence over package', () => {
    const payload = buildBookingPayload({ ...baseParams, isMembershipBooking: true, isPackageBooking: true });
    expect(payload.booking_type).toBe('membership');
  });

  test('sets bookable to coach when coach has id', () => {
    const payload = buildBookingPayload(baseParams);
    expect(payload.bookable_type).toBe('App\\Models\\User');
    expect(payload.bookable_id).toBe(1);
  });

  test('sets bookable to service when no coach', () => {
    const payload = buildBookingPayload({ ...baseParams, coach: null });
    expect(payload.bookable_type).toBe('App\\Models\\Service');
    expect(payload.bookable_id).toBe(5);
  });

  test('includes resource_ids when selectedResource exists', () => {
    const payload = buildBookingPayload({ ...baseParams, selectedResource: { id: 10 } });
    expect(payload.resource_ids).toEqual([10]);
  });

  test('omits resource_ids when no selectedResource', () => {
    const payload = buildBookingPayload(baseParams);
    expect(payload.resource_ids).toBeUndefined();
  });

  test('includes duration_minutes for variable duration services', () => {
    const payload = buildBookingPayload({
      ...baseParams,
      service: { id: 5, is_variable_duration: true },
      bookingData: { duration_minutes: 45 },
    });
    expect(payload.duration_minutes).toBe(45);
  });

  test('omits duration_minutes for fixed duration services', () => {
    const payload = buildBookingPayload({
      ...baseParams,
      bookingData: { duration_minutes: 45 },
    });
    expect(payload.duration_minutes).toBeUndefined();
  });

  test('includes membership IDs for membership bookings', () => {
    const payload = buildBookingPayload({
      ...baseParams,
      isMembershipBooking: true,
      membershipStatus: { membershipId: 100, membershipPlanServiceId: 200 },
    });
    expect(payload.membership_subscription_id).toBe(100);
    expect(payload.membership_plan_service_id).toBe(200);
  });

  test('includes client_package_id for package bookings', () => {
    const payload = buildBookingPayload({
      ...baseParams,
      isPackageBooking: true,
      packageBenefit: { client_package_id: 50 },
    });
    expect(payload.client_package_id).toBe(50);
  });

  test('includes class_session_id when present', () => {
    const payload = buildBookingPayload({
      ...baseParams,
      bookingData: { selectedClassSession: { id: 77 } },
    });
    expect(payload.class_session_id).toBe(77);
  });

  test('includes booking notes', () => {
    const payload = buildBookingPayload({ ...baseParams, bookingNotes: 'Please bring clubs' });
    expect(payload.notes).toBe('Please bring clubs');
  });
});

describe('buildUpdatePayload', () => {
  const baseUpdateParams = {
    bookingNotes: 'Updated notes',
    bookingStatus: 'confirmed',
    timeSlot: { start_time: '2026-03-22T14:00:00', end_time: '2026-03-22T15:00:00' },
    selectedResource: null,
    isStaffEditor: false,
    service: { id: 5 },
    location: { id: 2 },
    client: { id: 9 },
    coach: { id: 1 },
  };

  test('builds basic update payload for client', () => {
    const payload = buildUpdatePayload(baseUpdateParams);

    expect(payload.notes).toBe('Updated notes');
    expect(payload.status).toBe('confirmed');
    expect(payload.start_time).toBe('2026-03-22T14:00:00');
    expect(payload.end_time).toBe('2026-03-22T15:00:00');
    expect(payload.resource_ids).toEqual([]);
  });

  test('includes resource_ids when selectedResource exists', () => {
    const payload = buildUpdatePayload({ ...baseUpdateParams, selectedResource: { id: 10 } });
    expect(payload.resource_ids).toEqual([10]);
  });

  test('client payload does not include staff-specific fields', () => {
    const payload = buildUpdatePayload(baseUpdateParams);
    expect(payload.service_ids).toBeUndefined();
    expect(payload.location_id).toBeUndefined();
    expect(payload.client_id).toBeUndefined();
    expect(payload.coach_ids).toBeUndefined();
  });

  test('staff editor payload includes all staff-specific fields', () => {
    const payload = buildUpdatePayload({ ...baseUpdateParams, isStaffEditor: true });

    expect(payload.service_ids).toEqual([5]);
    expect(payload.location_id).toBe(2);
    expect(payload.client_id).toBe(9);
    expect(payload.coach_ids).toEqual([1]);
  });

  test('staff editor with no coach sets empty coach_ids', () => {
    const payload = buildUpdatePayload({ ...baseUpdateParams, isStaffEditor: true, coach: {} });
    expect(payload.coach_ids).toEqual([]);
  });

  test('staff editor with no service omits service_ids', () => {
    const payload = buildUpdatePayload({ ...baseUpdateParams, isStaffEditor: true, service: {} });
    expect(payload.service_ids).toBeUndefined();
  });

  test('defaults notes to empty string', () => {
    const payload = buildUpdatePayload({ ...baseUpdateParams, bookingNotes: null });
    expect(payload.notes).toBe('');
  });
});
