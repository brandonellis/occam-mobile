import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, Animated, Alert, ActivityIndicator } from 'react-native';
import { Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useConfirmPayment, StripeProvider } from '@stripe/stripe-react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import config from '../../config';
import ScreenHeader from '../../components/ScreenHeader';
import Avatar from '../../components/Avatar';
import BookingStepIndicator from '../../components/BookingStepIndicator';
import PromoCodeInput from '../../components/PromoCodeInput';
import BookingSuccessView from '../../components/Booking/BookingSuccessView';
import BookingDetailsSection from '../../components/Booking/BookingDetailsSection';
import RecurrenceSection from '../../components/Booking/RecurrenceSection';
import RecurrencePreview from '../../components/Booking/RecurrencePreview';
import MembershipAllotmentSection from '../../components/Booking/MembershipAllotmentSection';
import PaymentMethodSection from '../../components/Booking/PaymentMethodSection';
import PaymentSummarySection from '../../components/Booking/PaymentSummarySection';
import { useTaxCalculation } from '../../hooks/useTaxCalculation';
import BookingBenefitBanner from '../../components/Booking/BookingBenefitBanner';
import ConfirmBottomBar from '../../components/Booking/ConfirmBottomBar';
import { bookingStyles as styles } from '../../styles/booking.styles';
import { buildPaymentSummary, formatCurrency } from '../../helpers/pricing.helper';
import { confirmCancelBooking } from '../../helpers/booking.navigation.helper';
import { getBookingSteps } from '../../helpers/booking.helper';
import { formatDateInTz } from '../../helpers/timezone.helper';
import { colors } from '../../theme';
import { COACH_ROLES } from '../../constants/auth.constants';
import useAuth from '../../hooks/useAuth';
import { openBookingPayment } from '../../helpers/webRedirect.helper';
import useEcommerceConfig from '../../hooks/useEcommerceConfig';
import useResourceResolution from '../../hooks/useResourceResolution';
import useBookingMembership from '../../hooks/useBookingMembership';
import useBookingPackage from '../../hooks/useBookingPackage';
import useBookingPayment from '../../hooks/useBookingPayment';
import useBookingSubmission from '../../hooks/useBookingSubmission';


