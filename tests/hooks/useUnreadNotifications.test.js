import { renderHook, act, waitFor } from '@testing-library/react-native';
import useUnreadNotifications from '../../src/hooks/useUnreadNotifications';
import { getUnreadNotificationCount } from '../../src/services/notifications.api';

// Mock the API
jest.mock('../../src/services/notifications.api', () => ({
  getUnreadNotificationCount: jest.fn(),
}));

describe('useUnreadNotifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getUnreadNotificationCount.mockResolvedValue(0);
  });

  test('fetches unread count on mount', async () => {
    getUnreadNotificationCount.mockResolvedValue(5);

    const { result } = renderHook(() => useUnreadNotifications());

    await waitFor(() => {
      expect(result.current.unreadCount).toBe(5);
    });

    expect(getUnreadNotificationCount).toHaveBeenCalledTimes(1);
  });

  test('returns 0 when API fails', async () => {
    getUnreadNotificationCount.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useUnreadNotifications());

    // Should remain 0 — error is silently caught
    await waitFor(() => {
      expect(result.current.unreadCount).toBe(0);
    });
  });

  test('refresh with force bypasses throttle', async () => {
    getUnreadNotificationCount.mockResolvedValue(3);

    const { result } = renderHook(() => useUnreadNotifications());

    await waitFor(() => {
      expect(result.current.unreadCount).toBe(3);
    });

    // Update the mock for refresh
    getUnreadNotificationCount.mockResolvedValue(7);

    await act(async () => {
      await result.current.refresh({ force: true });
    });

    expect(result.current.unreadCount).toBe(7);
    expect(getUnreadNotificationCount).toHaveBeenCalledTimes(2);
  });

  test('refresh without force is throttled within 30s', async () => {
    getUnreadNotificationCount.mockResolvedValue(2);

    const { result } = renderHook(() => useUnreadNotifications());

    await waitFor(() => {
      expect(result.current.unreadCount).toBe(2);
    });

    // Non-forced refresh within 30s should be skipped
    getUnreadNotificationCount.mockResolvedValue(99);

    await act(async () => {
      await result.current.refresh();
    });

    // Count should NOT have updated — throttled
    expect(result.current.unreadCount).toBe(2);
    expect(getUnreadNotificationCount).toHaveBeenCalledTimes(1);
  });

  test('exposes refresh function', () => {
    const { result } = renderHook(() => useUnreadNotifications());
    expect(typeof result.current.refresh).toBe('function');
  });
});
