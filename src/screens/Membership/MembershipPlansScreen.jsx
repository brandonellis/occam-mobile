import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ScreenHeader from '../../components/ScreenHeader';
import { membershipStyles as styles } from '../../styles/membership.styles';
import { globalStyles } from '../../styles/global.styles';
import { getMembershipPlans } from '../../services/accounts.api';
import { formatCurrency } from '../../helpers/pricing.helper';
import { getBillingCycleLabel } from '../../constants/billing.constants';
import { colors } from '../../theme';
import { SCREENS } from '../../constants/navigation.constants';

const MembershipPlansScreen = ({ navigation }) => {
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCycles, setSelectedCycles] = useState({});

  const loadPlans = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { data } = await getMembershipPlans();
      const planList = data || [];
      setPlans(planList);

      // Default billing cycle per plan
      const defaults = {};
      planList.forEach((plan) => {
        const cycles = plan.billing_cycles || plan.billingCycles || [];
        const defaultCycle = cycles.find((c) => c.is_default) || cycles[0];
        if (defaultCycle) defaults[plan.id] = defaultCycle;
      });
      setSelectedCycles(defaults);
    } catch (err) {
      console.warn('Failed to load membership plans:', err?.message || err);
      setError('Failed to load membership plans.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  const handleSelectCycle = useCallback((planId, cycle) => {
    setSelectedCycles((prev) => ({ ...prev, [planId]: cycle }));
  }, []);

  const handleSelectPlan = useCallback(
    (plan) => {
      const billingCycle = selectedCycles[plan.id];
      navigation.navigate(SCREENS.MEMBERSHIP_CHECKOUT, { plan, billingCycle });
    },
    [navigation, selectedCycles]
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader
        title="Membership Plans"
        onBack={() => navigation.goBack()}
      />

      {isLoading ? (
        <View style={globalStyles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={globalStyles.errorContainer}>
          <Text style={globalStyles.errorText}>{error}</Text>
          <TouchableOpacity onPress={loadPlans} style={globalStyles.retryButton}>
            <Text style={globalStyles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.introText}>
            Choose a membership plan that fits your goals.
          </Text>

          {plans.map((plan, index) => {
            const isFeatured = index === 0;
            const cycles = plan.billing_cycles || plan.billingCycles || [];
            const selectedCycle = selectedCycles[plan.id];
            const displayPrice = selectedCycle
              ? parseFloat(selectedCycle.price)
              : parseFloat(plan.monthly_price || plan.price || 0);
            const planServices = plan.plan_services || [];

            return (
              <View
                key={plan.id}
                style={[
                  styles.planCard,
                  isFeatured && styles.planCardFeatured,
                ]}
              >
                {isFeatured && (
                  <View style={styles.featuredBadge}>
                    <Text style={styles.featuredBadgeText}>POPULAR</Text>
                  </View>
                )}

                <Text style={styles.planName}>{plan.name}</Text>
                {plan.description && (
                  <Text style={styles.planDescription}>
                    {plan.description}
                  </Text>
                )}

                {/* Billing cycle selector */}
                {cycles.length > 1 ? (
                  <View style={styles.billingCycleRow}>
                    {cycles.map((cycle) => {
                      const isSelected = selectedCycle?.id === cycle.id;
                      return (
                        <TouchableOpacity
                          key={cycle.id}
                          style={[
                            styles.billingCycleOption,
                            isSelected && styles.billingCycleOptionSelected,
                          ]}
                          onPress={() => handleSelectCycle(plan.id, cycle)}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.billingCyclePrice,
                              isSelected && styles.billingCyclePriceSelected,
                            ]}
                          >
                            {formatCurrency(parseFloat(cycle.price))}
                          </Text>
                          <Text style={styles.billingCycleLabel}>
                            {getBillingCycleLabel(cycle.billing_cycle)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : (
                  <View style={styles.planPriceRow}>
                    <Text style={styles.planPrice}>
                      {formatCurrency(displayPrice)}
                    </Text>
                    <Text style={styles.planPeriod}>
                      /{selectedCycle?.billing_cycle || 'month'}
                    </Text>
                  </View>
                )}

                {/* Plan services (from backend plan_services with quantities) */}
                {planServices.length > 0 && (
                  <View style={styles.planServicesSection}>
                    {planServices.map((ps, i) => (
                      <View key={ps.id || i} style={styles.planServiceRow}>
                        <Ionicons
                          name="checkmark-circle"
                          size={18}
                          color={colors.success}
                        />
                        <Text style={styles.planServiceText}>
                          {ps.service?.name || `Service ${ps.service_id}`}
                        </Text>
                        <Text style={styles.planServiceQty}>
                          {ps.quantity}x/{selectedCycle?.billing_cycle || 'month'}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Fallback: flat benefits array if no plan_services */}
                {planServices.length === 0 && plan.benefits && plan.benefits.length > 0 && (
                  <View style={styles.planBenefits}>
                    {plan.benefits.map((benefit, i) => (
                      <View key={i} style={styles.benefitRow}>
                        <Ionicons
                          name="checkmark-circle"
                          size={18}
                          color={colors.success}
                        />
                        <Text style={styles.benefitText}>
                          {typeof benefit === 'string'
                            ? benefit
                            : benefit.description || benefit.name}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                <TouchableOpacity
                  style={[
                    styles.selectPlanButton,
                    isFeatured && styles.selectPlanButtonFeatured,
                  ]}
                  onPress={() => handleSelectPlan(plan)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.selectPlanButtonText}>
                    Select Plan
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default MembershipPlansScreen;
