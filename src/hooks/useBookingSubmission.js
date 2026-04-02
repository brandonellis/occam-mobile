import { useReducer, useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import {
  createBooking,
  createRecurringBooking,
  updateBooking,
} from '../services/bookings.api';
import { createServicePayment, handlePaymentSuccess } from '../services/billing.api';
import { extractErrorMessage } from '../helpers/error.helper';
import { isStaffBookingRole } from '../helpers/bookingEdit.helper';
import { buildBookingPayload, buildUpdatePayload } from '../helpers/bookingPayload.helpers';
import usePaymentSaga from './usePaymentSaga';
import {
  bookingSubmissionReducer,
  initialBookingSubmissionState,
  BOOKING_SUBMISSION_ACTIONS as ACTIONS,
} from '../reducers/bookingSubmission.reducer';

/**
 * Orchestrates all booking submission flows: direct confirm (membership/package/free),
 * edit update, new-card Stripe payment, and saved-card Stripe payment.
 *
 * Uses useReducer for coordinated state transitions (isSubmitting, loadingMessage,
 * showSuccess, createdBookingData) that change together across multi-phase flows.
 */
const useBookingSubmission = ({
  // Booking data
  bookingData,
  service,
  coach,
  location,
  client,
  timeSlot,
  // Auth
  user,
  isCoach,
  activeRole,
  // Membership
  isMembershipBooking,
  membershipStatus,
  refreshMembership,
  // Package
  isPackageBooking,
  packageBenefit,
  // Payment
  cardComplete,
  paymentMode,
  selectedSavedMethodId,
  paymentsEnabled,
  confirmPayment,
  // Resource
  selectedResource,
  // Form
  bookingNotes,
  bookingStatus,
  // Promo
  appliedPromo,
  // Recurrence (coach only)
  recurrenceEnabled,
  recurrenceFrequency,
  recurrenceOccurrences,
  // Loading states
  membershipLoading,
  packageBenefitLoading,
  ecommerceLoading,
  isPaymentNotRequired,
}) => {
  const [state, dispatch] = useReducer(bookingSubmissionReducer, initialBookingSubmissionState);
  const { isSubmitting, loadingMessage, showSuccess, createdBookingData } = state;

  const isEditMode = Boolean(bookingData.editMode);
  const isStaffEditor = isStaffBookingRole(activeRole);
  const bookingId = bookingData.bookingId || null;
  const clientId = isCoach ? client?.id : user?.id;

  // Wrap pure buildBookingPayload with current closure values
  const buildPayload = useCallback((status = 'confirmed', { sendPaymentLink } = {}) => {
    return buildBookingPayload(
      { clientId, isMembershipBooking, isPackageBooking, location, service, coach, timeSlot, bookingData, membershipStatus, packageBenefit, bookingNotes, selectedResource, sendPaymentLink },
      status,
    );
  }, [clientId, isMembershipBooking, isPackageBooking, location, service, coach, timeSlot, bookingData, membershipStatus, packageBenefit, bookingNotes, selectedResource]);

  // Wrap pure buildUpdatePayload with current closure values
  const buildUpdate = useCallback(() => {
    return buildUpdatePayload({ bookingNotes, bookingStatus, timeSlot, selectedResource, isStaffEditor, service, location, client, coach });
  }, [bookingNotes, bookingStatus, timeSlot?.start_time, timeSlot?.end_time, selectedResource?.id, isStaffEditor, service?.id, location?.id, client?.id, coach?.id]);

  // Payment saga from extracted hook
  const { executePaymentSaga } = usePaymentSaga({ buildPayload, dispatch, ACTIONS });

  // Handle direct booking (membership, no-payment, or send-payment-link — no inline Stripe)
  const handleDirectBooking = useCallback(async ({ sendPaymentLink } = {}) => {
    try {
      dispatch({ type: ACTIONS.SUBMIT_START, payload: 'Creating booking...' });
      const payload = buildPayload('confirmed', { sendPaymentLink });
      const result = await createBooking(payload);
      const booking = result?.data || result;
      refreshMembership();
      dispatch({ type: ACTIONS.SUBMIT_SUCCESS, payload: booking });
      if (sendPaymentLink && booking.payment_link_sent === false) {
        Alert.alert('Note', 'Booking created, but the payment link could not be sent. You can resend it from the booking details.');
      }
    } catch (error) {
      Alert.alert('Booking Failed', extractErrorMessage(error));
    } finally {
      dispatch({ type: ACTIONS.SUBMIT_END });
    }
  }, [buildPayload, refreshMembership]);

  const handleDirectConfirm = useCallback(() => handleDirectBooking(), [handleDirectBooking]);
  const handleSendPaymentLink = useCallback(() => handleDirectBooking({ sendPaymentLink: true }), [handleDirectBooking]);

  // Handle recurring booking (coach only — creates a series of bookings)
  const handleRecurringConfirm = useCallback(async () => {
    try {
      dispatch({ type: ACTIONS.SUBMIT_START, payload: 'Creating recurring bookings...' });
      const payload = {
        ...buildPayload('confirmed'),
        frequency: recurrenceFrequency,
        occurrences: recurrenceOccurrences,
      };
      const result = await createRecurringBooking(payload);
      const created = result?.created_count || 0;
      const failed = result?.failed_count || 0;
      if (failed > 0) {
        Alert.alert(
          'Recurring Bookings',
          `${created} booking${created !== 1 ? 's' : ''} created, ${failed} could not be scheduled (conflicts or unavailability).`,
        );
      }
      refreshMembership();
      dispatch({ type: ACTIONS.SUBMIT_SUCCESS, payload: result });
    } catch (error) {
      Alert.alert('Booking Failed', extractErrorMessage(error));
    } finally {
      dispatch({ type: ACTIONS.SUBMIT_END });
    }
  }, [buildPayload, recurrenceFrequency, recurrenceOccurrences, refreshMembership]);

  const handleUpdateConfirm = useCallback(async () => {
    if (!bookingId) {
      Alert.alert('Error', 'Booking information is missing.');
      return;
    }

    try {
      dispatch({ type: ACTIONS.SUBMIT_START, payload: 'Updating booking...' });
      const result = await updateBooking(bookingId, buildUpdate());
      dispatch({ type: ACTIONS.SUBMIT_SUCCESS, payload: result?.data || result });
    } catch (error) {
      Alert.alert('Update Failed', extractErrorMessage(error));
    } finally {
      dispatch({ type: ACTIONS.SUBMIT_END });
    }
  }, [bookingId, buildUpdate]);

  // Handle one-off payment booking (new Stripe card)
  const handlePaymentConfirm = useCallback(async () => {
    if (!cardComplete) {
      Alert.alert('Card Required', 'Please enter your card details to proceed.');
      return;
    }

    await executePaymentSaga(async (pendingBookingId, markCharged) => {
      // Create payment intent
      dispatch({ type: ACTIONS.SET_LOADING_MESSAGE, payload: 'Setting up payment...' });
      const paymentData = {
        client_id: clientId,
        service_id: service?.id,
        booking_id: pendingBookingId,
      };
      if (appliedPromo?.code) {
        paymentData.promotion_code = appliedPromo.code;
      }
      const piResponse = await createServicePayment(paymentData);

      // Zero-amount payments skip Stripe entirely — booking already confirmed by backend
      if (piResponse.zero_amount) {
        markCharged();
        return;
      }

      if (!piResponse.success || !piResponse.client_secret) {
        throw new Error(piResponse.error || 'Failed to create payment.');
      }

      // Confirm payment with Stripe
      dispatch({ type: ACTIONS.SET_LOADING_MESSAGE, payload: 'Processing payment...' });
      const { error, paymentIntent } = await confirmPayment(piResponse.client_secret, {
        paymentMethodType: 'Card',
        paymentMethodData: {
          billingDetails: {
            name: isCoach
              ? `${client?.first_name} ${client?.last_name}`
              : `${user?.first_name} ${user?.last_name}`,
            email: isCoach ? client?.email : user?.email,
          },
        },
      });

      if (error) {
        throw new Error(error.message || 'Payment failed.');
      }

      // Stripe charged successfully — never cancel this booking from here on
      markCharged();

      // Notify backend of success
      dispatch({ type: ACTIONS.SET_LOADING_MESSAGE, payload: 'Finalizing...' });
      await handlePaymentSuccess(paymentIntent.id);
    });
  }, [cardComplete, executePaymentSaga, clientId, service, client, user, isCoach, confirmPayment, appliedPromo]);

  // Handle saved card payment
  const handleSavedCardPayment = useCallback(async () => {
    if (!selectedSavedMethodId) {
      Alert.alert('Card Required', 'Please select a saved card to proceed.');
      return;
    }

    await executePaymentSaga(async (pendingBookingId, markCharged) => {
      const savedPaymentData = {
        client_id: clientId,
        service_id: service?.id,
        booking_id: pendingBookingId,
        use_saved_payment_method: true,
        payment_method_id: selectedSavedMethodId,
      };
      if (appliedPromo?.code) {
        savedPaymentData.promotion_code = appliedPromo.code;
      }
      const piResponse = await createServicePayment(savedPaymentData);

      // Zero-amount payments skip Stripe entirely — booking already confirmed by backend
      if (piResponse?.zero_amount) {
        markCharged();
        return;
      }

      if (!piResponse?.success || !piResponse?.payment_intent_id) {
        throw new Error(piResponse?.error || piResponse?.message || 'Failed to create payment.');
      }

      // SCA fallback: if requires_action, confirm on-device
      if (piResponse.status === 'requires_action' && piResponse.client_secret) {
        dispatch({ type: ACTIONS.SET_LOADING_MESSAGE, payload: 'Confirming payment...' });
        const { error: confirmError } = await confirmPayment(piResponse.client_secret, {
          paymentMethodType: 'Card',
        });
        if (confirmError) throw new Error(confirmError.message || 'Payment confirmation failed.');
        markCharged();
        await handlePaymentSuccess(piResponse.payment_intent_id);
      } else if (piResponse.status === 'succeeded') {
        markCharged();
        await handlePaymentSuccess(piResponse.payment_intent_id);
      } else {
        throw new Error(`Unexpected payment status: ${piResponse.status}`);
      }
    });
  }, [selectedSavedMethodId, executePaymentSaga, clientId, service, confirmPayment, appliedPromo]);

  // Main confirm handler — routes to the appropriate flow
  const handleConfirm = useCallback(() => {
    if (isEditMode) {
      handleUpdateConfirm();
      return;
    }
    if (!clientId) {
      Alert.alert('Error', 'Client information is missing.');
      return;
    }
    if (service?.requires_resource && !selectedResource?.id) {
      Alert.alert(
        'Unavailable',
        'No resources are available for this time slot. Please go back and choose a different time.',
      );
      return;
    }
    // Recurring booking flow (coach only)
    if (recurrenceEnabled && recurrenceOccurrences > 1) {
      // Pre-flight allotment warning for membership bookings
      // Note: allotment is checked per billing cycle on the backend, so bookings
      // spanning multiple cycles will use each cycle's allotment independently.
      if (
        isMembershipBooking &&
        membershipStatus?.remainingQuantity != null &&
        recurrenceOccurrences > membershipStatus.remainingQuantity
      ) {
        const remaining = membershipStatus.remainingQuantity;
        Alert.alert(
          'Allotment Warning',
          `This client has ${remaining} session${remaining !== 1 ? 's' : ''} remaining in the current billing cycle, but you're scheduling ${recurrenceOccurrences} recurring bookings. Sessions in future cycles will use that cycle's allotment. Any sessions beyond available allotment may fail.`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Continue Anyway', onPress: () => handleRecurringConfirm() },
          ],
        );
        return;
      }
      handleRecurringConfirm();
      return;
    }
    if (isMembershipBooking || isPackageBooking) {
      handleDirectConfirm();
    } else if (isPaymentNotRequired) {
      handleDirectConfirm();
    } else if (paymentsEnabled && paymentMode === 'saved' && selectedSavedMethodId) {
      handleSavedCardPayment();
    } else if (paymentsEnabled) {
      handlePaymentConfirm();
    } else if (isCoach) {
      // Stripe not connected — create booking and send payment link to client
      handleSendPaymentLink();
    } else {
      // paymentsEnabled is false for a client — payment system unavailable
      Alert.alert(
        'Payment Unavailable',
        'Online payments are not set up for this facility. Please contact them to book.',
      );
    }
  }, [isEditMode, handleUpdateConfirm, clientId, service, selectedResource, isCoach, isMembershipBooking, isPackageBooking, membershipStatus, isPaymentNotRequired, paymentsEnabled, paymentMode, selectedSavedMethodId, recurrenceEnabled, recurrenceOccurrences, handleDirectConfirm, handleRecurringConfirm, handlePaymentConfirm, handleSavedCardPayment, handleSendPaymentLink]);

  // Compute whether confirm button should be enabled
  const canConfirm = useMemo(() => {
    if (isSubmitting) return false;
    if (isEditMode) return Boolean(bookingId && timeSlot?.start_time);
    if (membershipLoading || packageBenefitLoading || ecommerceLoading) return false;
    if (isMembershipBooking || isPackageBooking) return true;
    if (isPaymentNotRequired) return true;
    if (isCoach && !paymentsEnabled) return true;
    if (paymentsEnabled && paymentMode === 'saved') return !!selectedSavedMethodId;
    if (paymentsEnabled) return cardComplete;
    // Client with no payment system — cannot confirm
    return false;
  }, [isSubmitting, isEditMode, bookingId, timeSlot?.start_time, membershipLoading, packageBenefitLoading, ecommerceLoading, isMembershipBooking, isPackageBooking, isPaymentNotRequired, isCoach, paymentsEnabled, paymentMode, selectedSavedMethodId, cardComplete]);

  return {
    isSubmitting,
    loadingMessage,
    showSuccess,
    createdBookingData,
    handleConfirm,
    handleSendPaymentLink,
    canConfirm,
  };
};

export default useBookingSubmission;