const BookingConfirmationInner = ({ route, navigation, ecommerceConfig }) => {
  const { bookingData = {} } = route.params || {};
  const { service, coach, location, client, date, timeSlot, selectedResource: initialResource } = bookingData;
  const { user, activeRole, company } = useAuth();
  const { confirmPayment } = useConfirmPayment();
  const { platformFeeRate, feeDescription, paymentsEnabled, loading: ecommerceLoading } = ecommerceConfig;

  const isCoach = COACH_ROLES.includes(activeRole);
  const isEditMode = Boolean(bookingData.editMode);
  const clientId = isCoach ? client?.id : user?.id;
  const effectiveDuration = bookingData.duration_minutes || service?.duration_minutes;

  // Client web redirect state (resolved after membership/package hooks below)
  const [clientRedirecting, setClientRedirecting] = useState(false);
  const redirectAttemptedRef = useRef(false);

  // Form state (stays in the screen — not domain logic)
  const [bookingNotes, setBookingNotes] = useState(bookingData.notes || '');
  const bookingStatus = 'confirmed';
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [feeBreakdownVisible, setFeeBreakdownVisible] = useState(false);

  // Recurrence state (coach only, non-class, non-edit)
  const [recurrenceEnabled, setRecurrenceEnabled] = useState(false);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState('weekly');
  const [recurrenceOccurrences, setRecurrenceOccurrences] = useState(4);
  const [recurrenceChecked, setRecurrenceChecked] = useState(false);
  const isClassBooking = Boolean(bookingData.selectedClassSession);
  const canShowRecurrence = isCoach && !isEditMode && !isClassBooking;

  // Skeleton pulse animation (shared across sub-components)
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

  // Success animation refs (passed to BookingSuccessView)
  const successScale = useRef(new Animated.Value(0)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;

  // ── Hook chain: resource → membership → package → payment → submission ──

  const { selectedResource } = useResourceResolution({
    initialResource,
    service,
    locationId: location?.id,
  });

  const {
    membershipStatus,
    membershipLoading,
    membershipError,
    isMembershipBooking,
    memberPriceCents,
    refreshMembership,
  } = useBookingMembership({
    clientId,
    serviceId: service?.id,
    isEditMode,
    isCoach,
  });

  const { packageBenefit, packageBenefitLoading, packageBenefitError, isPackageBooking } = useBookingPackage({
    clientId,
    serviceId: service?.id,
    isEditMode,
    isCoach,
    membershipLoading,
    isMembershipBooking,
  });

  const {
    cardComplete,
    cardError,
    onCardChange,
    savedMethods,
    selectedSavedMethodId,
    setSelectedSavedMethodId,
    paymentMode,
    setPaymentMode,
  } = useBookingPayment({
    clientId,
    isEditMode,
    isCoach,
    paymentsEnabled,
    isMembershipBooking,
    isPackageBooking,
  });

  // Per-service toggle: service does not require upfront payment
  const isPaymentNotRequired = service?.payment_required === false;
  const coachNeedsPayment = isCoach && !isMembershipBooking && !isPackageBooking && !isPaymentNotRequired && paymentsEnabled;

  // App Store compliance: redirect clients to web for payment immediately.
  // Coaches/admins process payments in-app as normal.
  // Clients with membership/package coverage or free services stay in-app.
  useEffect(() => {
    if (isCoach || isEditMode || clientRedirecting || redirectAttemptedRef.current) return;
    // Wait for membership/package loading to finish before deciding
    if (membershipLoading || packageBenefitLoading) return;
    // No redirect needed if service is free
    if (isPaymentNotRequired) return;
    // Covered by membership or package — no payment, stay in-app
    if (isMembershipBooking || isPackageBooking) return;

    redirectAttemptedRef.current = true;
    setClientRedirecting(true);
    openBookingPayment({ service, coach, location, timeSlot, duration_minutes: effectiveDuration })
      .then(() => navigation.popToTop())
      .catch(() => {
        setClientRedirecting(false);
        Alert.alert(
          'Unable to Open Checkout',
          'Please try again or contact the facility to book.',
          [
            { text: 'Go Back', style: 'cancel', onPress: () => navigation.goBack() },
            { text: 'Try Again', onPress: () => { redirectAttemptedRef.current = false; } },
          ],
        );
      });
  }, [isCoach, isEditMode, membershipLoading, packageBenefitLoading, isPaymentNotRequired, isMembershipBooking, isPackageBooking, service, coach, location, timeSlot, effectiveDuration, navigation, clientRedirecting]);

  const {
    isSubmitting,
    loadingMessage,
    showSuccess,
    createdBookingData,
    handleConfirm,
    handleSendPaymentLink,
    canConfirm,
  } = useBookingSubmission({
    bookingData, service, coach, location, client, timeSlot,
    user, isCoach, activeRole,
    isMembershipBooking, membershipStatus, refreshMembership,
    isPackageBooking, packageBenefit,
    cardComplete, paymentMode, selectedSavedMethodId, paymentsEnabled, confirmPayment,
    selectedResource,
    bookingNotes, bookingStatus,
    appliedPromo,
    recurrenceEnabled: canShowRecurrence && recurrenceEnabled,
    recurrenceFrequency,
    recurrenceOccurrences,
    membershipLoading, packageBenefitLoading, ecommerceLoading, isPaymentNotRequired,
  });

  // ── Derived values ──

  const summary = buildPaymentSummary({
    service,
    durationMinutes: bookingData.duration_minutes || null,
    platformFeeRate,
    isMembershipBooking: !!isMembershipBooking,
    isPackageBooking,
    memberPriceCents,
    discountAmount: appliedPromo?.discount_amount ? Number(appliedPromo.discount_amount) : 0,
  });

  const isCoveredByBenefit = !!isMembershipBooking || isPackageBooking;
  const discountAmt = appliedPromo?.discount_amount ? Number(appliedPromo.discount_amount) : 0;
  const effectiveSubtotal = isCoveredByBenefit ? 0 : Math.max(0, (summary.subtotal || 0) - discountAmt);
  const taxableAmountCents = Math.round(effectiveSubtotal * 100);
  const { taxAmount, taxLoading } = useTaxCalculation(taxableAmountCents);

  // Recurring multiplier — scales total for series unless covered by membership/package
  const isRecurring = canShowRecurrence && recurrenceEnabled && recurrenceOccurrences > 1;
  const seriesMultiplier = (isRecurring && !isCoveredByBenefit) ? recurrenceOccurrences : 1;

  const formattedDate = timeSlot?.start_time
    ? formatDateInTz(timeSlot.start_time, company, 'long')
    : date
      ? formatDateInTz(date + 'T12:00:00Z', company, 'long')
      : '';

  // When sending a payment link, only show subtotal — taxes/fees calculated at payment page
  const isPaymentLinkFlow = isCoach && !paymentsEnabled && !isCoveredByBenefit && !isPaymentNotRequired;
  const seriesTotal = isPaymentLinkFlow
    ? summary.subtotal * seriesMultiplier
    : (summary.total + taxAmount) * seriesMultiplier;

  const buttonLabel = isEditMode
    ? 'Update Booking'
    : isRecurring && isCoveredByBenefit
      ? `Book ${recurrenceOccurrences} Sessions`
      : isRecurring && !paymentsEnabled && isCoach
        ? `Book ${recurrenceOccurrences} Sessions & Send Payment Link`
        : isRecurring
          ? `Book ${recurrenceOccurrences} Sessions — ${formatCurrency(seriesTotal)}`
        : isMembershipBooking || isPackageBooking
          ? 'Confirm Session'
          : isPaymentNotRequired || (!isCoach && !paymentsEnabled)
            ? 'Confirm Booking'
            : isCoach && !paymentsEnabled
              ? 'Book & Send Payment Link'
              : `Pay ${formatCurrency(summary.total + taxAmount)}`;

  // ── Success screen ──

  useEffect(() => {
    if (!showSuccess) return;
    Animated.parallel([
      Animated.spring(successScale, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
      Animated.timing(successOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, [showSuccess, successScale, successOpacity]);

  // ── Early returns (must be after all hooks) ──

  if (clientRedirecting) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScreenHeader title="Redirecting..." onBack={() => navigation.goBack()} />
        <View style={styles.redirectContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.redirectText}>
            Opening secure checkout...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (showSuccess) {
    return (
      <BookingSuccessView
        createdBookingData={createdBookingData}
        bookingData={bookingData}
        service={service}
        coach={coach}
        location={location}
        client={client}
        selectedResource={selectedResource}
        timeSlot={timeSlot}
        formattedDate={formattedDate}
        isEditMode={isEditMode}
        isCoach={isCoach}
        isMembershipBooking={isMembershipBooking}
        isPackageBooking={isPackageBooking}
        company={company}
        navigation={navigation}
        successScale={successScale}
        successOpacity={successOpacity}
      />
    );
  }

  // ── Derived visibility flags for JSX sections ──

  const showMembershipBanner = !isEditMode && !membershipLoading && !ecommerceLoading && isMembershipBooking;
  const showPackageBenefitSkeleton = !isEditMode && !membershipLoading && !isMembershipBooking && packageBenefitLoading;
  const showPackageBanner = !isEditMode && !membershipLoading && !packageBenefitLoading && !ecommerceLoading && isPackageBooking;
  const showNoPaymentBanner = !isEditMode && !membershipLoading && !ecommerceLoading && !isMembershipBooking && isPaymentNotRequired;
  // When sending a payment link, taxes/fees are calculated at the payment page — show subtotal only
  const isPaymentLinkOnly = isCoach && !paymentsEnabled && !isCoveredByBenefit && !isPaymentNotRequired;
  const showPromoSection = !isEditMode && !membershipLoading && !ecommerceLoading && !isMembershipBooking && !isPackageBooking && !isPaymentNotRequired && paymentsEnabled;
  // Secondary "Send Payment Link" opt-in: shown when Stripe IS connected, as an
  // alternative to charging in-app. When Stripe is NOT connected, the primary button
  // routes to handleSendPaymentLink automatically via handleConfirm.
  const showPaymentLinkButton = isCoach && !isEditMode && !isMembershipBooking && !isPackageBooking && !isPaymentNotRequired && paymentsEnabled;

  // ── Main confirmation form ──

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

        <BookingDetailsSection
          service={service}
          coach={coach}
          location={location}
          selectedResource={selectedResource}
          formattedDate={formattedDate}
          timeSlot={timeSlot}
          effectiveDuration={effectiveDuration}
          summary={summary}
          company={company}
        />

        {canShowRecurrence && (
          <RecurrenceSection
            recurrenceEnabled={recurrenceEnabled}
            onRecurrenceToggle={(v) => { setRecurrenceEnabled(v); setRecurrenceChecked(false); }}
            recurrenceFrequency={recurrenceFrequency}
            onFrequencyChange={setRecurrenceFrequency}
            recurrenceOccurrences={recurrenceOccurrences}
            onOccurrencesChange={setRecurrenceOccurrences}
          />
        )}

        {canShowRecurrence && recurrenceEnabled && recurrenceOccurrences > 1 && (
          <RecurrencePreview
            timeSlot={timeSlot}
            recurrenceFrequency={recurrenceFrequency}
            recurrenceOccurrences={recurrenceOccurrences}
            service={service}
            coach={coach}
            location={location}
            selectedResource={selectedResource}
            company={company}
            onPreviewComplete={setRecurrenceChecked}
          />
        )}

        {/* Edit mode: notes */}
        {isEditMode && (
          <View style={styles.confirmSection}>
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

        <MembershipAllotmentSection
          membershipStatus={membershipStatus}
          membershipLoading={membershipLoading}
          ecommerceLoading={ecommerceLoading}
          isEditMode={isEditMode}
          isCoach={isCoach}
          client={client}
          serviceId={service?.id}
          coachNeedsPayment={coachNeedsPayment}
          skeletonAnim={skeletonAnim}
        />

        {!isEditMode && (membershipError || packageBenefitError) && (
          <View style={[styles.confirmSection, { backgroundColor: colors.warningLight }]}>
            <Text style={{ color: colors.warning, fontSize: 14 }}>
              Unable to verify membership/package benefits. You may be charged the full price.
              Please try again or contact support.
            </Text>
          </View>
        )}

        {showMembershipBanner && (
          <BookingBenefitBanner
            type="membership"
            isCoach={isCoach}
            clientFirstName={client?.first_name}
          />
        )}

        {showPackageBenefitSkeleton && (
          <View style={styles.confirmSection}>
            <Animated.View style={[styles.skeletonBlock, { opacity: skeletonAnim }]}>
              <View style={[styles.skeletonBar, { width: '50%' }]} />
              <View style={[styles.skeletonBar, { width: '80%' }]} />
            </Animated.View>
          </View>
        )}

        {showPackageBanner && (
          <BookingBenefitBanner
            type="package"
            packageName={packageBenefit?.package_name}
            packageRemaining={packageBenefit?.remaining}
          />
        )}

        {showNoPaymentBanner && (
          <BookingBenefitBanner type="noPayment" isCoach={isCoach} />
        )}

        {showPromoSection && (
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

        <PaymentMethodSection
          isEditMode={isEditMode}
          isMembershipBooking={isMembershipBooking}
          isPackageBooking={isPackageBooking}
          isPaymentNotRequired={isPaymentNotRequired}
          membershipLoading={membershipLoading}
          ecommerceLoading={ecommerceLoading}
          isCoach={isCoach}
          paymentsEnabled={paymentsEnabled}
          cardError={cardError}
          onCardChange={onCardChange}
          savedMethods={savedMethods}
          paymentMode={paymentMode}
          selectedSavedMethodId={selectedSavedMethodId}
          onPaymentModeChange={setPaymentMode}
          onSelectSavedMethod={setSelectedSavedMethodId}
          skeletonAnim={skeletonAnim}
        />

        <PaymentSummarySection
          summary={summary}
          appliedPromo={appliedPromo}
          taxAmount={taxAmount}
          feeBreakdownVisible={feeBreakdownVisible}
          onToggleFeeBreakdown={() => setFeeBreakdownVisible((v) => !v)}
          feeDescription={feeDescription}
          membershipLoading={membershipLoading}
          ecommerceLoading={ecommerceLoading}
          isEditMode={isEditMode}
          skeletonAnim={skeletonAnim}
          seriesMultiplier={seriesMultiplier}
          occurrences={isRecurring ? recurrenceOccurrences : null}
          subtotalOnly={isPaymentLinkOnly}
        />
      </ScrollView>

      <ConfirmBottomBar
        canConfirm={canConfirm && !(canShowRecurrence && recurrenceEnabled && recurrenceOccurrences > 1 && !recurrenceChecked)}
        isSubmitting={isSubmitting}
        loadingMessage={loadingMessage}
        onConfirm={handleConfirm}
        buttonLabel={buttonLabel}
        onSendPaymentLink={handleSendPaymentLink}
        showPaymentLinkButton={showPaymentLinkButton}
      />
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
  const { connectAccount } = ecommerceConfig;

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
