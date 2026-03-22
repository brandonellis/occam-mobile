import { Alert } from 'react-native';
import { renderHook, act } from '@testing-library/react-native';
import useBookingSubmission from '../../src/hooks/useBookingSubmission';
import { createBooking } from '../../src/services/bookings.api';

jest.mock('../../src/services/bookings.api', () => ({
  createBooking: jest.fn(),
  createRecurringBooking: jest.fn(),
  updateBooking: jest.fn(),
  cancelBooking: jest.fn(),
  getBooking: jest.fn(),
}));

jest.mock('../../src/services/billing.api', () => ({
  createServicePayment: jest.fn(),
  handlePaymentSuccess: jest.fn(),
}));

jest.mock('../../src/helpers/bookingEdit.helper', () => ({
  isStaffBookingRole: jest.fn(() => false),
}));

jest.mock('../../src/helpers/error.helper', () => ({
  extractErrorMessage: jest.fn((err) => err?.message || 'Unknown error'),
}));

jest.mock('../../src/helpers/logger.helper', () => ({
  warn: jest.fn(),
  error: jest.fn(),
}));

jest.spyOn(Alert, 'alert').mockImplementation(() => {});

const baseProps = {
  bookingData: {},
  service: { id: 5 },
  coach: { id: 1 },
  location: { id: 2 },
  client: { id: 9, first_name: 'Test', last_name: 'User', email: 'test@example.com' },
  timeSlot: { start_time: '2026-03-22T10:00:00', end_time: '2026-03-22T11:00:00' },
  user: { id: 9, first_name: 'Test', last_name: 'User', email: 'test@example.com' },
  isCoach: false,
  activeRole: 'client',
  isMembershipBooking: false,
  membershipStatus: null,
  refreshMembership: jest.fn(),
  isPackageBooking: false,
  packageBenefit: null,
  cardComplete: false,
  paymentMode: 'card',
  selectedSavedMethodId: null,
  paymentsEnabled: true,
  confirmPayment: jest.fn(),
  selectedResource: null,
  bookingNotes: '',
  bookingStatus: 'confirmed',
  appliedPromo: null,
  recurrenceEnabled: false,
  recurrenceFrequency: 'weekly',
  recurrenceOccurrences: 4,
  membershipLoading: false,
  packageBenefitLoading: false,
  ecommerceLoading: false,
  isPaymentNotRequired: false,
};

