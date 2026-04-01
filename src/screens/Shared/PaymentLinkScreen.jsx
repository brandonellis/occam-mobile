import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Linking,
} from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CardField, useConfirmPayment, StripeProvider } from '@stripe/stripe-react-native';
import config from '../../config';
import ScreenHeader from '../../components/ScreenHeader';
import { resolvePaymentToken, createTokenPayment, handlePaymentSuccess } from '../../services/billing.api';
import { formatCurrency } from '../../helpers/pricing.helper';
import { colors } from '../../theme';
import { COACH_ROLES } from '../../constants/auth.constants';
import useAuth from '../../hooks/useAuth';
import { membershipStyles as styles } from '../../styles/membership.styles';
import { checkoutSuccessStyles as successStyles } from '../../styles/checkoutSuccess.styles';
import { buildTenantWebUrl } from '../../helpers/webRedirect.helper';

const PaymentLinkInner = ({ route, navigation }) => {
  const { token } = route.params || {};
  const { confirmPayment } = useConfirmPayment();
  const { activeRole } = useAuth();
  const isCoach = COACH_ROLES.includes(activeRole);

  const [bookingData, setBookingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alreadyPaid, setAlreadyPaid] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [cardComplete, setCardComplete] = useState(false);
  const [paymentBreakdown, setPaymentBreakdown] = useState(null);
  const submittingRef = useRef(false);

  // Success animation
  const successScale = useRef(new Animated.Value(0)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!showSuccess) return;
    Animated.parallel([
      Animated.spring(successScale, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
      Animated.timing(successOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [showSuccess, successScale, successOpacity]);

  // Load token data on mount
  useEffect(() => {
    if (!token || !/^[a-zA-Z0-9]{20,128}$/.test(token)) {
      setError('Invalid or missing payment link.');
      setLoading(false);
      return;
    }

    const init = async () => {
      try {
        setLoading(true);

        const bookingResult = await resolvePaymentToken(token);

        if (!bookingResult.success) {
          setError(bookingResult.error || 'Failed to load booking details.');
          return;
        }

        setBookingData(bookingResult.data);

        // Use pre-computed totals from the resolve endpoint for accurate pricing
        if (bookingResult.data.total_amount_cents) {
          setPaymentBreakdown({
            serviceAmount: bookingResult.data.service_amount_cents,
            platformFee: bookingResult.data.platform_fee_cents,
            totalAmount: bookingResult.data.total_amount_cents,
          });
        }
      } catch (err) {
        const responseData = err?.response?.data;
        if (responseData?.already_paid) {
          setAlreadyPaid(true);
        } else {
          setError(responseData?.error || 'This payment link is invalid or has expired.');
        }
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [token]);

  // Client web redirect: open payment link in system browser (App Store compliance)
  const handlePayOnWeb = useCallback(async () => {
    try {
      const url = await buildTenantWebUrl(`/pay/${token}`);
      await Linking.openURL(url);
    } catch (err) {
      setError('Unable to open payment page. Please try opening the link from your email in a web browser.');
    }
  }, [token]);

  const handlePay = useCallback(async () => {
    if (!cardComplete || !token || submittingRef.current) return;
    submittingRef.current = true;

    try {
      setIsSubmitting(true);
      setError(null);

      // Create PaymentIntent on demand (not on mount)
      setLoadingMessage('Setting up payment...');
      const piResult = await createTokenPayment(token);
      if (!piResult.success || !piResult.client_secret) {
        throw new Error(piResult.error || 'Failed to create payment.');
      }

      setPaymentBreakdown({
        serviceAmount: piResult.service_amount,
        platformFee: piResult.platform_fee,
        totalAmount: piResult.total_amount,
      });

      // Confirm with Stripe
      setLoadingMessage('Processing payment...');
      const { error: confirmError, paymentIntent } = await confirmPayment(piResult.client_secret, {
        paymentMethodType: 'Card',
      });

      if (confirmError) {
        throw new Error(confirmError.message || 'Payment confirmation failed.');
      }

      if (paymentIntent?.id) {
        try {
          await handlePaymentSuccess(paymentIntent.id);
        } catch {
          // Payment may have succeeded regardless
        }
      }

      setShowSuccess(true);
    } catch (err) {
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      setIsSubmitting(false);
      setLoadingMessage('');
      submittingRef.current = false;
    }
  }, [cardComplete, token, confirmPayment]);

  const displayTotal = paymentBreakdown
    ? paymentBreakdown.totalAmount / 100
    : Number(bookingData?.service_price || 0);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScreenHeader title="Complete Payment" onBack={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('HomeTab')} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: 12, color: colors.textSecondary }}>Loading payment details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (alreadyPaid) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScreenHeader title="Payment" onBack={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('HomeTab')} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <MaterialCommunityIcons name="check-circle" size={64} color={colors.success} />
          <Text variant="titleLarge" style={{ marginTop: 16 }}>Already Paid</Text>
          <Text variant="bodyMedium" style={{ color: colors.textSecondary, marginTop: 8, textAlign: 'center' }}>
            This booking has already been paid. No further action is needed.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !bookingData) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScreenHeader title="Payment" onBack={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('HomeTab')} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <MaterialCommunityIcons name="alert-circle" size={64} color={colors.error} />
          <Text variant="titleLarge" style={{ marginTop: 16 }}>Payment Error</Text>
          <Text variant="bodyMedium" style={{ color: colors.textSecondary, marginTop: 8, textAlign: 'center' }}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (showSuccess) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={[styles.scrollContent, successStyles.container]}>
          <Animated.View style={[successStyles.iconCircle, { transform: [{ scale: successScale }], opacity: successOpacity }]}>
            <MaterialCommunityIcons name="check-bold" size={40} color={colors.white} />
          </Animated.View>
          <Animated.View style={{ opacity: successOpacity, alignItems: 'center' }}>
            <Text style={successStyles.title}>Payment Successful</Text>
            <Text style={successStyles.subtitle}>Your booking is confirmed.</Text>
          </Animated.View>
          {bookingData?.service_name && (
            <Animated.View style={[successStyles.detailsCard, { opacity: successOpacity }]}>
              <Text style={successStyles.detailLabel}>SERVICE</Text>
              <Text style={successStyles.detailValue}>{bookingData.service_name}</Text>
            </Animated.View>
          )}
          <TouchableOpacity
            style={[styles.purchaseButton, successStyles.doneButton]}
            onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('HomeTab')}
            activeOpacity={0.8}
          >
            <Text style={styles.purchaseButtonText}>Done</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScreenHeader title="Complete Payment" onBack={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('HomeTab')} />
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: 8 }]}>
        {/* Booking summary */}
        <View style={styles.checkoutSection}>
          <Text style={styles.checkoutLabel}>BOOKING DETAILS</Text>
          {bookingData?.service_name && (
            <Text style={styles.checkoutValue}>{bookingData.service_name}</Text>
          )}
          {bookingData?.location && (
            <Text style={styles.checkoutDescription}>{bookingData.location}</Text>
          )}
          {bookingData?.coaches?.length > 0 && (
            <Text style={styles.checkoutDescription}>Coach: {bookingData.coaches.join(', ')}</Text>
          )}
        </View>

        {/* Client: web redirect instead of in-app payment (App Store compliance) */}
        {!isCoach && (
          <View style={[styles.checkoutSection, { backgroundColor: colors.infoLight, borderRadius: 12, padding: 16 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <MaterialCommunityIcons name="web" size={20} color={colors.info} />
              <Text style={{ color: colors.info, fontSize: 14, fontWeight: '600', flex: 1 }}>
                You'll be taken to our website to complete this payment.
              </Text>
            </View>
          </View>
        )}

        {/* Coach: card input for in-app payment */}
        {isCoach && (
          <View style={styles.checkoutCardSection}>
            <Text style={styles.checkoutCardTitle}>Payment Method</Text>
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
              style={styles.checkoutCardField}
              onCardChange={(details) => setCardComplete(details.complete)}
            />
          </View>
        )}

        {/* Payment summary */}
        <View style={styles.checkoutSection}>
          <Text style={styles.checkoutLabel}>PAYMENT SUMMARY</Text>
          {paymentBreakdown && (
            <>
              <View style={styles.checkoutSummaryRow}>
                <Text style={styles.checkoutSummaryLabel}>Subtotal</Text>
                <Text style={styles.checkoutSummaryValue}>{formatCurrency(paymentBreakdown.serviceAmount / 100)}</Text>
              </View>
              <View style={styles.checkoutSummaryRow}>
                <Text style={styles.checkoutSummaryLabel}>Taxes & Fees</Text>
                <Text style={styles.checkoutSummaryValue}>{formatCurrency(paymentBreakdown.platformFee / 100)}</Text>
              </View>
            </>
          )}
          <View style={styles.checkoutDivider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalPrice}>{formatCurrency(displayTotal)}</Text>
          </View>
        </View>

        {error && (
          <View style={{ paddingVertical: 8 }}>
            <Text style={{ color: colors.error, fontSize: 14, textAlign: 'center' }}>{error}</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.bottomBar}>
        {isCoach && loadingMessage ? (
          <View style={styles.checkoutLoadingRow}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.checkoutLoadingText}>{loadingMessage}</Text>
          </View>
        ) : isCoach ? (
          <TouchableOpacity
            style={[styles.purchaseButton, !cardComplete && styles.purchaseButtonDisabled]}
            onPress={handlePay}
            disabled={!cardComplete || isSubmitting}
            activeOpacity={0.8}
          >
            <Text style={styles.purchaseButtonText}>
              Pay {formatCurrency(displayTotal)}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.purchaseButton}
            onPress={handlePayOnWeb}
            activeOpacity={0.8}
          >
            <Text style={styles.purchaseButtonText}>Pay on Web</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const PaymentLinkScreen = (props) => (
  <StripeProvider publishableKey={config.stripePublishableKey}>
    <PaymentLinkInner {...props} />
  </StripeProvider>
);

export default PaymentLinkScreen;
