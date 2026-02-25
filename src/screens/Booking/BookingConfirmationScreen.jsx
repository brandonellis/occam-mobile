import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { View, ScrollView, Alert, TouchableOpacity, ActivityIndicator, Animated } from 'react-native';
import { Text, ProgressBar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CardField, useConfirmPayment, StripeProvider } from '@stripe/stripe-react-native';
import config from '../../config';
import ScreenHeader from '../../components/ScreenHeader';
import Avatar from '../../components/Avatar';
import { bookingStyles as styles } from '../../styles/booking.styles';
import { formatDuration } from '../../constants/booking.constants';
import { createBooking, cancelBooking } from '../../services/bookings.api';
import { createServicePayment, handlePaymentSuccess } from '../../services/billing.api';
import { getCurrentClientMembership } from '../../services/accounts.api';
import {
  buildPaymentSummary,
  formatCurrency,
} from '../../helpers/pricing.helper';
import { extractErrorMessage } from '../../helpers/error.helper';
import useAuth from '../../hooks/useAuth';
import useEcommerceConfig from '../../hooks/useEcommerceConfig';
import { colors } from '../../theme';
import { COACH_ROLES } from '../../constants/auth.constants';

const BookingConfirmationInner = ({ route, navigation, ecommerceConfig }) => {
  const { bookingData = {} } = route.params || {};
  const { service, coach, location, client, date, timeSlot, selectedResource } = bookingData;
  const { user, activeRole } = useAuth();
  const { confirmPayment } = useConfirmPayment();
  const { platformFeeRate, feeDescription, paymentsEnabled, connectAccount, loading: ecommerceLoading } = ecommerceConfig;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [feeBreakdownVisible, setFeeBreakdownVisible] = useState(false);

  // Membership state
  const [membershipStatus, setMembershipStatus] = useState(null);
  const [membershipLoading, setMembershipLoading] = useState(false);

  // Stripe card state
  const [cardComplete, setCardComplete] = useState(false);
  const [cardError, setCardError] = useState(null);

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
  const clientId = isCoach ? client?.id : user?.id;
  const effectiveDuration = bookingData.duration_minutes || service?.duration_minutes;

  // Fetch client membership status (matches web's useBookingMembership)
  useEffect(() => {
    if (!clientId || !service?.id) return;
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
        console.warn('Failed to fetch membership status:', err.message);
        if (!cancelled) setMembershipStatus({ hasActiveMembership: false, hasUsage: false });
      } finally {
        if (!cancelled) setMembershipLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [clientId, service?.id]);

  const isMembershipBooking =
    membershipStatus?.hasActiveMembership && membershipStatus?.hasUsage;

  // Determine if one-off payment is required
  const requiresPayment = !isMembershipBooking && !membershipLoading && membershipStatus !== null;

  // Build payment summary (matches web's usePaymentSummary)
  const summary = buildPaymentSummary({
    service,
    durationMinutes: bookingData.duration_minutes || null,
    platformFeeRate,
    isMembershipBooking: !!isMembershipBooking,
  });

  const formattedDate = date
    ? new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  const formatSlotTime = (isoStr) => {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
  };

  // Build the booking payload (shared between membership and payment flows)
  const buildBookingPayload = useCallback((status = 'confirmed') => {
    const payload = {
      client_id: clientId,
      booking_type: isMembershipBooking ? 'membership' : 'one_off',
      location_id: location?.id,
      service_ids: [service?.id],
      start_time: timeSlot?.start_time,
      end_time: timeSlot?.end_time,
      status,
      notes: bookingData.notes || '',
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

    return payload;
  }, [clientId, isMembershipBooking, location, service, coach, timeSlot, bookingData, membershipStatus]);

  // Handle membership booking (no payment needed)
  const handleMembershipConfirm = useCallback(async () => {
    try {
      setIsSubmitting(true);
      setLoadingMessage('Creating booking...');
      const payload = buildBookingPayload('confirmed');
      await createBooking(payload);

      Alert.alert('Booking Confirmed', 'Your session has been booked using your membership.', [
        { text: 'OK', onPress: () => navigation.popToTop() },
      ]);
    } catch (error) {
      Alert.alert('Booking Failed', extractErrorMessage(error));
    } finally {
      setIsSubmitting(false);
      setLoadingMessage('');
    }
  }, [buildBookingPayload, navigation]);

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
      pendingBookingId = null;

      Alert.alert('Payment Successful', 'Your booking has been confirmed and payment processed.', [
        { text: 'OK', onPress: () => navigation.popToTop() },
      ]);
    } catch (error) {
      // Clean up the pending booking so the time slot isn't blocked
      if (pendingBookingId) {
        try {
          await cancelBooking(pendingBookingId);
        } catch (cancelErr) {
          console.warn('Failed to cancel pending booking after payment failure:', cancelErr.message);
        }
      }
      Alert.alert('Payment Failed', extractErrorMessage(error));
    } finally {
      setIsSubmitting(false);
      setLoadingMessage('');
    }
  }, [
    cardComplete, buildBookingPayload, clientId, service,
    client, user, isCoach, confirmPayment, navigation,
  ]);

  // Handle non-payment booking (staff/coach flow when Stripe not enabled)
  const handleNoPaymentConfirm = useCallback(async () => {
    try {
      setIsSubmitting(true);
      setLoadingMessage('Creating booking...');
      const payload = buildBookingPayload('confirmed');
      await createBooking(payload);

      Alert.alert('Booking Confirmed', 'Your session has been booked.', [
        { text: 'OK', onPress: () => navigation.popToTop() },
      ]);
    } catch (error) {
      Alert.alert('Booking Failed', extractErrorMessage(error));
    } finally {
      setIsSubmitting(false);
      setLoadingMessage('');
    }
  }, [buildBookingPayload, navigation]);

  // Main confirm handler — routes to membership, payment, or no-payment flow
  const handleConfirm = useCallback(() => {
    if (!clientId) {
      Alert.alert('Error', 'Client information is missing.');
      return;
    }
    // Pre-flight validation: service requires a resource but none was auto-selected
    if (service?.requires_resource && !selectedResource?.id) {
      Alert.alert('Error', 'This service requires a resource to be selected. Please go back and select a different time slot.');
      return;
    }
    // Coach flow: membership-only — block if client has no membership coverage
    if (isCoach && !isMembershipBooking) {
      Alert.alert(
        'Membership Required',
        'This client does not have an active membership with available usage for this service. Bookings through the coach app require a membership.',
      );
      return;
    }
    if (isMembershipBooking) {
      handleMembershipConfirm();
    } else if (paymentsEnabled) {
      handlePaymentConfirm();
    } else {
      handleNoPaymentConfirm();
    }
  }, [clientId, service, selectedResource, isCoach, isMembershipBooking, paymentsEnabled, handleMembershipConfirm, handlePaymentConfirm, handleNoPaymentConfirm]);

  // Compute whether confirm button should be enabled
  const canConfirm = useMemo(() => {
    if (isSubmitting || membershipLoading || ecommerceLoading) return false;
    if (isMembershipBooking) return true;
    // Coach flow: membership-only — disable button when no membership coverage
    if (isCoach) return false;
    // Client flow: one-off payment — require card if payments are enabled
    if (paymentsEnabled) return cardComplete;
    // Payments not enabled — allow booking without payment (staff flow)
    return true;
  }, [isSubmitting, membershipLoading, ecommerceLoading, isMembershipBooking, isCoach, paymentsEnabled, cardComplete]);

  // Allotment progress bars for membership
  const renderAllotmentSection = () => {
    if (membershipLoading) {
      return (
        <View style={styles.allotmentSection}>
          <Text style={styles.allotmentTitle}>Membership Status</Text>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      );
    }

    // No membership at all
    if (!membershipStatus?.hasActiveMembership && membershipStatus !== null) {
      return (
        <View style={styles.allotmentSection}>
          <Text style={styles.allotmentTitle}>
            {membershipStatus.planName || 'Membership Status'}
          </Text>
          <View style={styles.allotmentNoMembership}>
            <Text style={styles.allotmentNoMembershipText}>
              {membershipStatus.isPaused
                ? isCoach
                  ? 'This client\'s membership is paused. Benefits are temporarily unavailable.'
                  : 'Your membership is paused. Benefits are temporarily unavailable.'
                : isCoach
                  ? 'This client does not have an active membership.'
                  : "You don't currently have an active membership."}
            </Text>
            <Text style={[styles.allotmentNoMembershipText, { marginTop: 4, fontSize: 12 }]}>
              {isCoach
                ? 'A membership with available usage is required to book through the app.'
                : 'Payment will be processed as a one-time booking.'}
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
            <View style={styles.allotmentWarningBanner}>
              <Text style={styles.allotmentNoMembershipText}>
                This service isn't covered or {isCoach ? 'the client has' : 'you\'ve'} reached the limit.
              </Text>
              <Text style={[styles.allotmentNoMembershipText, { marginTop: 4, fontSize: 12 }]}>
                {isCoach
                  ? 'A membership with available usage for this service is required.'
                  : 'Payment will be processed as a one-time booking.'}
              </Text>
            </View>
          )}
        </View>
      );
    }

    return null;
  };

  // Stripe card input for one-off bookings (client flow only)
  const renderCardSection = () => {
    if (isCoach || isMembershipBooking || membershipLoading) return null;

    // Show skeleton while ecommerce config is loading
    if (ecommerceLoading) {
      return (
        <View style={styles.cardSection}>
          <Text style={styles.cardSectionTitle}>Payment Method</Text>
          <Animated.View style={[styles.cardFieldSkeleton, { opacity: skeletonAnim }]}>
            <View style={styles.cardFieldSkeletonShimmer} />
          </Animated.View>
        </View>
      );
    }

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
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader
        title="Confirm Booking"
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
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

        {/* Location */}
        {location && (
          <View style={styles.confirmSection}>
            <Text style={styles.confirmLabel}>LOCATION</Text>
            <Text style={styles.confirmValue}>{location.name}</Text>
          </View>
        )}

        {/* Service */}
        <View style={styles.confirmSection}>
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
        </View>

        {/* Coach */}
        {coach && (
          <View style={styles.confirmSection}>
            <Text style={styles.confirmLabel}>COACH</Text>
            <View style={styles.confirmRowWithAvatar}>
              <Avatar
                uri={coach.avatar_url}
                name={`${coach.first_name} ${coach.last_name}`}
                size={40}
              />
              <Text style={[styles.confirmValue, styles.confirmValueWithMargin]}>
                {coach.first_name} {coach.last_name}
              </Text>
            </View>
          </View>
        )}

        {/* Date & Time */}
        <View style={styles.confirmSection}>
          <Text style={styles.confirmLabel}>DATE & TIME</Text>
          <Text style={styles.confirmValue}>{formattedDate}</Text>
          <Text
            style={[styles.confirmValue, styles.confirmTimeSubtext, { color: colors.textSecondary }]}
          >
            {formatSlotTime(timeSlot?.start_time)}
            {timeSlot?.end_time ? ` — ${formatSlotTime(timeSlot.end_time)}` : ''}
          </Text>
        </View>

        {/* Membership Allotment */}
        {renderAllotmentSection()}

        {/* Membership Booking Success Banner */}
        {isMembershipBooking && (
          <View style={[styles.confirmSection, { backgroundColor: colors.successLight }]}>
            <Text style={[styles.confirmLabel, { color: colors.success }]}>
              NO PAYMENT REQUIRED
            </Text>
            <Text style={[styles.confirmSubtext, { color: colors.textSecondary, marginTop: 4 }]}>
              This booking will be processed using your membership allotment.
            </Text>
          </View>
        )}

        {/* Stripe Card Input (client one-off only — coaches use membership) */}
        {renderCardSection()}

        {/* Payment Summary */}
        <View style={styles.confirmSection}>
          <Text style={styles.confirmLabel}>PAYMENT SUMMARY</Text>

          <View style={[styles.confirmRow, styles.summaryFeesRow]}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>{summary.subtotalFormatted}</Text>
          </View>

          {!isMembershipBooking && !isCoach && (
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
          )}

          <View style={[styles.confirmDivider, styles.totalDivider]} />

          <View style={styles.confirmRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalPrice}>{summary.totalFormatted}</Text>
          </View>
        </View>
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
          >
            {isSubmitting ? (
              <ActivityIndicator color={colors.textInverse} />
            ) : (
              <Text style={styles.continueButtonText}>
                {isMembershipBooking
                  ? 'Confirm (Membership)'
                  : isCoach
                    ? 'Membership Required'
                    : paymentsEnabled
                      ? `Pay ${summary.totalFormatted}`
                      : 'Confirm Booking'}
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
