import { renderHook, act, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import useClientDetail from '../../src/hooks/useClientDetail';
import { getClient, getClientSharedMedia, shareMediaWithClient, getClientActivities as getClientActivitiesAccounts } from '../../src/services/accounts.api';
import { getBookings } from '../../src/services/bookings.api';
import { getClientActivities } from '../../src/services/activity.api';

jest.mock('../../src/services/accounts.api', () => ({
  getClient: jest.fn(),
  getClientPerformanceCurriculum: jest.fn().mockResolvedValue({ data: [] }),
  getClientSharedMedia: jest.fn().mockResolvedValue({ data: [] }),
  getClientPerformanceSnapshots: jest.fn().mockResolvedValue({ data: [] }),
  shareMediaWithClient: jest.fn(),
  unshareMediaFromClient: jest.fn(),
  createPerformanceSnapshot: jest.fn(),
}));

jest.mock('../../src/services/bookings.api', () => ({
  getBookings: jest.fn(),
}));

jest.mock('../../src/services/activity.api', () => ({
  getClientActivities: jest.fn().mockResolvedValue({ data: [] }),
}));

jest.mock('../../src/helpers/marshalIntent.helper', () => ({
  buildClientMarshalIntent: jest.fn(() => ({ message: 'mock intent' })),
}));

const mockDeliverIntent = jest.fn();
jest.mock('../../src/hooks/useMarshalIntent', () => jest.fn(() => ({
  deliverIntent: mockDeliverIntent,
})));

jest.mock('../../src/helpers/logger.helper', () => ({
  warn: jest.fn(),
  log: jest.fn(),
}));

jest.spyOn(Alert, 'alert').mockImplementation(() => {});

// Store focus callbacks so we can trigger them inside act()
let focusCallbacks = [];
const mockParentNavigation = { navigate: jest.fn() };
const mockNavigation = {
  addListener: jest.fn((event, cb) => {
    if (event === 'focus') focusCallbacks.push(cb);
    return jest.fn();
  }),
  navigate: jest.fn(),
  getParent: jest.fn(() => mockParentNavigation),
};

const mockCompany = { id: 1, timezone: 'America/New_York' };

// Helper: render the hook and trigger focus inside act()
const renderAndLoad = async (clientId = 42) => {
  const hook = renderHook(() =>
    useClientDetail({ clientId, navigation: mockNavigation, company: mockCompany }),
  );

  // Trigger the focus listener inside act
  await act(async () => {
    focusCallbacks.forEach((cb) => cb());
  });

  await waitFor(() => {
    expect(hook.result.current.isLoading).toBe(false);
  });

  return hook;
};

describe('useClientDetail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    focusCallbacks = [];
    getClient.mockResolvedValue({ data: { id: 42, first_name: 'Tiger', last_name: 'Woods', email: 'tiger@golf.com' } });
    getBookings.mockResolvedValue({ data: [] });
  });

  test('loads client and bookings on mount via focus listener', async () => {
    const { result } = await renderAndLoad();

    expect(getClient).toHaveBeenCalledWith(42);
    expect(getBookings).toHaveBeenCalledWith({ client_id: 42, per_page: 25, status: 'all' });
    expect(result.current.client).toEqual(
      expect.objectContaining({ id: 42, first_name: 'Tiger' }),
    );
  });

  test('separates upcoming and past bookings', async () => {
    const future = new Date(Date.now() + 86400000).toISOString();
    const past = new Date(Date.now() - 86400000).toISOString();

    getBookings.mockResolvedValue({
      data: [
        { id: 1, start_time: future },
        { id: 2, start_time: past },
        { id: 3, start_time: future },
      ],
    });

    const { result } = await renderAndLoad();

    expect(result.current.upcomingBookings).toHaveLength(2);
    expect(result.current.pastBookings).toHaveLength(1);
  });

  test('toggleSection triggers lazy load on first expand', async () => {
    getClientActivities.mockResolvedValue({ data: [{ id: 'a1' }], meta: { total: 1 } });

    const { result } = await renderAndLoad();

    await act(async () => {
      result.current.toggleSection('activity');
    });

    await waitFor(() => {
      expect(getClientActivities).toHaveBeenCalledWith(42, { per_page: 10 });
    });

    expect(result.current.expandedSections.activity).toBe(true);
  });

  test('handleShareMedia calls API and refreshes resources', async () => {
    shareMediaWithClient.mockResolvedValue({});
    getClientSharedMedia.mockResolvedValue({ data: [{ id: 1 }] });

    const { result } = await renderAndLoad();

    await act(async () => {
      await result.current.handleShareMedia({ upload_id: 10, notes: 'test' });
    });

    expect(shareMediaWithClient).toHaveBeenCalledWith(42, { upload_id: 10, notes: 'test' });
  });

  test('handleShareMedia shows 409 conflict message', async () => {
    shareMediaWithClient.mockRejectedValue({ response: { status: 409 } });

    const { result } = await renderAndLoad();

    await act(async () => {
      await result.current.handleShareMedia({ upload_id: 10, notes: '' });
    });

    expect(Alert.alert).toHaveBeenCalledWith('Error', 'This resource is already shared with this client.');
  });

  test('handleOpenMarshal delivers intent and navigates', async () => {
    const { result } = await renderAndLoad();

    act(() => {
      result.current.handleOpenMarshal();
    });

    expect(mockDeliverIntent).toHaveBeenCalledWith({ message: 'mock intent' });
    expect(mockParentNavigation.navigate).toHaveBeenCalledWith(expect.any(String));
  });

  test('handleOpenMarshal does nothing when client is null', async () => {
    getClient.mockResolvedValue({ data: null });

    const { result } = await renderAndLoad();

    act(() => {
      result.current.handleOpenMarshal();
    });

    expect(mockDeliverIntent).not.toHaveBeenCalled();
  });

  test('handleUnshare optimistically removes and shows snackbar', async () => {
    jest.useFakeTimers();
    getClientSharedMedia.mockResolvedValue({ data: [{ id: 5, upload_id: 50 }] });

    const { result } = await renderAndLoad();

    // Expand and load resources
    await act(async () => {
      result.current.toggleSection('resources');
    });

    await waitFor(() => expect(result.current.loadedSections.resources).toBe(true));

    // Unshare
    act(() => {
      result.current.handleUnshare(5);
    });

    expect(result.current.snackbar.visible).toBe(true);
    expect(result.current.snackbar.message).toBe('Resource removed');

    jest.useRealTimers();
  });

  test('SECTIONS constant has all expected keys', async () => {
    const { result } = await renderAndLoad();

    expect(result.current.SECTIONS).toEqual({
      ACTIVITY: 'activity',
      CURRICULUM: 'curriculum',
      RESOURCES: 'resources',
      REPORTS: 'reports',
      UPCOMING: 'upcoming',
      PAST: 'past',
    });
  });
});
