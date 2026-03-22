import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import useBookingPackage from '../../src/hooks/useBookingPackage';
import { getMyBookingBenefits } from '../../src/services/packages.api';

jest.mock('../../src/services/packages.api', () => ({
  getMyBookingBenefits: jest.fn(),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

const packageBenefits = {
  packages: [
    { client_package_id: 1, package_name: '10-Pack', remaining: 7 },
  ],
};

describe('useBookingPackage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('coach flow skips package fetch entirely', async () => {
    const { result } = renderHook(
      () => useBookingPackage({
        clientId: 9,
        serviceId: 5,
        isEditMode: false,
        isCoach: true,
        membershipLoading: false,
        isMembershipBooking: false,
      }),
      { wrapper: createWrapper() },
    );

    // Give it a tick to ensure nothing fires
    await new Promise((r) => setTimeout(r, 50));

    expect(getMyBookingBenefits).not.toHaveBeenCalled();
    expect(result.current.packageBenefit).toBeNull();
    expect(result.current.packageBenefitLoading).toBe(false);
    expect(result.current.isPackageBooking).toBe(false);
  });

  test('client flow fetches and resolves package benefit', async () => {
    getMyBookingBenefits.mockResolvedValue(packageBenefits);

    const { result } = renderHook(
      () => useBookingPackage({
        clientId: 9,
        serviceId: 5,
        isEditMode: false,
        isCoach: false,
        membershipLoading: false,
        isMembershipBooking: false,
      }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.packageBenefitLoading).toBe(false));

    expect(getMyBookingBenefits).toHaveBeenCalledWith(5);
    expect(result.current.packageBenefit.hasPackage).toBe(true);
    expect(result.current.packageBenefit.client_package_id).toBe(1);
    expect(result.current.packageBenefit.remaining).toBe(7);
    expect(result.current.isPackageBooking).toBe(true);
  });

  test('skips when membership is already active (membership takes precedence)', async () => {
    const { result } = renderHook(
      () => useBookingPackage({
        clientId: 9,
        serviceId: 5,
        isEditMode: false,
        isCoach: false,
        membershipLoading: false,
        isMembershipBooking: true,
      }),
      { wrapper: createWrapper() },
    );

    await new Promise((r) => setTimeout(r, 50));

    expect(getMyBookingBenefits).not.toHaveBeenCalled();
    expect(result.current.packageBenefit).toBeNull();
    expect(result.current.isPackageBooking).toBe(false);
  });

  test('waits for membership to finish loading before fetching', async () => {
    const { result, rerender } = renderHook(
      ({ membershipLoading }) => useBookingPackage({
        clientId: 9,
        serviceId: 5,
        isEditMode: false,
        isCoach: false,
        membershipLoading,
        isMembershipBooking: false,
      }),
      { wrapper: createWrapper(), initialProps: { membershipLoading: true } },
    );

    await new Promise((r) => setTimeout(r, 50));
    expect(getMyBookingBenefits).not.toHaveBeenCalled();

    getMyBookingBenefits.mockResolvedValue({ packages: [] });
    rerender({ membershipLoading: false });

    await waitFor(() => expect(getMyBookingBenefits).toHaveBeenCalledTimes(1));
  });

  test('returns hasPackage false when no packages available', async () => {
    getMyBookingBenefits.mockResolvedValue({ packages: [] });

    const { result } = renderHook(
      () => useBookingPackage({
        clientId: 9,
        serviceId: 5,
        isEditMode: false,
        isCoach: false,
        membershipLoading: false,
        isMembershipBooking: false,
      }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.packageBenefitLoading).toBe(false));

    expect(result.current.packageBenefit.hasPackage).toBe(false);
    expect(result.current.isPackageBooking).toBe(false);
  });

  test('skips in edit mode', async () => {
    const { result } = renderHook(
      () => useBookingPackage({
        clientId: 9,
        serviceId: 5,
        isEditMode: true,
        isCoach: false,
        membershipLoading: false,
        isMembershipBooking: false,
      }),
      { wrapper: createWrapper() },
    );

    await new Promise((r) => setTimeout(r, 50));
    expect(getMyBookingBenefits).not.toHaveBeenCalled();
    expect(result.current.packageBenefit).toBeNull();
  });

  test('API error surfaces as packageBenefitError', async () => {
    getMyBookingBenefits.mockRejectedValue(new Error('Server error'));

    const { result } = renderHook(
      () => useBookingPackage({
        clientId: 9,
        serviceId: 5,
        isEditMode: false,
        isCoach: false,
        membershipLoading: false,
        isMembershipBooking: false,
      }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.packageBenefitLoading).toBe(false));

    expect(result.current.packageBenefitError).toBe(true);
  });
});
