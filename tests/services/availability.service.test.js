import dayjs from 'dayjs';
import { getAvailableTimeSlots } from '../../src/services/availability.service';
import { getAvailabilityTimeslots } from '../../src/services/bookings.api';
import logger from '../../src/helpers/logger.helper';

jest.mock('../../src/services/bookings.api', () => ({
  getAvailabilityTimeslots: jest.fn(),
}));

jest.mock('../../src/utils/dayjs', () => ({
  getEffectiveTimezone: jest.fn(() => 'America/New_York'),
}));

jest.mock('../../src/helpers/timezone.helper', () => ({
  formatTimeInTz: jest.fn(() => '9:00 AM'),
}));

jest.mock('../../src/helpers/logger.helper', () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
  },
}));

describe('availability.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('forwards booking availability params and transforms backend slots', async () => {
    getAvailabilityTimeslots.mockResolvedValue({
      data: [
        {
          start_time: '2030-01-08T14:00:00.000Z',
          end_time: '2030-01-08T15:00:00.000Z',
          available_resource_ids: [8, 9],
        },
      ],
    });

    const slots = await getAvailableTimeSlots({
      service: { id: 7, requires_resource: true },
      coach: { id: 3 },
      selectedResource: { id: 8 },
      location: { id: 5 },
      selectedDate: dayjs('2030-01-08'),
      company: { timezone: 'America/New_York' },
      resourcePool: [{ id: 8 }, { id: 12 }],
      durationMinutes: 60,
      excludeBookingId: 44,
      clientId: 99,
    });

    expect(getAvailabilityTimeslots).toHaveBeenCalledWith({
      service_id: 7,
      location_id: 5,
      date: '2030-01-08',
      coach_ids: [3],
      resource_ids: [8],
      exclude_booking_id: 44,
      client_id: 99,
      duration_minutes: 60,
    }, { signal: undefined });

    expect(slots).toEqual([
      {
        id: 'slot_0900',
        start_time: '2030-01-08T14:00:00.000Z',
        end_time: '2030-01-08T15:00:00.000Z',
        display_time: '9:00 AM',
        date: '2030-01-08',
        available_resource_ids: ['8', '9'],
        capacity: 1,
      },
    ]);
  });

  test('returns an empty array for canceled availability requests', async () => {
    getAvailabilityTimeslots.mockRejectedValue({ code: 'ERR_CANCELED' });

    const slots = await getAvailableTimeSlots({
      service: { id: 7, requires_resource: false },
      coach: null,
      selectedResource: null,
      location: { id: 5 },
      selectedDate: dayjs('2030-01-08'),
      company: { timezone: 'America/New_York' },
    });

    expect(slots).toEqual([]);
    expect(logger.error).not.toHaveBeenCalled();
  });
});
