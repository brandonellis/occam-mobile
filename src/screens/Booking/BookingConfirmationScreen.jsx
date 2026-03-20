import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { View, ScrollView, Alert, TouchableOpacity, ActivityIndicator, Animated } from 'react-native';
import { Text, ProgressBar, Icon, TextInput, SegmentedButtons } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CardField, useConfirmPayment, StripeProvider } from '@stripe/stripe-react-native';
import config from '../../config';
import ScreenHeader from '../../components/ScreenHeader';
import Avatar from '../../components/Avatar';
import { bookingStyles as styles } from '../../styles/booking.styles';
import { formatDuration } from '../../constants/booking.constants';
import { createBooking, updateBooking, cancelBooking, getBooking } from '../../services/bookings.api';
import { createServicePayment, handlePaymentSuccess, getClientPaymentMethods } from '../../services/billing.api';
import { getCurrentClientMembership } from '../../services/accounts.api';
import { getMyBookingBenefits } from '../../services/packages.api';
import { buildPaymentSummary } from '../../helpers/pricing.helper';
import { extractErrorMessage } from '../../helpers/error.helper';
import useAuth from '../../hooks/useAuth';
import useEcommerceConfig from '../../hooks/useEcommerceConfig';
import { formatTimeInTz, formatDateInTz } from '../../helpers/timezone.helper';
import { colors } from '../../theme';
import { COACH_ROLES } from '../../constants/auth.constants';
import { confirmCancelBooking } from '../../helpers/booking.navigation.helper';
import { getBookingSteps, getBookingStepIndex } from '../../helpers/booking.helper';
import BookingStepIndicator from '../../components/BookingStepIndicator';
import { isStaffBookingRole } from '../../helpers/bookingEdit.helper';
import logger from '../../helpers/logger.helper';
import PromoCodeInput from '../../components/PromoCodeInput';

