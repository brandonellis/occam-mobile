import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import CoachSelectionScreen from '../../src/screens/Booking/CoachSelectionScreen';
import { getCoaches } from '../../src/services/bookings.api';
import { getMyAllowedCoachesForService } from '../../src/services/accounts.api';
import useAuth from '../../src/hooks/useAuth';
import logger from '../../src/helpers/logger.helper';
import { SCREENS } from '../../src/constants/navigation.constants';

jest.mock('../../src/services/bookings.api', () => ({
  getCoaches: jest.fn(),
}));
jest.mock('../../src/services/accounts.api', () => ({
  getMyAllowedCoachesForService: jest.fn(),
}));
jest.mock('../../src/hooks/useAuth', () => jest.fn());
jest.mock('../../src/helpers/logger.helper', () => ({
  warn: jest.fn(),
  error: jest.fn(),
}));
jest.mock('../../src/components/ScreenHeader', () => {
  const { View, Text } = require('react-native');
  return (props) => (
    <View testID="screen-header">
      <Text>{props.title}</Text>
    </View>
  );
});
jest.mock('../../src/components/Avatar', () => {
  const { View } = require('react-native');
  return (props) => <View testID="avatar" />;
});
jest.mock('../../src/components/SkeletonLoader', () => {
  const { View } = require('react-native');
  return {
    ListSkeleton: (props) => <View testID="list-skeleton" />,
  };
});
jest.mock('../../src/components/BookingStepIndicator', () => {
  const { View } = require('react-native');
  return (props) => <View testID="step-indicator" />;
});
jest.mock('../../src/helpers/booking.navigation.helper', () => ({
  confirmCancelBooking: jest.fn(),
}));
jest.mock('../../src/helpers/booking.helper', () => ({
  getBookingSteps: jest.fn(() => ['ServiceSelection', 'CoachSelection', 'TimeSlotSelection']),
  getBookingStepIndex: jest.fn(() => 1),
}));

// --- Test data ---

const coachA = {
  id: 1,
  first_name: 'Alice',
  last_name: 'Smith',
  specialty: 'Putting',
  avatar_url: null,
  location_ids: [10],
};

const coachB = {
  id: 2,
  first_name: 'Bob',
  last_name: 'Jones',
  specialty: null,
  avatar_url: null,
  location_ids: [20],
};

const coachC = {
  id: 3,
  first_name: 'Carol',
  last_name: 'Lee',
  specialty: 'Driving',
  avatar_url: null,
  location_ids: [], // available everywhere
};

const allCoaches = [coachA, coachB, coachC];

const baseService = {
  id: 100,
  name: 'Private Lesson',
  restrict_coaches: false,
  coach_ids: [],
  location_ids: [],
};

const buildRoute = (overrides = {}) => ({
  params: {
    bookingData: {
      service: baseService,
      location: null,
      rebookCoachId: null,
      ...overrides,
    },
  },
});

const buildNavigation = () => ({
  navigate: jest.fn(),
  replace: jest.fn(),
  goBack: jest.fn(),
});

// --- Tests ---