describe('useBookingSubmission', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── canConfirm tests ──

  test('canConfirm is true for membership bookings', () => {
    const { result } = renderHook(() =>
      useBookingSubmission({ ...baseProps, isMembershipBooking: true }),
    );
    expect(result.current.canConfirm).toBe(true);
  });

  test('canConfirm is true for package bookings', () => {
    const { result } = renderHook(() =>
      useBookingSubmission({ ...baseProps, isPackageBooking: true }),
    );
    expect(result.current.canConfirm).toBe(true);
  });

  test('canConfirm is true when payment not required', () => {
    const { result } = renderHook(() =>
      useBookingSubmission({ ...baseProps, isPaymentNotRequired: true }),
    );
    expect(result.current.canConfirm).toBe(true);
  });

  test('canConfirm is true for coach when payments not enabled', () => {
    const { result } = renderHook(() =>
      useBookingSubmission({ ...baseProps, isCoach: true, paymentsEnabled: false }),
    );
    expect(result.current.canConfirm).toBe(true);
  });

  test('canConfirm is false for client when payments not enabled (security fix)', () => {
    const { result } = renderHook(() =>
      useBookingSubmission({ ...baseProps, isCoach: false, paymentsEnabled: false }),
    );
    expect(result.current.canConfirm).toBe(false);
  });

  test('canConfirm requires card complete when payments enabled', () => {
    const { result: incomplete } = renderHook(() =>
      useBookingSubmission({ ...baseProps, paymentsEnabled: true, cardComplete: false }),
    );
    expect(incomplete.current.canConfirm).toBe(false);

    const { result: complete } = renderHook(() =>
      useBookingSubmission({ ...baseProps, paymentsEnabled: true, cardComplete: true }),
    );
    expect(complete.current.canConfirm).toBe(true);
  });

  test('canConfirm requires selected method for saved card mode', () => {
    const { result: noMethod } = renderHook(() =>
      useBookingSubmission({ ...baseProps, paymentsEnabled: true, paymentMode: 'saved', selectedSavedMethodId: null }),
    );
    expect(noMethod.current.canConfirm).toBe(false);

    const { result: withMethod } = renderHook(() =>
      useBookingSubmission({ ...baseProps, paymentsEnabled: true, paymentMode: 'saved', selectedSavedMethodId: 'pm_123' }),
    );
    expect(withMethod.current.canConfirm).toBe(true);
  });

  test('canConfirm is false while loading', () => {
    const { result } = renderHook(() =>
      useBookingSubmission({ ...baseProps, isMembershipBooking: true, membershipLoading: true }),
    );
    expect(result.current.canConfirm).toBe(false);
  });

  // ── handleConfirm routing tests ──

  test('membership booking calls createBooking directly', async () => {
    createBooking.mockResolvedValue({ data: { id: 100 } });

    const { result } = renderHook(() =>
      useBookingSubmission({ ...baseProps, isMembershipBooking: true }),
    );

    await act(async () => {
      result.current.handleConfirm();
    });

    expect(createBooking).toHaveBeenCalledTimes(1);
    const payload = createBooking.mock.calls[0][0];
    expect(payload.booking_type).toBe('membership');
    expect(payload.status).toBe('confirmed');
  });

  test('client with no payments shows alert instead of booking', async () => {
    const { result } = renderHook(() =>
      useBookingSubmission({ ...baseProps, isCoach: false, paymentsEnabled: false }),
    );

    await act(async () => {
      result.current.handleConfirm();
    });

    expect(createBooking).not.toHaveBeenCalled();
    expect(Alert.alert).toHaveBeenCalledWith(
      'Payment Unavailable',
      expect.stringContaining('Online payments are not set up'),
    );
  });

  test('coach with no payments can still book directly', async () => {
    createBooking.mockResolvedValue({ data: { id: 101 } });

    const { result } = renderHook(() =>
      useBookingSubmission({ ...baseProps, isCoach: true, paymentsEnabled: false }),
    );

    await act(async () => {
      result.current.handleConfirm();
    });

    expect(createBooking).toHaveBeenCalledTimes(1);
    expect(Alert.alert).not.toHaveBeenCalled();
  });

  // ── Recurring allotment warning tests ──

  test('recurring booking warns when occurrences exceed membership allotment', async () => {
    const { result } = renderHook(() =>
      useBookingSubmission({
        ...baseProps,
        isCoach: true,
        isMembershipBooking: true,
        membershipStatus: { hasActiveMembership: true, hasUsage: true, remainingQuantity: 2 },
        recurrenceEnabled: true,
        recurrenceOccurrences: 4,
      }),
    );

    await act(async () => {
      result.current.handleConfirm();
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      'Allotment Warning',
      expect.stringContaining('2 sessions remaining'),
      expect.arrayContaining([
        expect.objectContaining({ text: 'Cancel' }),
        expect.objectContaining({ text: 'Continue Anyway' }),
      ]),
    );
    // Should NOT have called createRecurringBooking yet
    const { createRecurringBooking } = require('../../src/services/bookings.api');
    expect(createRecurringBooking).not.toHaveBeenCalled();
  });

  test('recurring booking proceeds without warning when allotment is unlimited (null)', async () => {
    const { createRecurringBooking } = require('../../src/services/bookings.api');
    createRecurringBooking.mockResolvedValue({ created_count: 4, failed_count: 0 });

    const { result } = renderHook(() =>
      useBookingSubmission({
        ...baseProps,
        isCoach: true,
        isMembershipBooking: true,
        membershipStatus: { hasActiveMembership: true, hasUsage: true, remainingQuantity: null },
        recurrenceEnabled: true,
        recurrenceOccurrences: 4,
      }),
    );

    await act(async () => {
      result.current.handleConfirm();
    });

    expect(Alert.alert).not.toHaveBeenCalledWith('Allotment Warning', expect.anything(), expect.anything());
    expect(createRecurringBooking).toHaveBeenCalledTimes(1);
  });

  test('recurring booking proceeds without warning when occurrences within allotment', async () => {
    const { createRecurringBooking } = require('../../src/services/bookings.api');
    createRecurringBooking.mockResolvedValue({ created_count: 2, failed_count: 0 });

    const { result } = renderHook(() =>
      useBookingSubmission({
        ...baseProps,
        isCoach: true,
        isMembershipBooking: true,
        membershipStatus: { hasActiveMembership: true, hasUsage: true, remainingQuantity: 5 },
        recurrenceEnabled: true,
        recurrenceOccurrences: 2,
      }),
    );

    await act(async () => {
      result.current.handleConfirm();
    });

    expect(Alert.alert).not.toHaveBeenCalledWith('Allotment Warning', expect.anything(), expect.anything());
    expect(createRecurringBooking).toHaveBeenCalledTimes(1);
  });

  test('missing clientId shows error alert', async () => {
    const { result } = renderHook(() =>
      useBookingSubmission({ ...baseProps, user: { id: null } }),
    );

    await act(async () => {
      result.current.handleConfirm();
    });

    expect(createBooking).not.toHaveBeenCalled();
    expect(Alert.alert).toHaveBeenCalledWith('Error', 'Client information is missing.');
  });
});