const BookingConfirmationInner = ({ route, navigation, ecommerceConfig }) => {
  const { bookingData = {} } = route.params || {};
  const { service, coach, location, client, date, timeSlot, selectedResource } = bookingData;
  const { user, activeRole, company } = useAuth();
  const { confirmPayment } = useConfirmPayment();
  const { platformFeeRate, feeDescription, paymentsEnabled, connectAccount, loading: ecommerceLoading } = ecommerceConfig;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [feeBreakdownVisible, setFeeBreakdownVisible] = useState(false);

  // Membership state
  const [membershipStatus, setMembershipStatus] = useState(null);
  const [membershipLoading, setMembershipLoading] = useState(false);
  const [membershipRefreshKey, setMembershipRefreshKey] = useState(0);

  // Package benefit state
  const [packageBenefit, setPackageBenefit] = useState(null);
  const [packageBenefitLoading, setPackageBenefitLoading] = useState(false);

  // Stripe card state
  const [cardComplete, setCardComplete] = useState(false);
  const [cardError, setCardError] = useState(null);

  // Saved payment methods state
  const [savedMethods, setSavedMethods] = useState([]);
  const [savedMethodsLoading, setSavedMethodsLoading] = useState(false);
  const [selectedSavedMethodId, setSelectedSavedMethodId] = useState(null);
  const [paymentMode, setPaymentMode] = useState('card'); // 'card' | 'saved'

  // Promo code state
  const [appliedPromo, setAppliedPromo] = useState(null);

  // Success screen state
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdBookingData, setCreatedBookingData] = useState(null);

  // Success screen entrance animation
  const successScale = useRef(new Animated.Value(0)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!showSuccess) return;
    Animated.parallel([
      Animated.spring(successScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(successOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [showSuccess, successScale, successOpacity]);

  // Skeleton pulse animation for card loading state
  const skeletonAnim = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    if (!ecommerceLoading) return;
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(skeletonAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(skeletonAnim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [ecommerceLoading, skeletonAnim]);

  const isCoach = COACH_ROLES.includes(activeRole);
  const isEditMode = Boolean(bookingData.editMode);
  const isStaffEditor = isStaffBookingRole(activeRole);
  const bookingId = bookingData.bookingId || null;
  const clientId = isCoach ? client?.id : user?.id;
  const effectiveDuration = bookingData.duration_minutes || service?.duration_minutes;
  const [bookingNotes, setBookingNotes] = useState(bookingData.notes || '');
  const [bookingStatus, setBookingStatus] = useState(bookingData.status || 'confirmed');

  // Fetch client membership status (matches web's useBookingMembership)
  useEffect(() => {
    if (isEditMode || !clientId || !service?.id) return;
    let cancelled = false;
    (async () => {
      try {
        setMembershipLoading(true);
        const membership = await getCurrentClientMembership(clientId);
        if (cancelled) return;

        if (membership?.data) {
          const stripeStatus = (membership.data.stripe_status || '').toLowerCase();
          const endDate = membership.data.end_date || membership.data.ends_at || null;
          const now = new Date();
          const notEnded = !endDate || new Date(endDate) >= now;
          const isActiveForUsage =
            stripeStatus === 'active' ||
            ((stripeStatus === 'canceled' || stripeStatus === 'cancelled') && notEnded);

          // Check pause window
          const pausedNow = !!(
            membership.data.is_paused &&
            (!membership.data.pause_start_at || now > new Date(membership.data.pause_start_at)) &&
            (!membership.data.pause_end_at || now < new Date(membership.data.pause_end_at))
          );

          if (isActiveForUsage && !pausedNow) {
            const planServices = membership.data.membership_plan?.plan_services || [];
            const serviceUsage = planServices.find((ps) => ps.service_id === service.id);
            const hasUsage =
              !!serviceUsage &&
              (serviceUsage.remaining_quantity === null || serviceUsage.remaining_quantity > 0);

            setMembershipStatus({
              hasActiveMembership: true,
              hasUsage,
              membershipId: membership.data.id,
              membershipPlanServiceId: serviceUsage?.id || null,
              planName: membership.data.membership_plan?.name,
              remainingQuantity: serviceUsage?.remaining_quantity,
              planServices,
              isPaused: false,
            });
          } else {
            setMembershipStatus({
              hasActiveMembership: false,
              hasUsage: false,
              isPaused: pausedNow,
              planName: membership.data.membership_plan?.name || null,
            });
          }
        } else {
          setMembershipStatus({ hasActiveMembership: false, hasUsage: false });
        }
      } catch (err) {
        logger.warn('Failed to fetch membership status:', err.message);
        if (!cancelled) setMembershipStatus({ hasActiveMembership: false, hasUsage: false });
      } finally {
        if (!cancelled) setMembershipLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [clientId, isEditMode, service?.id, membershipRefreshKey]);

  const isMembershipBooking =
    membershipStatus?.hasActiveMembership && membershipStatus?.hasUsage;

  // Fetch package benefit status (only for client flow, after membership resolves)
  useEffect(() => {
    if (isEditMode || !clientId || !service?.id) return;
    // Wait for membership to finish loading before checking packages
    if (membershipLoading) return;
    // If membership covers this service, skip package check
    if (isMembershipBooking) {
      setPackageBenefit(null);
      return;
    }
    // Only check for the authenticated client (not coach booking for others)
    if (isCoach) {
      setPackageBenefit(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setPackageBenefitLoading(true);
        const data = await getMyBookingBenefits(service.id);
        if (cancelled) return;
        const packages = data?.packages || [];
        if (packages.length > 0) {
          setPackageBenefit({
            hasPackage: true,
            bestPackage: packages[0],
            client_package_id: packages[0].client_package_id,
            package_name: packages[0].package_name,
            remaining: packages[0].remaining,
          });
        } else {
          setPackageBenefit({ hasPackage: false });
        }
      } catch (err) {
        logger.warn('Failed to fetch booking benefits:', err.message);
        if (!cancelled) setPackageBenefit({ hasPackage: false });
      } finally {
        if (!cancelled) setPackageBenefitLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [clientId, isEditMode, service?.id, isCoach, membershipLoading, isMembershipBooking, membershipRefreshKey]);

  const isPackageBooking = !isMembershipBooking && !!packageBenefit?.hasPackage;

  // Resolve member price from plan-service pivot (if set)
  const memberPriceCents = useMemo(() => {
    if (!membershipStatus?.hasActiveMembership || !service?.id) return null;
    const planServices = membershipStatus.planServices || [];
    const serviceUsage = planServices.find(ps => ps.service_id === service.id);
    return serviceUsage?.member_price ?? null;
  }, [membershipStatus, service?.id]);

  // Per-service toggle: service does not require upfront payment
  const isPaymentNotRequired = service?.payment_required === false;

  // Whether coach needs to collect payment (no membership, no package, payment required, payments enabled)
  const coachNeedsPayment = isCoach && !isMembershipBooking && !isPackageBooking && !isPaymentNotRequired && paymentsEnabled;

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
        logger.warn('Failed to fetch saved payment methods:', err.message);
        if (!cancelled) setSavedMethods([]);
      } finally {
        if (!cancelled) setSavedMethodsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [clientId, isCoach, isEditMode, isMembershipBooking, isPackageBooking, paymentsEnabled]);

  // Build payment summary (matches web's usePaymentSummary)
  const summary = buildPaymentSummary({
    service,
    durationMinutes: bookingData.duration_minutes || null,
    platformFeeRate,
    isMembershipBooking: !!isMembershipBooking,
    isPackageBooking,
    memberPriceCents,
    discountAmount: appliedPromo?.discount_amount ? Number(appliedPromo.discount_amount) : 0,
  });

  const formattedDate = timeSlot?.start_time
    ? formatDateInTz(timeSlot.start_time, company, 'long')
    : date
      ? new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })
      : '';

  // Build the booking payload (shared between membership, package, and payment flows)
  const buildBookingPayload = useCallback((status = 'confirmed') => {
    // Resolve booking type: membership > package > one_off
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

    // Include resource_ids when a resource was auto-selected (required by backend for requires_resource services)
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

    // Package booking — attach client_package_id for backend usage tracking
    if (isPackageBooking && packageBenefit?.client_package_id) {
      payload.client_package_id = packageBenefit.client_package_id;
    }

    // Class/group session booking — attach the class_session_id so the backend
    // links this booking to the correct session occurrence.
    if (bookingData.selectedClassSession?.id) {
      payload.class_session_id = bookingData.selectedClassSession.id;
    }

    return payload;
  }, [clientId, isMembershipBooking, isPackageBooking, location, service, coach, timeSlot, bookingData, membershipStatus, packageBenefit, bookingNotes]);

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
      setIsSubmitting(true);
      setLoadingMessage('Creating booking...');
      const payload = buildBookingPayload('confirmed');
      const result = await createBooking(payload);
      const booking = result?.data || result;
      setCreatedBookingData(booking);
      // Refresh membership data so allotment display reflects the consumed usage
      setMembershipRefreshKey(prev => prev + 1);
      setShowSuccess(true);
    } catch (error) {
      Alert.alert('Booking Failed', extractErrorMessage(error));
    } finally {
      setIsSubmitting(false);
      setLoadingMessage('');
    }
  }, [buildBookingPayload]);

  const handleUpdateConfirm = useCallback(async () => {
    if (!bookingId) {
      Alert.alert('Error', 'Booking information is missing.');
      return;
    }

    try {
      setIsSubmitting(true);
      setLoadingMessage('Updating booking...');
      const result = await updateBooking(bookingId, buildUpdatePayload());
      setCreatedBookingData(result?.data || result);
      setShowSuccess(true);
    } catch (error) {
      Alert.alert('Update Failed', extractErrorMessage(error));
    } finally {
      setIsSubmitting(false);
      setLoadingMessage('');
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
      setIsSubmitting(true);

      // PHASE 1: Create pending booking
      setLoadingMessage('Creating booking...');
      const payload = buildBookingPayload('pending');
      const bookingResponse = await createBooking(payload);
      pendingBookingId = bookingResponse?.data?.id || bookingResponse?.id;

      // PHASE 2: Create payment intent
      setLoadingMessage('Setting up payment...');
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
      setLoadingMessage('Processing payment...');
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
      setLoadingMessage('Finalizing...');
      await handlePaymentSuccess(paymentIntent.id);

      // Payment succeeded — clear the pendingBookingId so catch block won't cancel it
      const confirmedBookingId = pendingBookingId;
      pendingBookingId = null;

      // Fetch full booking for success screen
      try {
        const full = await getBooking(confirmedBookingId);
        setCreatedBookingData(full?.data || full);
      } catch (fetchErr) {
        logger.warn('Failed to fetch booking details for success screen:', fetchErr.message);
        setCreatedBookingData(bookingResponse?.data || bookingResponse);
      }
      setShowSuccess(true);
    } catch (error) {
      // Clean up the pending booking so the time slot isn't blocked
      if (pendingBookingId) {
        try {
          await cancelBooking(pendingBookingId);
        } catch (cancelErr) {
          logger.warn('Failed to cancel pending booking after payment failure:', cancelErr.message);
        }
      }
      Alert.alert('Payment Failed', extractErrorMessage(error));
    } finally {
      setIsSubmitting(false);
      setLoadingMessage('');
    }
  }, [
    cardComplete, buildBookingPayload, clientId, service,
    client, user, isCoach, confirmPayment,
  ]);

  // Handle saved card payment
  const handleSavedCardPayment = useCallback(async () => {
    if (!selectedSavedMethodId) {
      Alert.alert('Card Required', 'Please select a saved card to proceed.');
      return;
    }

    let pendingBookingId = null;

    try {
      setIsSubmitting(true);

      // PHASE 1: Create pending booking
      setLoadingMessage('Creating booking...');
      const payload = buildBookingPayload('pending');
      const bookingResponse = await createBooking(payload);
      pendingBookingId = bookingResponse?.data?.id || bookingResponse?.id;

      // PHASE 2: Create payment intent with saved card
      setLoadingMessage('Processing payment...');
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
        setLoadingMessage('Confirming payment...');
        const { error: confirmError } = await confirmPayment(piResponse.client_secret, {
          paymentMethodType: 'Card',
        });
        if (confirmError) throw new Error(confirmError.message || 'Payment confirmation failed.');
        await handlePaymentSuccess(piResponse.payment_intent_id);
      } else if (piResponse.status === 'succeeded') {
        await handlePaymentSuccess(piResponse.payment_intent_id);
      }

      pendingBookingId = null;

      // Fetch full booking for success screen
      try {
        const full = await getBooking(bookingResponse?.data?.id || bookingResponse?.id);
        setCreatedBookingData(full?.data || full);
      } catch (fetchErr) {
        logger.warn('Failed to fetch booking details for success screen:', fetchErr.message);
        setCreatedBookingData(bookingResponse?.data || bookingResponse);
      }
      setShowSuccess(true);
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
      setIsSubmitting(false);
      setLoadingMessage('');
    }
  }, [selectedSavedMethodId, buildBookingPayload, clientId, service, confirmPayment]);

  // Main confirm handler — routes to membership, payment, or no-payment flow
  const handleConfirm = useCallback(() => {
    if (isEditMode) {
      handleUpdateConfirm();
      return;
    }
    if (!clientId) {
      Alert.alert('Error', 'Client information is missing.');
      return;
    }
    // Pre-flight validation: service requires a resource but none was auto-selected
    if (service?.requires_resource && !selectedResource?.id) {
      Alert.alert(
        'Unavailable',
        'No resources are available for this time slot. Please go back and choose a different time.',
      );
      return;
    }
    if (isMembershipBooking || isPackageBooking) {
      handleDirectConfirm();
    } else if (isCoach && !paymentsEnabled) {
      // Coach flow without payments enabled: create confirmed booking directly
      handleDirectConfirm();
    } else if (isCoach && isPaymentNotRequired) {
      // Coach flow with service that doesn't require payment
      handleDirectConfirm();
    } else if (isPaymentNotRequired) {
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
    // Service doesn't require payment — allow booking without card
    if (isPaymentNotRequired) return true;
    // Coach flow without payments enabled — allow direct booking
    if (isCoach && !paymentsEnabled) return true;
    // Saved card selected — allow if a method is chosen (both coach and client)
    if (paymentsEnabled && paymentMode === 'saved') return !!selectedSavedMethodId;
    // One-off payment — require card if payments are enabled (both coach and client)
    if (paymentsEnabled) return cardComplete;
    // Payments not enabled — allow booking without payment
    return true;
  }, [isSubmitting, isEditMode, bookingId, timeSlot?.start_time, membershipLoading, packageBenefitLoading, ecommerceLoading, isMembershipBooking, isPackageBooking, isPaymentNotRequired, isCoach, paymentsEnabled, paymentMode, selectedSavedMethodId, cardComplete]);

  // Allotment progress bars for membership
  const renderAllotmentSection = () => {
    if (isEditMode) return null;
    if (membershipLoading || ecommerceLoading) {
      return (
        <View style={styles.allotmentSection}>
          <Text style={styles.allotmentTitle}>Payment</Text>
          <Animated.View style={[styles.skeletonBlock, { opacity: skeletonAnim }]}>
            <View style={styles.skeletonBar} />
            <View style={[styles.skeletonBar, { width: '60%' }]} />
          </Animated.View>
        </View>
      );
    }

    // No membership at all
    if (!membershipStatus?.hasActiveMembership && membershipStatus !== null) {
      // Coach sees a calm informational banner — not a warning
      if (isCoach) {
        return (
          <View style={styles.allotmentSection}>
            <Text style={styles.allotmentTitle}>Payment</Text>
            <View style={styles.coachInfoBanner}>
              <Text style={styles.coachInfoBannerText}>
                {membershipStatus.isPaused
                  ? `${client?.first_name || 'This client'}'s membership is currently paused.`
                  : `${client?.first_name || 'This client'} doesn't have an active membership.`}
                {coachNeedsPayment
                  ? ' Payment will be collected below.'
                  : ' This booking will be created as confirmed.'}
              </Text>
            </View>
          </View>
        );
      }
      // Client sees the standard membership status with payment info
      return (
        <View style={styles.allotmentSection}>
          <Text style={styles.allotmentTitle}>
            {membershipStatus.planName || 'Membership Status'}
          </Text>
          <View style={styles.allotmentNoMembership}>
            <Text style={styles.allotmentNoMembershipText}>
              {membershipStatus.isPaused
                ? 'Your membership is paused. Benefits are temporarily unavailable.'
                : "You don't currently have an active membership."}
            </Text>
            <Text style={[styles.allotmentNoMembershipText, styles.allotmentSubtext]}>
              Payment will be processed as a one-time booking.
            </Text>
          </View>
        </View>
      );
    }

    // Has membership — show allotment for all plan services
    if (membershipStatus?.hasActiveMembership && membershipStatus?.planServices?.length > 0) {
      const planServices = membershipStatus.planServices;

      return (
        <View style={styles.allotmentSection}>
          <Text style={styles.allotmentTitle}>
            {membershipStatus.planName || 'Membership'} — Service Usage This Cycle
          </Text>
          {planServices.map((ps) => {
            const serviceName = ps.service?.name || `Service ${ps.service_id}`;
            const total = ps.quantity || 0;
            const used = ps.used_quantity || 0;
            const remaining = ps.remaining_quantity != null
              ? ps.remaining_quantity
              : Math.max(0, total - used);
            const progress = total > 0 ? used / total : 0;
            const isCurrent = ps.service_id === service?.id;

            return (
              <View
                key={ps.service_id || ps.id}
                style={[styles.allotmentItem, isCurrent && styles.allotmentItemCurrent]}
              >
                <View style={styles.allotmentServiceRow}>
                  <Text
                    style={[
                      styles.allotmentServiceName,
                      isCurrent && styles.allotmentServiceNameCurrent,
                    ]}
                  >
                    {serviceName} {isCurrent ? '(Current)' : ''}
                  </Text>
                  <Text
                    style={[
                      styles.allotmentUsageText,
                      { color: remaining > 0 ? colors.success : colors.error },
                    ]}
                  >
                    {used}/{total}
                  </Text>
                </View>
                <ProgressBar
                  progress={Math.min(progress, 1)}
                  color={remaining > 0 ? colors.success : colors.error}
                  style={styles.allotmentProgressBar}
                />
                <View style={styles.allotmentRemainingRow}>
                  <Text style={styles.allotmentRemainingText}>
                    {remaining > 0 ? `${remaining} remaining` : 'Limit reached'}
                  </Text>
                </View>
              </View>
            );
          })}

          {/* Warning if current service has no remaining usage */}
          {!membershipStatus.hasUsage && (
            <View style={isCoach ? styles.coachInfoBanner : styles.allotmentWarningBanner}>
              <Text style={isCoach ? styles.coachInfoBannerText : styles.allotmentNoMembershipText}>
                {isCoach
                  ? `This service isn't covered by ${client?.first_name || 'the client'}'s plan, or the allotment has been used.${coachNeedsPayment ? ' Payment will be collected below.' : ' The booking will be created as confirmed.'}`
                  : "This service isn't covered by your plan, or you've reached the allotment limit. Payment will be processed as a one-time booking."}
              </Text>
            </View>
          )}
        </View>
      );
    }

    return null;
  };

  // Stripe card input for one-off bookings (shown for both client and coach when payment is needed)
  const renderCardSection = () => {
    if (isEditMode) return null;
    // Already know no payment needed — skip entirely
    if (isMembershipBooking || isPackageBooking || isPaymentNotRequired) return null;

    // Show skeleton while membership or ecommerce config is loading
    if (membershipLoading || ecommerceLoading) {
      return (
        <View style={styles.cardSection}>
          <Text style={styles.cardSectionTitle}>Payment Method</Text>
          <Animated.View style={[styles.skeletonBlock, { opacity: skeletonAnim }]}>
            <View style={[styles.skeletonBar, { height: 44, borderRadius: 8 }]} />
          </Animated.View>
        </View>
      );
    }

    // Coach flow: only show card section when payments are enabled
    if (isCoach && !paymentsEnabled) return null;

    if (!paymentsEnabled) {
      return (
        <View style={styles.cardSection}>
          <Text style={styles.cardSectionTitle}>Payment Method</Text>
          <View style={styles.paymentDisabledBanner}>
            <Text style={styles.paymentDisabledText}>
              Card payments are not yet available. Your booking will be created and payment can be collected later.
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.cardSection}>
        <Text style={styles.cardSectionTitle}>Payment Method</Text>

        {/* Saved card / New card toggle */}
        {savedMethods.length > 0 && (
          <View style={styles.paymentModeToggle}>
            <TouchableOpacity
              style={[styles.paymentModeOption, paymentMode === 'saved' && styles.paymentModeOptionActive]}
              onPress={() => setPaymentMode('saved')}
              activeOpacity={0.7}
            >
              <Text style={[styles.paymentModeText, paymentMode === 'saved' && styles.paymentModeTextActive]}>
                Saved Card
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.paymentModeOption, paymentMode === 'card' && styles.paymentModeOptionActive]}
              onPress={() => setPaymentMode('card')}
              activeOpacity={0.7}
            >
              <Text style={[styles.paymentModeText, paymentMode === 'card' && styles.paymentModeTextActive]}>
                New Card
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {paymentMode === 'saved' && savedMethods.length > 0 ? (
          <View>
            {savedMethods.map((method) => {
              const card = method.card || {};
              const isSelected = selectedSavedMethodId === method.id;
              return (
                <TouchableOpacity
                  key={method.id}
                  style={[styles.savedCardItem, isSelected && styles.savedCardItemSelected]}
                  onPress={() => setSelectedSavedMethodId(method.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.savedCardInfo}>
                    <Icon
                      source="credit-card-outline"
                      size={22}
                      color={isSelected ? colors.accent : colors.textTertiary}
                    />
                    <View>
                      <Text style={[styles.savedCardBrand, isSelected && styles.savedCardTextSelected]}>
                        {(card.brand || 'Card').toUpperCase()}
                      </Text>
                      <Text style={[styles.savedCardLast4, isSelected && styles.savedCardTextSelected]}>
                        •••• {card.last4 || '????'}
                        {card.exp_month && card.exp_year && (
                          <Text style={styles.savedCardExpiry}>
                            {'  '}{String(card.exp_month).padStart(2, '0')}/{String(card.exp_year).slice(-2)}
                          </Text>
                        )}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.savedCardRadio, isSelected && styles.savedCardRadioSelected]}>
                    {isSelected && <View style={styles.savedCardRadioDot} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <>
            <CardField
              postalCodeEnabled={false}
              placeholders={{ number: '4242 4242 4242 4242' }}
              cardStyle={{
                backgroundColor: colors.background,
                textColor: colors.textPrimary,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                fontSize: 16,
                placeholderColor: colors.textTertiary,
              }}
              style={styles.cardField}
              onCardChange={(details) => {
                setCardComplete(details.complete);
                setCardError(details.validationError?.message || null);
              }}
            />
            {cardError && <Text style={styles.cardError}>{cardError}</Text>}
          </>
        )}
      </View>
    );
  };

  // Success confirmation screen
  if (showSuccess) {
    const successService = createdBookingData?.services?.[0] || service;
    const successCoach = createdBookingData?.coaches?.[0] || coach;
    const successLocation = createdBookingData?.location || location;
    const successResource = createdBookingData?.resources?.[0] || selectedResource;
    const bookingCode = createdBookingData?.booking_code;
    const clientName = client ? `${client.first_name}` : null;

    const getSuccessSubtitle = () => {
      if (isEditMode) {
        return 'Your booking changes have been saved.';
      }
      if (isMembershipBooking && isCoach && clientName) {
        return `${clientName}'s membership session is all set.`;
      }
      if (isMembershipBooking) {
        return 'Your membership session is all set.';
      }
      if (isPackageBooking) {
        return 'Your package session is all set. No payment needed.';
      }
      if (isCoach && clientName) {
        return `${clientName}'s session has been booked.`;
      }
      if (isCoach) {
        return 'The session has been booked for your client.';
      }
      return 'Your session is all set. See you there!';
    };

    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={[styles.scrollContent, styles.successContainer]}>
          {/* Animated checkmark icon */}
          <Animated.View style={[
            styles.successIconCircle,
            { transform: [{ scale: successScale }], opacity: successOpacity },
          ]}>
            <Icon source="check-bold" size={40} color={colors.white} />
          </Animated.View>

          <Animated.View style={{ opacity: successOpacity, alignItems: 'center' }}>
            <Text style={styles.successTitle}>{isEditMode ? 'Booking Updated' : 'Booking Confirmed'}</Text>
            <Text style={styles.successSubtitle}>{getSuccessSubtitle()}</Text>
          </Animated.View>

          {/* Booking code — only show real codes, not raw numeric IDs */}
          {bookingCode && typeof bookingCode === 'string' && !/^\d+$/.test(bookingCode) && (
            <Animated.View style={[styles.successCodeContainer, { opacity: successOpacity }]}>
              <Text style={styles.successCodeLabel}>BOOKING REFERENCE</Text>
              <Text style={styles.successCodeValue}>{bookingCode}</Text>
            </Animated.View>
          )}

          <Animated.View style={[styles.successDetailsCard, { opacity: successOpacity }]}>
            {successService && (
              <>
                <Text style={styles.successDetailLabel}>SERVICE</Text>
                <Text style={styles.successDetailValue}>{successService.name}</Text>
              </>
            )}
            {successCoach && (
              <>
                <View style={styles.successDetailDivider} />
                <Text style={styles.successDetailLabel}>COACH</Text>
                <View style={styles.successDetailRow}>
                  <Avatar
                    uri={successCoach.avatar_url}
                    name={`${successCoach.first_name} ${successCoach.last_name}`}
                    size={28}
                  />
                  <Text style={[styles.successDetailValue, styles.successDetailValueWithMargin]}>
                    {successCoach.first_name} {successCoach.last_name}
                  </Text>
                </View>
              </>
            )}
            {successLocation && (
              <>
                <View style={styles.successDetailDivider} />
                <Text style={styles.successDetailLabel}>LOCATION</Text>
                <Text style={styles.successDetailValue}>{successLocation.name}</Text>
              </>
            )}
            {successResource?.name && (
              <>
                <View style={styles.successDetailDivider} />
                <Text style={styles.successDetailLabel}>RESOURCE</Text>
                <Text style={styles.successDetailValue}>{successResource.name}</Text>
              </>
            )}
            <View style={styles.successDetailDivider} />
            <Text style={styles.successDetailLabel}>DATE & TIME</Text>
            <Text style={styles.successDetailValue}>{formattedDate}</Text>
            <Text style={styles.successDetailTime}>
              {formatTimeInTz(timeSlot?.start_time, company)}
              {timeSlot?.end_time ? ` – ${formatTimeInTz(timeSlot.end_time, company)}` : ''}
            </Text>
          </Animated.View>
        </ScrollView>

        <View style={styles.successBottomBar}>
          {!isEditMode && isCoach && (
            <TouchableOpacity
              style={styles.successSecondaryButton}
              onPress={() => navigation.popToTop()}
              activeOpacity={0.7}
            >
              <Text style={styles.successSecondaryButtonText}>Back to Schedule</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.continueButton, (!isCoach || isEditMode) && styles.successPrimaryFull]}
            onPress={() => navigation.popToTop()}
            activeOpacity={0.8}
          >
            <Text style={styles.continueButtonText}>
              {isEditMode ? 'Done' : isCoach ? 'Book Another Session' : 'Done'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScreenHeader
        title={isEditMode ? 'Update Booking' : 'Confirm Booking'}
        onBack={() => navigation.goBack()}
        onClose={() => confirmCancelBooking(navigation)}
      />
      {!isEditMode && (() => {
        const steps = getBookingSteps({ service, hasMultipleLocations: bookingData?.hasMultipleLocations, isCoach: COACH_ROLES.includes(activeRole) });
        return <BookingStepIndicator currentStep={steps.length} totalSteps={steps.length} />;
      })()}

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: 8 }]}>
        {/* Client (shown only for coach booking) */}
        {isCoach && client && (
          <View style={styles.confirmSection}>
            <Text style={styles.confirmLabel}>CLIENT</Text>
            <View style={styles.confirmRowWithAvatar}>
              <Avatar
                uri={client.avatar_url}
                name={`${client.first_name} ${client.last_name}`}
                size={40}
              />
              <Text style={[styles.confirmValue, styles.confirmValueWithMargin]}>
                {client.first_name} {client.last_name}
              </Text>
            </View>
          </View>
        )}

        {/* Booking Details — consolidated card */}
        <View style={styles.confirmSection}>
          {location && (
            <>
              <Text style={styles.confirmLabel}>LOCATION</Text>
              <Text style={styles.confirmValue}>{location.name}</Text>
              <View style={styles.confirmDivider} />
            </>
          )}

          <Text style={styles.confirmLabel}>SERVICE</Text>
          <Text style={styles.confirmValue}>{service?.name}</Text>
          <View style={styles.confirmDivider} />
          <View style={styles.confirmRow}>
            <View>
              <Text style={styles.confirmLabel}>DURATION</Text>
              <Text style={styles.confirmValue}>
                {formatDuration(effectiveDuration)}
              </Text>
            </View>
            <View style={styles.confirmPriceColumn}>
              <Text style={styles.confirmLabel}>PRICE</Text>
              <Text style={styles.confirmValue}>
                {summary.subtotalFormatted}
              </Text>
            </View>
          </View>

          {coach && (
            <>
              <View style={styles.confirmDivider} />
              <Text style={styles.confirmLabel}>COACH</Text>
              <View style={styles.confirmRowWithAvatar}>
                <Avatar
                  uri={coach.avatar_url}
                  name={`${coach.first_name} ${coach.last_name}`}
                  size={32}
                />
                <Text style={[styles.confirmValue, styles.confirmValueWithMargin]}>
                  {coach.first_name} {coach.last_name}
                </Text>
              </View>
            </>
          )}

          {selectedResource?.name && (
            <>
              <View style={styles.confirmDivider} />
              <Text style={styles.confirmLabel}>RESOURCE</Text>
              <Text style={styles.confirmValue}>{selectedResource.name}</Text>
            </>
          )}

          <View style={styles.confirmDivider} />
          <Text style={styles.confirmLabel}>DATE & TIME</Text>
          <Text style={styles.confirmValue}>{formattedDate}</Text>
          <Text
            style={[styles.confirmValue, styles.confirmTimeSubtext, { color: colors.textSecondary }]}
          >
            {formatTimeInTz(timeSlot?.start_time, company)}
            {timeSlot?.end_time ? ` — ${formatTimeInTz(timeSlot.end_time, company)}` : ''}
          </Text>
        </View>

        {isEditMode && (
          <View style={styles.confirmSection}>
            <Text style={styles.confirmLabel}>STATUS</Text>
            <SegmentedButtons
              value={bookingStatus}
              onValueChange={setBookingStatus}
              style={styles.editStatusControl}
              buttons={[
                { value: 'pending', label: 'Pending' },
                { value: 'confirmed', label: 'Confirmed' },
                { value: 'cancelled', label: 'Cancelled' },
              ]}
            />
            <View style={styles.confirmDivider} />
            <TextInput
              mode="outlined"
              label="Notes"
              value={bookingNotes}
              onChangeText={setBookingNotes}
              style={styles.editNotesInput}
              multiline
              numberOfLines={4}
            />
          </View>
        )}

        {renderAllotmentSection()}

        {!isEditMode && !membershipLoading && !ecommerceLoading && isMembershipBooking && (
          <View style={[styles.confirmSection, { backgroundColor: colors.successLight }]}>
            <Text style={[styles.confirmLabel, { color: colors.success }]}>
              INCLUDED WITH MEMBERSHIP
            </Text>
            <Text style={[styles.confirmSubtext, { color: colors.textSecondary, marginTop: 2 }]}>
              {isCoach
                ? `This session will use ${client?.first_name || 'the client'}'s membership allotment.`
                : 'This session will use your membership allotment. No payment needed.'}
            </Text>
          </View>
        )}

        {!isEditMode && !membershipLoading && !isMembershipBooking && packageBenefitLoading && (
          <View style={[styles.confirmSection]}>
            <Animated.View style={[styles.skeletonBlock, { opacity: skeletonAnim }]}>
              <View style={[styles.skeletonBar, { width: '50%' }]} />
              <View style={[styles.skeletonBar, { width: '80%' }]} />
            </Animated.View>
          </View>
        )}

        {!isEditMode && !membershipLoading && !packageBenefitLoading && !ecommerceLoading && isPackageBooking && (
          <View style={[styles.confirmSection, { backgroundColor: colors.successLight }]}>
            <Text style={[styles.confirmLabel, { color: colors.success }]}>
              COVERED BY PACKAGE
            </Text>
            <Text style={[styles.confirmSubtext, { color: colors.textSecondary, marginTop: 2 }]}>
              {packageBenefit?.package_name || 'Package'} — {packageBenefit?.remaining ?? '?'} use{packageBenefit?.remaining !== 1 ? 's' : ''} remaining. No payment needed.
            </Text>
          </View>
        )}

        {!isEditMode && !membershipLoading && !ecommerceLoading && !isMembershipBooking && isPaymentNotRequired && (
          <View style={[styles.confirmSection, { backgroundColor: colors.successLight }]}>
            <Text style={[styles.confirmLabel, { color: colors.success }]}>
              NO UPFRONT PAYMENT
            </Text>
            <Text style={[styles.confirmSubtext, { color: colors.textSecondary, marginTop: 2 }]}>
              {isCoach
                ? 'This service does not require payment at booking. Payment can be collected separately.'
                : 'No payment is needed right now. Payment may be collected at your appointment.'}
            </Text>
          </View>
        )}

        {!isEditMode && !membershipLoading && !ecommerceLoading && !isMembershipBooking && !isPackageBooking && !isPaymentNotRequired && paymentsEnabled && (
          <View style={styles.confirmSection}>
            <Text style={styles.confirmLabel}>PROMO CODE</Text>
            <PromoCodeInput
              serviceId={service?.id}
              locationId={location?.id}
              clientId={clientId}
              servicePrice={service?.price}
              onApply={(promoData) => setAppliedPromo(promoData)}
              onRemove={() => setAppliedPromo(null)}
              disabled={isSubmitting}
            />
          </View>
        )}

        {renderCardSection()}

        {!isEditMode && (
          (membershipLoading || ecommerceLoading) ? (
            <View style={styles.confirmSection}>
              <Text style={styles.confirmLabel}>PAYMENT SUMMARY</Text>
              <Animated.View style={[styles.skeletonBlock, { opacity: skeletonAnim }]}>
                <View style={styles.skeletonRow}>
                  <View style={[styles.skeletonBar, { width: '35%' }]} />
                  <View style={[styles.skeletonBar, { width: '15%' }]} />
                </View>
                <View style={styles.skeletonRow}>
                  <View style={[styles.skeletonBar, { width: '40%' }]} />
                  <View style={[styles.skeletonBar, { width: '15%' }]} />
                </View>
                <View style={[styles.confirmDivider, styles.totalDivider]} />
                <View style={styles.skeletonRow}>
                  <View style={[styles.skeletonBar, { width: '25%', height: 18 }]} />
                  <View style={[styles.skeletonBar, { width: '20%', height: 18 }]} />
                </View>
              </Animated.View>
            </View>
          ) : (
            <View style={styles.confirmSection}>
              <Text style={styles.confirmLabel}>PAYMENT SUMMARY</Text>

              <View style={[styles.confirmRow, styles.summaryFeesRow]}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={[styles.summaryValue, appliedPromo && { textDecorationLine: 'line-through', color: colors.textTertiary }]}>
                  {summary.subtotalFormatted}
                </Text>
              </View>

              {appliedPromo && (
                <View style={[styles.confirmRow, styles.summaryFeesRow]}>
                  <Text style={[styles.summaryLabel, { color: colors.success }]}>Promo: {appliedPromo.code}</Text>
                  <Text style={[styles.summaryValue, { color: colors.success }]}>-${Number(appliedPromo.discount_amount || 0).toFixed(2)}</Text>
                </View>
              )}

              <View style={styles.summaryFeesRow}>
                <View style={styles.confirmRow}>
                  <View style={styles.summaryFeesInner}>
                    <Text style={styles.summaryLabel}>Taxes and Fees</Text>
                    <TouchableOpacity
                      onPress={() => setFeeBreakdownVisible((v) => !v)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      style={styles.summaryInfoButton}
                    >
                      <Text style={[styles.summaryInfoIcon, { color: colors.primary }]}>ⓘ</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.summaryValue}>
                    {summary.platformFeeFormatted}
                  </Text>
                </View>

                {feeBreakdownVisible && (
                  <View style={styles.feeBreakdown}>
                    <Text style={styles.feeBreakdownTitle}>Breakdown:</Text>
                    <Text style={styles.feeBreakdownItem}>
                      Platform Fee ({summary.platformFeePercent}%): {summary.platformFeeFormatted}
                    </Text>
                    <Text style={styles.feeBreakdownDesc}>
                      {feeDescription}
                    </Text>
                  </View>
                )}
              </View>

              <View style={[styles.confirmDivider, styles.totalDivider]} />

              <View style={styles.confirmRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalPrice}>{summary.totalFormatted}</Text>
              </View>
            </View>
          )
        )}
      </ScrollView>

      <View style={styles.bottomBar}>
        {loadingMessage ? (
          <View style={styles.loadingBar}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.loadingBarText, { color: colors.textSecondary }]}>{loadingMessage}</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.continueButton, !canConfirm && styles.continueButtonDisabled]}
            onPress={handleConfirm}
            disabled={!canConfirm}
            activeOpacity={0.8}
            testID="confirm-booking-button"
          >
            {isSubmitting ? (
              <ActivityIndicator color={colors.textInverse} />
            ) : (
              <Text style={styles.continueButtonText}>
                {isEditMode
                  ? 'Update Booking'
                  : isMembershipBooking || isPackageBooking
                    ? 'Confirm Session'
                    : isCoach && !coachNeedsPayment
                      ? 'Book Session'
                      : isPaymentNotRequired || !paymentsEnabled
                        ? 'Confirm Booking'
                        : `Pay ${summary.totalFormatted}`}
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

/**
 * Outer wrapper that provides a StripeProvider scoped to the tenant's
 * Stripe Connect account. This ensures useConfirmPayment() inside
 * BookingConfirmationInner targets the correct connected account
 * for direct charges.
 */
const BookingConfirmationScreen = (props) => {
  const ecommerceConfig = useEcommerceConfig();
  const { connectAccount, loading } = ecommerceConfig;

  return (
    <StripeProvider
      publishableKey={config.stripePublishableKey}
      stripeAccountId={connectAccount || undefined}
    >
      <BookingConfirmationInner {...props} ecommerceConfig={ecommerceConfig} />
    </StripeProvider>
  );
};

export default BookingConfirmationScreen;
