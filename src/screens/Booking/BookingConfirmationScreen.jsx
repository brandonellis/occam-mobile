import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, ScrollView, Animated, Alert } from 'react-native';
import { Text, SegmentedButtons, TextInput } from 'react-native-paper';
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
import MembershipAllotmentSection from '../../components/Booking/MembershipAllotmentSection';
import PaymentMethodSection from '../../components/Booking/PaymentMethodSection';
import PaymentSummarySection from '../../components/Booking/PaymentSummarySection';
import BookingBenefitBanner from '../../components/Booking/BookingBenefitBanner';
import ConfirmBottomBar from '../../components/Booking/ConfirmBottomBar';
import { bookingStyles as styles } from '../../styles/booking.styles';
import { buildPaymentSummary } from '../../helpers/pricing.helper';
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

const EDITABLE_STATUSES = ['confirmed', 'cancelled'];

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

  // Form state (stays in the screen — not domain logic)
  const [bookingNotes, setBookingNotes] = useState(bookingData.notes || '');
  const [bookingStatus, setBookingStatus] = useState(
    EDITABLE_STATUSES.includes(bookingData.status) ? bookingData.status : 'confirmed'
  );
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [feeBreakdownVisible, setFeeBreakdownVisible] = useState(false);

  // Recurrence state (coach only, non-class, non-edit)
  const [recurrenceEnabled, setRecurrenceEnabled] = useState(false);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState('weekly');
  const [recurrenceOccurrences, setRecurrenceOccurrences] = useState(4);
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

  // App Store compliance: clients needing payment are redirected to web
  const clientNeedsWebPayment = !isCoach && !isMembershipBooking && !isPackageBooking
    && !isPaymentNotRequired && paymentsEnabled && !isEditMode;

  const onClientPaymentRedirect = useCallback(() => {
    Alert.alert(
      'Continue on Web',
      'To complete your booking with payment, you\'ll be taken to our website.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: async () => {
            await openBookingPayment();
            navigation.popToTop();
          },
        },
      ]
    );
  }, [navigation]);

  const {
    isSubmitting,
    loadingMessage,
    showSuccess,
    createdBookingData,
    handleConfirm,
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
    onClientPaymentRedirect: clientNeedsWebPayment ? onClientPaymentRedirect : null,
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

  const formattedDate = timeSlot?.start_time
    ? formatDateInTz(timeSlot.start_time, company, 'long')
    : date
      ? formatDateInTz(date + 'T12:00:00Z', company, 'long')
      : '';

  const buttonLabel = isEditMode
    ? 'Update Booking'
    : canShowRecurrence && recurrenceEnabled && recurrenceOccurrences > 1
      ? `Book ${recurrenceOccurrences} Sessions`
      : isMembershipBooking || isPackageBooking
        ? 'Confirm Session'
        : clientNeedsWebPayment
          ? 'Continue on Web'
          : isCoach && !coachNeedsPayment
            ? 'Book Session'
            : isPaymentNotRequired || !paymentsEnabled
              ? 'Confirm Booking'
              : `Pay ${summary.totalFormatted}`;

  // ── Success screen ──

  useEffect(() => {
    if (!showSuccess) return;
    Animated.parallel([
      Animated.spring(successScale, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
      Animated.timing(successOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, [showSuccess, successScale, successOpacity]);

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
  const showPromoSection = !isEditMode && !membershipLoading && !ecommerceLoading && !isMembershipBooking && !isPackageBooking && !isPaymentNotRequired && paymentsEnabled;

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
            onRecurrenceToggle={setRecurrenceEnabled}
            recurrenceFrequency={recurrenceFrequency}
            onFrequencyChange={setRecurrenceFrequency}
            recurrenceOccurrences={recurrenceOccurrences}
            onOccurrencesChange={setRecurrenceOccurrences}
          />
        )}

        {/* Edit mode: status + notes */}
        {isEditMode && (
          <View style={styles.confirmSection}>
            <Text style={styles.confirmLabel}>STATUS</Text>
            <SegmentedButtons
              value={bookingStatus}
              onValueChange={setBookingStatus}
              style={styles.editStatusControl}
              buttons={[
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

        {clientNeedsWebPayment && (
          <View style={[styles.confirmSection, { backgroundColor: colors.infoLight, borderRadius: 12, padding: 16 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <MaterialCommunityIcons name="web" size={20} color={colors.info} />
              <Text style={{ color: colors.info, fontSize: 14, fontWeight: '600', flex: 1 }}>
                This booking requires payment. You'll be taken to our website to complete checkout.
              </Text>
            </View>
          </View>
        )}

        {showPromoSection && !clientNeedsWebPayment && (
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

        {!clientNeedsWebPayment && (
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
        )}

        {!clientNeedsWebPayment && (
          <PaymentSummarySection
            summary={summary}
            appliedPromo={appliedPromo}
            feeBreakdownVisible={feeBreakdownVisible}
            onToggleFeeBreakdown={() => setFeeBreakdownVisible((v) => !v)}
            feeDescription={feeDescription}
            membershipLoading={membershipLoading}
            ecommerceLoading={ecommerceLoading}
            isEditMode={isEditMode}
            skeletonAnim={skeletonAnim}
          />
        )}
      </ScrollView>

      <ConfirmBottomBar
        canConfirm={canConfirm}
        isSubmitting={isSubmitting}
        loadingMessage={loadingMessage}
        onConfirm={handleConfirm}
        buttonLabel={buttonLabel}
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
