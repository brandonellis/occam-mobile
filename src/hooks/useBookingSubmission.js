import { useReducer, useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import {
  createBooking,
  updateBooking,
  cancelBooking,
  getBooking,
} from '../services/bookings.api';
import { createServicePayment, handlePaymentSuccess } from '../services/billing.api';
import { extractErrorMessage } from '../helpers/error.helper';
import { isStaffBookingRole } from '../helpers/bookingEdit.helper';
import logger from '../helpers/logger.helper';
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

  // Build the booking payload (shared between membership, package, and payment flows)
  const buildBookingPayload = useCallback((status = 'confirmed') => {
    let bookingType = 'one_off';
    if (isMembershipBooking) bookingType = 'membership';
    else if (isPackageBooking) bookingType = 'package';

    const payload = {
      client_id: clientId,
      booking_type: bookingType,
      location_id: location?.id,
      service_ids: [service?.id],
      start_time: timeSlot?.start_time,
      end_time: timeSlot?.end_time,
      status,
      notes: bookingNotes || '',
    };

    if (coach?.id) {
      payload.bookable_type = 'App\\Models\\User';
      payload.bookable_id = coach.id;
    } else {
      payload.bookable_type = 'App\\Models\\Service';
      payload.bookable_id = service?.id;
    }

    if (selectedResource?.id) {
      payload.resource_ids = [selectedResource.id];
    }

    if (bookingData.duration_minutes && service?.is_variable_duration) {
      payload.duration_minutes = bookingData.duration_minutes;
    }

    if (isMembershipBooking && membershipStatus) {
      payload.membership_subscription_id = membershipStatus.membershipId;
      payload.membership_plan_service_id = membershipStatus.membershipPlanServiceId;
    }

    if (isPackageBooking && packageBenefit?.client_package_id) {
      payload.client_package_id = packageBenefit.client_package_id;
    }

    if (bookingData.selectedClassSession?.id) {
      payload.class_session_id = bookingData.selectedClassSession.id;
    }

    return payload;
  }, [clientId, isMembershipBooking, isPackageBooking, location, service, coach, timeSlot, bookingData, membershipStatus, packageBenefit, bookingNotes, selectedResource]);

  const buildUpdatePayload = useCallback(() => {
    const payload = {
      notes: bookingNotes || '',
      status: bookingStatus,
      start_time: timeSlot?.start_time,
      end_time: timeSlot?.end_time,
      resource_ids: selectedResource?.id ? [selectedResource.id] : [],
    };

    if (isStaffEditor) {
      if (service?.id) {
        payload.service_ids = [service.id];
      }
      payload.location_id = location?.id || null;
      payload.client_id = client?.id || null;
      payload.coach_ids = coach?.id ? [coach.id] : [];
    }

    return payload;
  }, [bookingNotes, bookingStatus, timeSlot?.start_time, timeSlot?.end_time, selectedResource?.id, isStaffEditor, service?.id, location?.id, client?.id, coach?.id]);

  // Handle direct booking (membership or no-payment — no Stripe involved)
  const handleDirectConfirm = useCallback(async () => {
    try {
      dispatch({ type: ACTIONS.SUBMIT_START, payload: 'Creating booking...' });
      const payload = buildBookingPayload('confirmed');
      const result = await createBooking(payload);
      const booking = result?.data || result;
      refreshMembership();
      dispatch({ type: ACTIONS.SUBMIT_SUCCESS, payload: booking });
    } catch (error) {
      Alert.alert('Booking Failed', extractErrorMessage(error));
    } finally {
      dispatch({ type: ACTIONS.SUBMIT_END });
    }
  }, [buildBookingPayload, refreshMembership]);

  const handleUpdateConfirm = useCallback(async () => {
    if (!bookingId) {
      Alert.alert('Error', 'Booking information is missing.');
      return;
    }

    try {
      dispatch({ type: ACTIONS.SUBMIT_START, payload: 'Updating booking...' });
      const result = await updateBooking(bookingId, buildUpdatePayload());
      dispatch({ type: ACTIONS.SUBMIT_SUCCESS, payload: result?.data || result });
    } catch (error) {
      Alert.alert('Update Failed', extractErrorMessage(error));
    } finally {
      dispatch({ type: ACTIONS.SUBMIT_END });
    }
  }, [bookingId, buildUpdatePayload]);

  // Handle one-off payment booking (Stripe card)
  const handlePaymentConfirm = useCallback(async () => {
    if (!cardComplete) {
      Alert.alert('Card Required', 'Please enter your card details to proceed.');
      return;
    }

    let pendingBookingId = null;

    try {
      dispatch({ type: ACTIONS.SUBMIT_START, payload: 'Creating booking...' });

      // PHASE 1: Create pending booking
      const payload = buildBookingPayload('pending');
      const bookingResponse = await createBooking(payload);
      pendingBookingId = bookingResponse?.data?.id || bookingResponse?.id;

      // PHASE 2: Create payment intent
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

      if (!piResponse.success || !piResponse.client_secret) {
        throw new Error(piResponse.error || 'Failed to create payment.');
      }

      // PHASE 3: Confirm payment with Stripe
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

      // PHASE 4: Notify backend of success
      dispatch({ type: ACTIONS.SET_LOADING_MESSAGE, payload: 'Finalizing...' });
      await handlePaymentSuccess(paymentIntent.id);

      const confirmedBookingId = pendingBookingId;
      pendingBookingId = null;

      // Fetch full booking for success screen
      let confirmedBookingData;
      try {
        const full = await getBooking(confirmedBookingId);
        confirmedBookingData = full?.data || full;
      } catch (fetchErr) {
        logger.warn('Failed to fetch booking details for success screen:', fetchErr.message);
        confirmedBookingData = bookingResponse?.data || bookingResponse;
      }
      dispatch({ type: ACTIONS.SUBMIT_SUCCESS, payload: confirmedBookingData });
    } catch (error) {
      if (pendingBookingId) {
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
  }, [cardComplete, buildBookingPayload, clientId, service, client, user, isCoach, confirmPayment, appliedPromo]);

  // Handle saved card payment
  const handleSavedCardPayment = useCallback(async () => {
    if (!selectedSavedMethodId) {
      Alert.alert('Card Required', 'Please select a saved card to proceed.');
      return;
    }

    let pendingBookingId = null;

    try {
      dispatch({ type: ACTIONS.SUBMIT_START, payload: 'Creating booking...' });

      // PHASE 1: Create pending booking
      const payload = buildBookingPayload('pending');
      const bookingResponse = await createBooking(payload);
      pendingBookingId = bookingResponse?.data?.id || bookingResponse?.id;

      // PHASE 2: Create payment intent with saved card
      dispatch({ type: ACTIONS.SET_LOADING_MESSAGE, payload: 'Processing payment...' });
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
        await handlePaymentSuccess(piResponse.payment_intent_id);
      } else if (piResponse.status === 'succeeded') {
        await handlePaymentSuccess(piResponse.payment_intent_id);
      } else {
        throw new Error(`Unexpected payment status: ${piResponse.status}`);
      }

      pendingBookingId = null;

      // Fetch full booking for success screen
      let fetchedBooking;
      try {
        const full = await getBooking(bookingResponse?.data?.id || bookingResponse?.id);
        fetchedBooking = full?.data || full;
      } catch (fetchErr) {
        logger.warn('Failed to fetch booking details for success screen:', fetchErr.message);
        fetchedBooking = bookingResponse?.data || bookingResponse;
      }
      dispatch({ type: ACTIONS.SUBMIT_SUCCESS, payload: fetchedBooking });
    } catch (error) {
      if (pendingBookingId) {
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
  }, [selectedSavedMethodId, buildBookingPayload, clientId, service, confirmPayment, appliedPromo]);

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
    if (isMembershipBooking || isPackageBooking) {
      handleDirectConfirm();
    } else if (isPaymentNotRequired || (isCoach && !paymentsEnabled)) {
      handleDirectConfirm();
    } else if (paymentsEnabled && paymentMode === 'saved' && selectedSavedMethodId) {
      handleSavedCardPayment();
    } else if (paymentsEnabled) {
      handlePaymentConfirm();
    } else {
      handleDirectConfirm();
    }
  }, [isEditMode, handleUpdateConfirm, clientId, service, selectedResource, isCoach, isMembershipBooking, isPackageBooking, isPaymentNotRequired, paymentsEnabled, paymentMode, selectedSavedMethodId, handleDirectConfirm, handlePaymentConfirm, handleSavedCardPayment]);

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
    return true;
  }, [isSubmitting, isEditMode, bookingId, timeSlot?.start_time, membershipLoading, packageBenefitLoading, ecommerceLoading, isMembershipBooking, isPackageBooking, isPaymentNotRequired, isCoach, paymentsEnabled, paymentMode, selectedSavedMethodId, cardComplete]);

  return {
    isSubmitting,
    loadingMessage,
    showSuccess,
    createdBookingData,
    handleConfirm,
    canConfirm,
  };
};

export default useBookingSubmission;
