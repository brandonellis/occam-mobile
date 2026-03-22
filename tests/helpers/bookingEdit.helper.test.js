import {
  canEditBooking,
  isStaffBookingRole,
  getBookingEditEntryScreen,
  isPastBooking,
  getBookingCoachIds,
} from '../../src/helpers/bookingEdit.helper';
import { SCREENS } from '../../src/constants/navigation.constants';

// Future booking shared across tests
const futureTime = new Date(Date.now() + 86400000).toISOString(); // +1 day

const makeBooking = (overrides = {}) => ({
  id: 1,
  start_time: futureTime,
  services: [{ id: 5, name: 'Lesson', service_type: 'private' }],
  coaches: [{ id: 10, first_name: 'Coach', last_name: 'A' }],
  ...overrides,
});

describe('canEditBooking', () => {
  // ── Staff roles can edit any booking ──

  test('admin can edit any future booking', () => {
    expect(canEditBooking({
      booking: makeBooking(),
      activeRole: 'admin',
      user: { id: 99, roles: ['admin'] },
    })).toBe(true);
  });

  test('owner can edit any future booking', () => {
    expect(canEditBooking({
      booking: makeBooking(),
      activeRole: 'owner',
      user: { id: 99, roles: ['owner'] },
    })).toBe(true);
  });

  test('staff can edit any future booking', () => {
    expect(canEditBooking({
      booking: makeBooking(),
      activeRole: 'staff',
      user: { id: 99, roles: ['staff'] },
    })).toBe(true);
  });

  // ── Coach can only edit own bookings ──

  test('coach can edit booking where they are assigned', () => {
    expect(canEditBooking({
      booking: makeBooking({ coaches: [{ id: 10 }] }),
      activeRole: 'coach',
      user: { id: 10, roles: ['coach'] },
    })).toBe(true);
  });

  test('coach CANNOT edit another coach\'s booking', () => {
    expect(canEditBooking({
      booking: makeBooking({ coaches: [{ id: 10 }] }),
      activeRole: 'coach',
      user: { id: 20, roles: ['coach'] },
    })).toBe(false);
  });

  test('coach CANNOT edit booking with no coaches', () => {
    expect(canEditBooking({
      booking: makeBooking({ coaches: [] }),
      activeRole: 'coach',
      user: { id: 10, roles: ['coach'] },
    })).toBe(false);
  });

  // ── Client cannot edit bookings ──

  test('client cannot edit bookings', () => {
    expect(canEditBooking({
      booking: makeBooking(),
      activeRole: 'client',
      user: { id: 9, roles: ['client'] },
    })).toBe(false);
  });

  // ── Guard conditions ──

  test('past booking cannot be edited by anyone', () => {
    const pastTime = new Date(Date.now() - 86400000).toISOString();
    expect(canEditBooking({
      booking: makeBooking({ start_time: pastTime }),
      activeRole: 'admin',
      user: { id: 99, roles: ['admin'] },
    })).toBe(false);
  });

  test('class booking cannot be edited', () => {
    expect(canEditBooking({
      booking: makeBooking({
        services: [{ id: 5, service_type: 'class' }],
      }),
      activeRole: 'admin',
      user: { id: 99, roles: ['admin'] },
    })).toBe(false);
  });

  test('group booking cannot be edited', () => {
    expect(canEditBooking({
      booking: makeBooking({
        services: [{ id: 5, service_type: 'group' }],
      }),
      activeRole: 'admin',
      user: { id: 99, roles: ['admin'] },
    })).toBe(false);
  });

  test('booking with no id cannot be edited', () => {
    expect(canEditBooking({
      booking: { ...makeBooking(), id: undefined },
      activeRole: 'admin',
      user: { id: 99, roles: ['admin'] },
    })).toBe(false);
  });

  // ── Multi-role users ──

  test('user with both coach and admin roles treated as staff', () => {
    expect(canEditBooking({
      booking: makeBooking({ coaches: [{ id: 999 }] }),
      activeRole: 'admin',
      user: { id: 10, roles: ['admin', 'coach'] },
    })).toBe(true); // admin trumps coach restriction
  });
});

describe('isPastBooking', () => {
  test('future booking is not past', () => {
    expect(isPastBooking({ start_time: futureTime })).toBe(false);
  });

  test('past booking is past', () => {
    expect(isPastBooking({ start_time: '2020-01-01T00:00:00Z' })).toBe(true);
  });

  test('missing start_time treated as past', () => {
    expect(isPastBooking({})).toBe(true);
  });
});

describe('getBookingCoachIds', () => {
  test('extracts coach ids from coaches array', () => {
    expect(getBookingCoachIds({ coaches: [{ id: 1 }, { id: 2 }] })).toEqual([1, 2]);
  });

  test('extracts from single coach fallback', () => {
    expect(getBookingCoachIds({ coach: { id: 3 } })).toEqual([3]);
  });

  test('returns empty for no coaches', () => {
    expect(getBookingCoachIds({})).toEqual([]);
  });
});

describe('isStaffBookingRole', () => {
  test('admin is staff', () => expect(isStaffBookingRole('admin')).toBe(true));
  test('owner is staff', () => expect(isStaffBookingRole('owner')).toBe(true));
  test('staff is staff', () => expect(isStaffBookingRole('staff')).toBe(true));
  test('coach is NOT staff', () => expect(isStaffBookingRole('coach')).toBe(false));
  test('client is NOT staff', () => expect(isStaffBookingRole('client')).toBe(false));
});

describe('getBookingEditEntryScreen', () => {
  test('staff enters at client selection', () => {
    expect(getBookingEditEntryScreen('admin')).toBe(SCREENS.CLIENT_SELECTION);
  });

  test('coach enters at time slot selection', () => {
    expect(getBookingEditEntryScreen('coach')).toBe(SCREENS.TIME_SLOT_SELECTION);
  });

  test('client enters at time slot selection', () => {
    expect(getBookingEditEntryScreen('client')).toBe(SCREENS.TIME_SLOT_SELECTION);
  });
});
