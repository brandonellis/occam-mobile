import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CardField, useStripe } from '@stripe/stripe-react-native';
import ScreenHeader from '../../components/ScreenHeader';
import { packageStyles as styles } from '../../styles/packages.styles';
import { formatCurrency } from '../../helpers/pricing.helper';
import { extractErrorMessage } from '../../helpers/error.helper';
import { createPackagePayment, handlePackagePaymentSuccess } from '../../services/packages.api';
import useAuth from '../../hooks/useAuth';
import useEcommerceConfig from '../../hooks/useEcommerceConfig';
import { colors } from '../../theme';

const PackageCheckoutScreen = ({ route, navigation }) => {
  const pkg = route.params?.package;
  const { user } = useAuth();
  const { createPaymentMethod } = useStripe();
  const { platformFeeRate, paymentsEnabled } = useEcommerceConfig();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [cardComplete, setCardComplete] = useState(false);
  const [cardError, setCardError] = useState(null);

  const packagePrice = parseFloat(pkg?.price) || 0;
  const platformFee = Math.round(packagePrice * platformFeeRate * 100) / 100;
  const total = packagePrice + platformFee;

  const services = pkg?.package_services || [];

  const canPurchase = useMemo(() => {
    if (isSubmitting) return false;
    if (paymentsEnabled) return cardComplete;
    return false;
  }, [isSubmitting, paymentsEnabled, cardComplete]);

  const handlePurchase = useCallback(async () => {
    if (!cardComplete) {
      Alert.alert('Card Required', 'Please enter your card details.');
      return;
    }
    if (!pkg?.id) {
      Alert.alert('Error', 'Package information is missing.');
      return;
    }

    try {
      setIsSubmitting(true);

      // PHASE 1: Create a PaymentMethod from the CardField
      setLoadingMessage('Preparing payment...');
      const { paymentMethod, error: pmError } = await createPaymentMethod({
        paymentMethodType: 'Card',
        paymentMethodData: {
          billingDetails: {
            name: `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Customer',
            email: user?.email,
          },
        },
      });

      if (pmError || !paymentMethod?.id) {
        throw new Error(pmError?.message || 'Failed to create payment method.');
      }

      // PHASE 2: Create payment via backend
      setLoadingMessage('Processing payment...');
      const result = await createPackagePayment({
        client_id: user?.id,
        package_id: pkg.id,
        payment_method_id: paymentMethod.id,
        use_saved_payment_method: false,
      });

      if (!result?.success) {
        throw new Error(result?.error || result?.message || 'Payment failed.');
      }

      // PHASE 3: If payment succeeded immediately (off-session), notify backend
      if (result.status === 'succeeded') {
        setLoadingMessage('Finalizing purchase...');
        await handlePackagePaymentSuccess(result.payment_intent_id);
      }

      Alert.alert(
        'Package Purchased!',
        `You now own the ${pkg.name} package. Your session allotments are ready to use.`,
        [{ text: 'OK', onPress: () => navigation.popToTop() }]
      );
    } catch (error) {
      Alert.alert('Purchase Failed', extractErrorMessage(error, 'Failed to purchase package.'));
    } finally {
      setIsSubmitting(false);
      setLoadingMessage('');
    }
  }, [cardComplete, createPaymentMethod, user, pkg, navigation]);

  if (!pkg) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScreenHeader title="Checkout" onBack={() => navigation.goBack()} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Text style={{ color: colors.textSecondary }}>Package information not available.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScreenHeader
        title="Checkout"
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: 8 }]}>
        {/* Package details */}
        <View style={styles.checkoutSection}>
          <Text style={styles.checkoutLabel}>PACKAGE</Text>
          <Text style={styles.checkoutValue}>{pkg.name}</Text>
          {pkg.description ? (
            <Text style={styles.checkoutDescription}>{pkg.description}</Text>
          ) : null}

          {/* Included services */}
          {services.length > 0 && (
            <>
              <View style={styles.checkoutDivider} />
              <Text style={styles.checkoutLabel}>INCLUDES</Text>
              <View style={styles.checkoutIncludesList}>
                {services.map((ps, i) => (
                  <View key={ps.id || i} style={styles.checkoutIncludesRow}>
                    <MaterialCommunityIcons name="check-circle" size={16} color={colors.success} />
                    <Text style={styles.checkoutIncludesText}>
                      {ps.service?.name || `Service ${ps.service_id}`}
                    </Text>
                    <Text style={styles.checkoutIncludesQty}>
                      {ps.quantity}x
                    </Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </View>

        {/* Payment method */}
        {paymentsEnabled ? (
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
              onCardChange={(details) => {
                setCardComplete(details.complete);
                setCardError(details.validationError?.message || null);
              }}
            />
            {cardError && <Text style={styles.checkoutCardError}>{cardError}</Text>}
          </View>
        ) : (
          <View style={styles.checkoutCardSection}>
            <Text style={styles.checkoutCardTitle}>Payment Method</Text>
            <View style={styles.checkoutPaymentsDisabledBanner}>
              <Text style={styles.checkoutPaymentsDisabledText}>
                Card payments are not yet available for this organization.
              </Text>
            </View>
          </View>
        )}

        {/* Payment summary */}
        <View style={styles.checkoutSection}>
          <Text style={styles.checkoutLabel}>PAYMENT SUMMARY</Text>

          <View style={styles.checkoutSummaryRow}>
            <Text style={styles.checkoutSummaryLabel}>{pkg.name}</Text>
            <Text style={styles.checkoutSummaryValue}>
              {formatCurrency(packagePrice)}
            </Text>
          </View>

          <View style={styles.checkoutSummaryRow}>
            <Text style={styles.checkoutSummaryLabel}>Taxes and Fees</Text>
            <Text style={styles.checkoutSummaryValue}>
              {formatCurrency(platformFee)}
            </Text>
          </View>

          <View style={styles.checkoutDivider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalPrice}>{formatCurrency(total)}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        {loadingMessage ? (
          <View style={styles.checkoutLoadingRow}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.checkoutLoadingText}>{loadingMessage}</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[
              styles.purchaseButton,
              !canPurchase && styles.purchaseButtonDisabled,
            ]}
            onPress={handlePurchase}
            disabled={!canPurchase}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator color={colors.textInverse} />
            ) : (
              <Text style={styles.purchaseButtonText}>
                Purchase — {formatCurrency(total)}
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

export default PackageCheckoutScreen;
