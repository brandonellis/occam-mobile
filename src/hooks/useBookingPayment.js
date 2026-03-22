import { useState, useEffect, useCallback } from 'react';
import { getClientPaymentMethods } from '../services/billing.api';
import logger from '../helpers/logger.helper';

/**
 * Manages Stripe payment input state and saved payment methods.
 * Handles the CardField state (complete/error) and fetches saved
 * payment methods for the booking client.
 *
 * Does NOT own submission logic — that lives in useBookingSubmission.
 */
const useBookingPayment = ({
  clientId,
  isEditMode,
  isCoach,
  paymentsEnabled,
  isMembershipBooking,
  isPackageBooking,
}) => {
  // Stripe card state
  const [cardComplete, setCardComplete] = useState(false);
  const [cardError, setCardError] = useState(null);

  // Saved payment methods state
  const [savedMethods, setSavedMethods] = useState([]);
  const [savedMethodsLoading, setSavedMethodsLoading] = useState(false);
  const [selectedSavedMethodId, setSelectedSavedMethodId] = useState(null);
  const [paymentMode, setPaymentMode] = useState('card'); // 'card' | 'saved'

  const onCardChange = useCallback((details) => {
    setCardComplete(details.complete);
    setCardError(details.validationError?.message || null);
  }, []);

  // Fetch saved payment methods for the booking client
  useEffect(() => {
    if (isEditMode) return;
    if (!clientId) return;
    // Skip for membership or package bookings (no payment needed)
    if (isMembershipBooking || isPackageBooking) return;
    // For client flow, always fetch; for coach flow, only when payment is needed
    if (isCoach && !paymentsEnabled) return;

    let cancelled = false;

    (async () => {
      try {
        setSavedMethodsLoading(true);
        const resp = await getClientPaymentMethods(clientId);
        const methods = resp?.payment_methods || resp?.data || [];
        if (!cancelled) {
          const list = Array.isArray(methods) ? methods : [];
          setSavedMethods(list);
          if (list.length > 0) {
            setPaymentMode('saved');
            setSelectedSavedMethodId(list[0]?.id || null);
          }
        }
      } catch (err) {
        logger.error('Failed to fetch saved payment methods:', err.message);
        if (!cancelled) setSavedMethods([]);
      } finally {
        if (!cancelled) setSavedMethodsLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [clientId, isCoach, isEditMode, isMembershipBooking, isPackageBooking, paymentsEnabled]);

  return {
    cardComplete,
    cardError,
    onCardChange,
    savedMethods,
    savedMethodsLoading,
    selectedSavedMethodId,
    setSelectedSavedMethodId,
    paymentMode,
    setPaymentMode,
  };
};

export default useBookingPayment;
