import { useCallback } from 'react';
import { Alert } from 'react-native';
import { createBooking, cancelBooking, getBooking } from '../services/bookings.api';
import { extractErrorMessage } from '../helpers/error.helper';
import logger from '../helpers/logger.helper';

/**
 * Encapsulates the shared payment saga: create pending booking -> execute payment -> finalize.
 * Used by both new-card and saved-card flows in useBookingSubmission.
 *
 * @param {Object} params
 * @param {Function} params.buildPayload - () => booking payload (called with 'pending' status by the saga)
 * @param {Function} params.dispatch - useReducer dispatch
 * @param {Object} params.ACTIONS - Action constants from bookingSubmission.reducer
 * @returns {{ executePaymentSaga: Function }}
 */
const usePaymentSaga = ({ buildPayload, dispatch, ACTIONS }) => {
  /**
   * Shared payment saga: create pending booking -> execute payment -> finalize.
   * The caller provides a paymentFn that receives (pendingBookingId, markCharged)
   * and handles the payment-specific logic.
   *
   * The paymentFn MUST call markCharged() once the Stripe charge succeeds but
   * before calling handlePaymentSuccess — this prevents the saga from cancelling
   * a booking that was already charged if handlePaymentSuccess fails.
   *
   * @param {Function} paymentFn - async (pendingBookingId, markCharged) => void
   */
  const executePaymentSaga = useCallback(async (paymentFn) => {
    let pendingBookingId = null;
    let chargeCompleted = false;

    const markCharged = () => { chargeCompleted = true; };

    try {
      dispatch({ type: ACTIONS.SUBMIT_START, payload: 'Creating booking...' });

      // PHASE 1: Create pending booking
      const payload = buildPayload('pending');
      const bookingResponse = await createBooking(payload);
      pendingBookingId = bookingResponse?.data?.id || bookingResponse?.id;

      // PHASE 2-3: Execute payment (new card or saved card)
      dispatch({ type: ACTIONS.SET_LOADING_MESSAGE, payload: 'Processing payment...' });
      await paymentFn(pendingBookingId, markCharged);

      // PHASE 4: Fetch full booking for success screen
      dispatch({ type: ACTIONS.SET_LOADING_MESSAGE, payload: 'Finalizing...' });

      let confirmedBookingData;
      try {
        const full = await getBooking(bookingResponse?.data?.id || bookingResponse?.id);
        confirmedBookingData = full?.data || full;
      } catch (fetchErr) {
        logger.warn('Failed to fetch booking details for success screen:', fetchErr.message);
        confirmedBookingData = bookingResponse?.data || bookingResponse;
      }
      dispatch({ type: ACTIONS.SUBMIT_SUCCESS, payload: confirmedBookingData });
    } catch (error) {
      if (pendingBookingId && !chargeCompleted) {
        try {
          await cancelBooking(pendingBookingId);
        } catch (cancelErr) {
          logger.warn('Failed to cancel pending booking after payment failure:', cancelErr.message);
        }
      }
      Alert.alert('Payment Failed', extractErrorMessage(error));
    } finally {
      dispatch({ type: ACTIONS.SUBMIT_END });
    }
  }, [buildPayload, dispatch, ACTIONS]);

  return { executePaymentSaga };
};

export default usePaymentSaga;
