import { renderHook, waitFor } from '@testing-library/react-native';
import useBookingPayment from '../../src/hooks/useBookingPayment';
import { getClientPaymentMethods, getMyPaymentMethods } from '../../src/services/billing.api';

jest.mock('../../src/services/billing.api', () => ({
  getClientPaymentMethods: jest.fn(),
  getMyPaymentMethods: jest.fn(),
  createServicePayment: jest.fn(),
  handlePaymentSuccess: jest.fn(),
}));

jest.mock('../../src/helpers/logger.helper', () => ({
  error: jest.fn(),
  warn: jest.fn(),
}));

const savedCards = {
  payment_methods: [
    { id: 'pm_123', card: { brand: 'visa', last4: '4242' }, is_default: true },
  ],
};

describe('useBookingPayment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('client flow calls getMyPaymentMethods', async () => {
    getMyPaymentMethods.mockResolvedValue(savedCards);

    const { result } = renderHook(() =>
      useBookingPayment({
        clientId: 9,
        isEditMode: false,
        isCoach: false,
        paymentsEnabled: true,
        isMembershipBooking: false,
        isPackageBooking: false,
      }),
    );

    await waitFor(() => expect(result.current.savedMethodsLoading).toBe(false));

    expect(getMyPaymentMethods).toHaveBeenCalledTimes(1);
    expect(getClientPaymentMethods).not.toHaveBeenCalled();
    expect(result.current.savedMethods).toHaveLength(1);
    expect(result.current.paymentMode).toBe('saved');
  });

  test('coach flow calls getClientPaymentMethods with clientId', async () => {
    getClientPaymentMethods.mockResolvedValue(savedCards);

    const { result } = renderHook(() =>
      useBookingPayment({
        clientId: 9,
        isEditMode: false,
        isCoach: true,
        paymentsEnabled: true,
        isMembershipBooking: false,
        isPackageBooking: false,
      }),
    );

    await waitFor(() => expect(result.current.savedMethodsLoading).toBe(false));

    expect(getClientPaymentMethods).toHaveBeenCalledWith(9);
    expect(getMyPaymentMethods).not.toHaveBeenCalled();
  });

  test('skips fetch for membership bookings', async () => {
    renderHook(() =>
      useBookingPayment({
        clientId: 9,
        isEditMode: false,
        isCoach: false,
        paymentsEnabled: true,
        isMembershipBooking: true,
        isPackageBooking: false,
      }),
    );

    expect(getMyPaymentMethods).not.toHaveBeenCalled();
    expect(getClientPaymentMethods).not.toHaveBeenCalled();
  });

  test('skips fetch for package bookings', async () => {
    renderHook(() =>
      useBookingPayment({
        clientId: 9,
        isEditMode: false,
        isCoach: false,
        paymentsEnabled: true,
        isMembershipBooking: false,
        isPackageBooking: true,
      }),
    );

    expect(getMyPaymentMethods).not.toHaveBeenCalled();
  });

  test('coach skips fetch when payments not enabled', async () => {
    renderHook(() =>
      useBookingPayment({
        clientId: 9,
        isEditMode: false,
        isCoach: true,
        paymentsEnabled: false,
        isMembershipBooking: false,
        isPackageBooking: false,
      }),
    );

    expect(getClientPaymentMethods).not.toHaveBeenCalled();
  });

  test('handles API failure gracefully', async () => {
    getMyPaymentMethods.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() =>
      useBookingPayment({
        clientId: 9,
        isEditMode: false,
        isCoach: false,
        paymentsEnabled: true,
        isMembershipBooking: false,
        isPackageBooking: false,
      }),
    );

    await waitFor(() => expect(result.current.savedMethodsLoading).toBe(false));

    expect(result.current.savedMethods).toEqual([]);
    expect(result.current.paymentMode).toBe('card');
  });
});