describe('CoachSelectionScreen', () => {
  let navigation;

  beforeEach(() => {
    jest.clearAllMocks();
    navigation = buildNavigation();
    // Default: client role
    useAuth.mockReturnValue({ activeRole: 'client' });
    // Default: all coaches returned, no assignment restriction
    getCoaches.mockResolvedValue({ data: allCoaches });
    getMyAllowedCoachesForService.mockResolvedValue({ allowed_coach_ids: [] });
  });

  // 1. Renders loading state initially
  test('renders loading skeleton initially', () => {
    // Make getCoaches hang so loading remains true
    getCoaches.mockReturnValue(new Promise(() => {}));

    const { getByTestId } = render(
      <CoachSelectionScreen route={buildRoute()} navigation={navigation} />
    );

    expect(getByTestId('list-skeleton')).toBeTruthy();
  });

  // 2. Shows coaches after loading
  test('shows coaches after loading completes', async () => {
    const { getByText, getByTestId } = render(
      <CoachSelectionScreen route={buildRoute()} navigation={navigation} />
    );

    await waitFor(() => {
      expect(getByTestId('coach-selection-list')).toBeTruthy();
    });

    expect(getByText('Alice Smith')).toBeTruthy();
    expect(getByText('Bob Jones')).toBeTruthy();
    expect(getByText('Carol Lee')).toBeTruthy();
  });

  // 3. Staff role (coach) does NOT call getMyAllowedCoachesForService
  test('staff role skips coach-assignment filter', async () => {
    useAuth.mockReturnValue({ activeRole: 'coach' });

    const { getByTestId } = render(
      <CoachSelectionScreen route={buildRoute()} navigation={navigation} />
    );

    await waitFor(() => {
      expect(getByTestId('coach-selection-list')).toBeTruthy();
    });

    expect(getMyAllowedCoachesForService).not.toHaveBeenCalled();
  });

  // Also verify admin and owner skip the filter
  test.each(['admin', 'owner'])('%s role skips coach-assignment filter', async (role) => {
    useAuth.mockReturnValue({ activeRole: role });

    const { getByTestId } = render(
      <CoachSelectionScreen route={buildRoute()} navigation={navigation} />
    );

    await waitFor(() => {
      expect(getByTestId('coach-selection-list')).toBeTruthy();
    });

    expect(getMyAllowedCoachesForService).not.toHaveBeenCalled();
  });

  // 4. Client role DOES call getMyAllowedCoachesForService and filters coaches
  test('client role calls assignment API and filters to allowed coaches', async () => {
    useAuth.mockReturnValue({ activeRole: 'client' });
    getMyAllowedCoachesForService.mockResolvedValue({ allowed_coach_ids: [1, 3] });

    const { getByText, queryByText, getByTestId } = render(
      <CoachSelectionScreen route={buildRoute()} navigation={navigation} />
    );

    await waitFor(() => {
      expect(getByTestId('coach-selection-list')).toBeTruthy();
    });

    expect(getMyAllowedCoachesForService).toHaveBeenCalledWith(baseService.id);
    expect(getByText('Alice Smith')).toBeTruthy();
    expect(getByText('Carol Lee')).toBeTruthy();
    expect(queryByText('Bob Jones')).toBeNull();
  });

  // 5. Client role with empty allowed_coach_ids shows all coaches (unrestricted)
  test('client with empty allowed_coach_ids sees all coaches', async () => {
    useAuth.mockReturnValue({ activeRole: 'client' });
    getMyAllowedCoachesForService.mockResolvedValue({ allowed_coach_ids: [] });

    const { getByText, getByTestId } = render(
      <CoachSelectionScreen route={buildRoute()} navigation={navigation} />
    );

    await waitFor(() => {
      expect(getByTestId('coach-selection-list')).toBeTruthy();
    });

    expect(getMyAllowedCoachesForService).toHaveBeenCalledWith(baseService.id);
    expect(getByText('Alice Smith')).toBeTruthy();
    expect(getByText('Bob Jones')).toBeTruthy();
    expect(getByText('Carol Lee')).toBeTruthy();
  });

  // 6. Client role with assignment fetch failure shows all coaches (fail-open)
  test('client with assignment API failure sees all coaches (fail-open)', async () => {
    useAuth.mockReturnValue({ activeRole: 'client' });
    getMyAllowedCoachesForService.mockRejectedValue(new Error('Network error'));

    const { getByText, getByTestId } = render(
      <CoachSelectionScreen route={buildRoute()} navigation={navigation} />
    );

    await waitFor(() => {
      expect(getByTestId('coach-selection-list')).toBeTruthy();
    });

    // All coaches shown despite the error
    expect(getByText('Alice Smith')).toBeTruthy();
    expect(getByText('Bob Jones')).toBeTruthy();
    expect(getByText('Carol Lee')).toBeTruthy();

    // Logger.warn was called
    expect(logger.warn).toHaveBeenCalledWith(
      'Failed to fetch coach assignments, showing all coaches:',
      'Network error'
    );
  });

  // 7. Filters coaches by service.restrict_coaches + coach_ids
  test('filters coaches by service restrict_coaches and coach_ids', async () => {
    const restrictedService = {
      ...baseService,
      restrict_coaches: true,
      coach_ids: [1, 2], // only Alice and Bob
    };

    const { getByText, queryByText, getByTestId } = render(
      <CoachSelectionScreen
        route={buildRoute({ service: restrictedService })}
        navigation={navigation}
      />
    );

    await waitFor(() => {
      expect(getByTestId('coach-selection-list')).toBeTruthy();
    });

    expect(getByText('Alice Smith')).toBeTruthy();
    expect(getByText('Bob Jones')).toBeTruthy();
    expect(queryByText('Carol Lee')).toBeNull();
  });

  // 8a. Filters coaches by specific location
  test('filters coaches by specific location', async () => {
    const location = { id: 10 }; // only coachA has location_ids=[10]; coachC has [] (anywhere)

    const { getByText, queryByText, getByTestId } = render(
      <CoachSelectionScreen
        route={buildRoute({ location })}
        navigation={navigation}
      />
    );

    await waitFor(() => {
      expect(getByTestId('coach-selection-list')).toBeTruthy();
    });

    expect(getByText('Alice Smith')).toBeTruthy(); // location_ids includes 10
    expect(getByText('Carol Lee')).toBeTruthy();   // location_ids is empty → available everywhere
    expect(queryByText('Bob Jones')).toBeNull();    // location_ids=[20], doesn't include 10
  });

  // 8b. Filters coaches by service location_ids when no specific location selected
  test('filters coaches by service location_ids when no specific location', async () => {
    const serviceWithLocations = {
      ...baseService,
      location_ids: [20], // Bob's location
    };

    const { getByText, queryByText, getByTestId } = render(
      <CoachSelectionScreen
        route={buildRoute({ service: serviceWithLocations, location: null })}
        navigation={navigation}
      />
    );

    await waitFor(() => {
      expect(getByTestId('coach-selection-list')).toBeTruthy();
    });

    expect(getByText('Bob Jones')).toBeTruthy();    // location_ids=[20] overlaps
    expect(getByText('Carol Lee')).toBeTruthy();     // location_ids=[] → anywhere
    expect(queryByText('Alice Smith')).toBeNull();   // location_ids=[10], no overlap with [20]
  });

  // 9. Navigates to TIME_SLOT_SELECTION when coach is selected
  test('navigates to TIME_SLOT_SELECTION when a coach is pressed', async () => {
    const { getByTestId } = render(
      <CoachSelectionScreen route={buildRoute()} navigation={navigation} />
    );

    await waitFor(() => {
      expect(getByTestId('coach-selection-list')).toBeTruthy();
    });

    fireEvent.press(getByTestId('coach-card-1'));

    expect(navigation.navigate).toHaveBeenCalledWith(SCREENS.TIME_SLOT_SELECTION, {
      bookingData: expect.objectContaining({ coach: coachA }),
    });
  });

  // 10. Rebook auto-selects matching coach and uses navigation.replace
  test('auto-selects coach when rebookCoachId matches and uses replace', async () => {
    const route = buildRoute({ rebookCoachId: 2 });

    render(
      <CoachSelectionScreen route={route} navigation={navigation} />
    );

    await waitFor(() => {
      expect(navigation.replace).toHaveBeenCalledWith(SCREENS.TIME_SLOT_SELECTION, {
        bookingData: expect.objectContaining({ coach: coachB }),
      });
    });

    // rebookCoachId should be stripped from the forwarded bookingData
    const forwardedData = navigation.replace.mock.calls[0][1].bookingData;
    expect(forwardedData).not.toHaveProperty('rebookCoachId');
  });

  // 11. Shows error state when getCoaches fails
  test('shows error message and retry button when getCoaches fails', async () => {
    getCoaches.mockRejectedValue(new Error('Server error'));

    const { getByText } = render(
      <CoachSelectionScreen route={buildRoute()} navigation={navigation} />
    );

    await waitFor(() => {
      expect(getByText('Failed to load coaches.')).toBeTruthy();
    });

    expect(getByText('Retry')).toBeTruthy();
  });

  // 12. Retry button reloads coaches
  test('retry button triggers a reload', async () => {
    getCoaches.mockRejectedValueOnce(new Error('Server error'));
    getCoaches.mockResolvedValueOnce({ data: allCoaches });

    const { getByText, getByTestId } = render(
      <CoachSelectionScreen route={buildRoute()} navigation={navigation} />
    );

    await waitFor(() => {
      expect(getByText('Retry')).toBeTruthy();
    });

    fireEvent.press(getByText('Retry'));

    await waitFor(() => {
      expect(getByTestId('coach-selection-list')).toBeTruthy();
    });

    expect(getCoaches).toHaveBeenCalledTimes(2);
  });

  // 13. Shows "No coaches available" when coach list is empty after filters
  test('shows empty state when no coaches match filters', async () => {
    getCoaches.mockResolvedValue({ data: [] });

    const { getByText, getByTestId } = render(
      <CoachSelectionScreen route={buildRoute()} navigation={navigation} />
    );

    await waitFor(() => {
      expect(getByTestId('coach-selection-list')).toBeTruthy();
    });

    expect(getByText('No coaches available for this service.')).toBeTruthy();
  });

  // 14. Displays coach specialty when present
  test('displays coach specialty when present', async () => {
    const { getByText, getByTestId } = render(
      <CoachSelectionScreen route={buildRoute()} navigation={navigation} />
    );

    await waitFor(() => {
      expect(getByTestId('coach-selection-list')).toBeTruthy();
    });

    expect(getByText('Putting')).toBeTruthy();    // coachA
    expect(getByText('Driving')).toBeTruthy();    // coachC
  });
});
