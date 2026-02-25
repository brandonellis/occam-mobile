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
import { Ionicons } from '@expo/vector-icons';
import { CardField, useStripe } from '@stripe/stripe-react-native';
import ScreenHeader from '../../components/ScreenHeader';
import { membershipStyles as styles } from '../../styles/membership.styles';
import { formatCurrency } from '../../helpers/pricing.helper';
import { extractErrorMessage } from '../../helpers/error.helper';
import { createMembershipSubscription } from '../../services/billing.api';
import useAuth from '../../hooks/useAuth';
import useEcommerceConfig from '../../hooks/useEcommerceConfig';
import { getBillingCycleLabel } from '../../constants/billing.constants';
import { colors } from '../../theme';

const MembershipCheckoutScreen = ({ route, navigation }) => {
  const { plan, billingCycle } = route.params;
  const { user } = useAuth();
  const { createPaymentMethod } = useStripe();
  const { platformFeeRate, paymentsEnabled } = useEcommerceConfig();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [cardComplete, setCardComplete] = useState(false);
  const [cardError, setCardError] = useState(null);

  // Price calculation
  const cyclePrice = billingCycle ? parseFloat(billingCycle.price) || 0 : parseFloat(plan.monthly_price || plan.price || 0);
  const platformFee = Math.round(cyclePrice * platformFeeRate * 100) / 100;
  const total = cyclePrice + platformFee;

  const planServices = plan.plan_services || [];

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
    if (!billingCycle?.id) {
      Alert.alert('Billing Cycle Required', 'No billing cycle selected. Please go back and select a plan.');
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

      // PHASE 2: Create subscription via backend
      setLoadingMessage('Setting up subscription...');
      const result = await createMembershipSubscription({
        client_id: user?.id,
        membership_plan_id: plan.id,
        billing_cycle_id: billingCycle?.id,
        payment_method_id: paymentMethod.id,
      });

      if (!result?.success) {
        throw new Error(result?.error || result?.message || 'Subscription creation failed.');
      }

      Alert.alert(
        'Membership Activated',
        `You are now a ${plan.name} member!`,
        [{ text: 'OK', onPress: () => navigation.popToTop() }]
      );
    } catch (error) {
      Alert.alert('Purchase Failed', extractErrorMessage(error, 'Failed to purchase membership.'));
    } finally {
      setIsSubmitting(false);
      setLoadingMessage('');
    }
  }, [cardComplete, createPaymentMethod, user, plan, billingCycle, navigation]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader
        title="Checkout"
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: 8 }]}>
        {/* Plan details — consolidated card */}
        <View style={styles.checkoutSection}>
          <Text style={styles.checkoutLabel}>MEMBERSHIP PLAN</Text>
          <Text style={styles.checkoutValue}>{plan.name}</Text>
          {plan.description && (
            <Text style={styles.checkoutDescription}>
              {plan.description}
            </Text>
          )}
          {billingCycle && (
            <Text style={styles.checkoutBillingCycleText}>
              {getBillingCycleLabel(billingCycle.billing_cycle)} billing
            </Text>
          )}

          {/* Plan services */}
          {planServices.length > 0 && (
            <>
              <View style={styles.checkoutDivider} />
              <Text style={styles.checkoutLabel}>INCLUDES</Text>
              <View style={styles.checkoutIncludesList}>
                {planServices.map((ps, i) => (
                  <View key={ps.id || i} style={styles.checkoutIncludesRow}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                    <Text style={styles.checkoutIncludesText}>
                      {ps.service?.name || `Service ${ps.service_id}`}
                    </Text>
                    <Text style={styles.checkoutIncludesQty}>
                      {ps.quantity}x/{billingCycle?.billing_cycle || 'month'}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Fallback benefits */}
          {planServices.length === 0 && plan.benefits && plan.benefits.length > 0 && (
            <>
              <View style={styles.checkoutDivider} />
              <Text style={styles.checkoutLabel}>INCLUDES</Text>
              <View style={styles.checkoutIncludesList}>
                {plan.benefits.map((benefit, i) => (
                  <View key={i} style={styles.checkoutIncludesRow}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                    <Text style={styles.checkoutIncludesText}>
                      {typeof benefit === 'string' ? benefit : benefit.description || benefit.name}
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
            <Text style={styles.checkoutSummaryLabel}>
              {plan.name} ({getBillingCycleLabel(billingCycle?.billing_cycle || 'month')})
            </Text>
            <Text style={styles.checkoutSummaryValue}>
              {formatCurrency(cyclePrice)}
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

export default MembershipCheckoutScreen;
