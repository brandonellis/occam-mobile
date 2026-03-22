import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import useBookingMembership from '../../src/hooks/useBookingMembership';
import { getCurrentClientMembership, getMyMembership } from '../../src/services/accounts.api';

jest.mock('../../src/services/accounts.api', () => ({
  getCurrentClientMembership: jest.fn(),
  getMyMembership: jest.fn(),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

const activeMembership = {
  data: {
    id: 1,
    stripe_status: 'active',
    membership_plan: {
      name: 'Gold',
      plan_services: [
        { id: 10, service_id: 5, remaining_quantity: 3, member_price: 0 },
      ],
    },
  },
};

describe('useBookingMembership', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('client flow calls getMyMembership, not getCurrentClientMembership', async () => {
    getMyMembership.mockResolvedValue(activeMembership);

    const { result } = renderHook(
      () => useBookingMembership({ clientId: 9, serviceId: 5, isEditMode: false, isCoach: false }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.membershipLoading).toBe(false));

    expect(getMyMembership).toHaveBeenCalledTimes(1);
    expect(getCurrentClientMembership).not.toHaveBeenCalled();
    expect(result.current.membershipStatus.hasActiveMembership).toBe(true);
  });

  test('coach flow calls getCurrentClientMembership with clientId', async () => {
    getCurrentClientMembership.mockResolvedValue(activeMembership);

    const { result } = renderHook(
      () => useBookingMembership({ clientId: 9, serviceId: 5, isEditMode: false, isCoach: true }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.membershipLoading).toBe(false));

    expect(getCurrentClientMembership).toHaveBeenCalledWith(9);
    expect(getMyMembership).not.toHaveBeenCalled();
    expect(result.current.membershipStatus.hasActiveMembership).toBe(true);
  });

  test('404 response treated as no membership, not an error', async () => {
    const err = new Error('Not found');
    err.response = { status: 404 };
    getMyMembership.mockRejectedValue(err);

    const { result } = renderHook(
      () => useBookingMembership({ clientId: 9, serviceId: 5, isEditMode: false, isCoach: false }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.membershipLoading).toBe(false));

    expect(result.current.membershipError).toBe(false);
    expect(result.current.membershipStatus.hasActiveMembership).toBe(false);
  });

  test('non-404 error is treated as an error', async () => {
    getMyMembership.mockRejectedValue(new Error('Server error'));

    const { result } = renderHook(
      () => useBookingMembership({ clientId: 9, serviceId: 5, isEditMode: false, isCoach: false }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.membershipLoading).toBe(false));

    expect(result.current.membershipError).toBe(true);
  });

  test('disabled when isEditMode is true', async () => {
    const { result } = renderHook(
      () => useBookingMembership({ clientId: 9, serviceId: 5, isEditMode: true, isCoach: false }),
      { wrapper: createWrapper() },
    );

    // Should not fetch at all
    expect(getMyMembership).not.toHaveBeenCalled();
    expect(getCurrentClientMembership).not.toHaveBeenCalled();
    expect(result.current.membershipStatus.hasActiveMembership).toBe(false);
  });

  test('resolves memberPriceCents from plan services', async () => {
    getMyMembership.mockResolvedValue(activeMembership);

    const { result } = renderHook(
      () => useBookingMembership({ clientId: 9, serviceId: 5, isEditMode: false, isCoach: false }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.membershipLoading).toBe(false));

    expect(result.current.memberPriceCents).toBe(0);
    expect(result.current.isMembershipBooking).toBe(true);
  });

  test('paused membership is not active', async () => {
    const paused = {
      data: {
        id: 2,
        stripe_status: 'active',
        is_paused: true,
        pause_start_at: '2020-01-01',
        pause_end_at: '2099-12-31',
        membership_plan: { name: 'Gold', plan_services: [] },
      },
    };
    getMyMembership.mockResolvedValue(paused);

    const { result } = renderHook(
      () => useBookingMembership({ clientId: 9, serviceId: 5, isEditMode: false, isCoach: false }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.membershipLoading).toBe(false));

    expect(result.current.membershipStatus.hasActiveMembership).toBe(false);
    expect(result.current.membershipStatus.isPaused).toBe(true);
  });
});
