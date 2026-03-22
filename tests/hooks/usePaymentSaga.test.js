import { Alert } from 'react-native';
import { renderHook, act } from '@testing-library/react-native';
import usePaymentSaga from '../../src/hooks/usePaymentSaga';
import { createBooking, cancelBooking, getBooking } from '../../src/services/bookings.api';

jest.mock('../../src/services/bookings.api', () => ({
  createBooking: jest.fn(),
  cancelBooking: jest.fn(),
  getBooking: jest.fn(),
}));

jest.mock('../../src/helpers/error.helper', () => ({
  extractErrorMessage: jest.fn((err) => err?.message || 'Unknown error'),
}));

jest.mock('../../src/helpers/logger.helper', () => ({
  warn: jest.fn(),
}));

jest.spyOn(Alert, 'alert').mockImplementation(() => {});

const ACTIONS = {
  SUBMIT_START: 'SUBMIT_START',
  SET_LOADING_MESSAGE: 'SET_LOADING_MESSAGE',
  SUBMIT_SUCCESS: 'SUBMIT_SUCCESS',
  SUBMIT_END: 'SUBMIT_END',
};

describe('usePaymentSaga', () => {
  let mockDispatch;
  let mockBuildPayload;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDispatch = jest.fn();
    mockBuildPayload = jest.fn(() => ({ client_id: 9, service_ids: [5], status: 'pending' }));
  });

  test('full success flow: create booking, execute payment, fetch details', async () => {
    createBooking.mockResolvedValue({ data: { id: 100 } });
    getBooking.mockResolvedValue({ data: { id: 100, status: 'confirmed' } });
    const paymentFn = jest.fn(async (bookingId, markCharged) => {
      markCharged();
    });

    const { result } = renderHook(() =>
      usePaymentSaga({ buildPayload: mockBuildPayload, dispatch: mockDispatch, ACTIONS }),
    );

    await act(async () => {
      await result.current.executePaymentSaga(paymentFn);
    });

    // Should create pending booking
    expect(mockBuildPayload).toHaveBeenCalledWith('pending');
    expect(createBooking).toHaveBeenCalledWith({ client_id: 9, service_ids: [5], status: 'pending' });

    // Should execute payment fn with booking ID
    expect(paymentFn).toHaveBeenCalledWith(100, expect.any(Function));

    // Should fetch full booking
    expect(getBooking).toHaveBeenCalledWith(100);

    // Should dispatch success
    const successDispatch = mockDispatch.mock.calls.find((c) => c[0].type === 'SUBMIT_SUCCESS');
    expect(successDispatch).toBeTruthy();
    expect(successDispatch[0].payload).toEqual({ id: 100, status: 'confirmed' });
  });

  test('cancels pending booking when payment fails before charge', async () => {
    createBooking.mockResolvedValue({ data: { id: 101 } });
    const paymentFn = jest.fn(async () => {
      throw new Error('Card declined');
    });

    const { result } = renderHook(() =>
      usePaymentSaga({ buildPayload: mockBuildPayload, dispatch: mockDispatch, ACTIONS }),
    );

    await act(async () => {
      await result.current.executePaymentSaga(paymentFn);
    });

    // Should cancel the pending booking
    expect(cancelBooking).toHaveBeenCalledWith(101);

    // Should show payment failed alert
    expect(Alert.alert).toHaveBeenCalledWith('Payment Failed', 'Card declined');
  });

  test('does NOT cancel booking when payment fails after charge', async () => {
    createBooking.mockResolvedValue({ data: { id: 102 } });
    const paymentFn = jest.fn(async (bookingId, markCharged) => {
      markCharged(); // charge succeeded
      throw new Error('Post-charge error'); // but something else failed
    });

    const { result } = renderHook(() =>
      usePaymentSaga({ buildPayload: mockBuildPayload, dispatch: mockDispatch, ACTIONS }),
    );

    await act(async () => {
      await result.current.executePaymentSaga(paymentFn);
    });

    // Should NOT cancel the booking since charge already completed
    expect(cancelBooking).not.toHaveBeenCalled();

    expect(Alert.alert).toHaveBeenCalledWith('Payment Failed', 'Post-charge error');
  });

  test('falls back to bookingResponse when getBooking fails', async () => {
    createBooking.mockResolvedValue({ data: { id: 103, status: 'pending' } });
    getBooking.mockRejectedValue(new Error('Fetch failed'));
    const paymentFn = jest.fn(async (_, markCharged) => markCharged());

    const { result } = renderHook(() =>
      usePaymentSaga({ buildPayload: mockBuildPayload, dispatch: mockDispatch, ACTIONS }),
    );

    await act(async () => {
      await result.current.executePaymentSaga(paymentFn);
    });

    const successDispatch = mockDispatch.mock.calls.find((c) => c[0].type === 'SUBMIT_SUCCESS');
    expect(successDispatch[0].payload).toEqual({ id: 103, status: 'pending' });
  });

  test('dispatches correct loading messages through phases', async () => {
    createBooking.mockResolvedValue({ data: { id: 104 } });
    getBooking.mockResolvedValue({ data: { id: 104 } });
    const paymentFn = jest.fn(async (_, markCharged) => markCharged());

    const { result } = renderHook(() =>
      usePaymentSaga({ buildPayload: mockBuildPayload, dispatch: mockDispatch, ACTIONS }),
    );

    await act(async () => {
      await result.current.executePaymentSaga(paymentFn);
    });

    const dispatches = mockDispatch.mock.calls.map((c) => c[0]);

    expect(dispatches[0]).toEqual({ type: 'SUBMIT_START', payload: 'Creating booking...' });
    expect(dispatches[1]).toEqual({ type: 'SET_LOADING_MESSAGE', payload: 'Processing payment...' });
    expect(dispatches[2]).toEqual({ type: 'SET_LOADING_MESSAGE', payload: 'Finalizing...' });
  });

  test('always dispatches SUBMIT_END even on failure', async () => {
    createBooking.mockRejectedValue(new Error('Server error'));

    const { result } = renderHook(() =>
      usePaymentSaga({ buildPayload: mockBuildPayload, dispatch: mockDispatch, ACTIONS }),
    );

    await act(async () => {
      await result.current.executePaymentSaga(jest.fn());
    });

    const endDispatch = mockDispatch.mock.calls.find((c) => c[0].type === 'SUBMIT_END');
    expect(endDispatch).toBeTruthy();
  });
});
