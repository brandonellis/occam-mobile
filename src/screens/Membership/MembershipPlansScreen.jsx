import React, { useEffect, useCallback, useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ListSkeleton } from '../../components/SkeletonLoader';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ScreenHeader from '../../components/ScreenHeader';
import EmptyState from '../../components/EmptyState';
import ServiceUsageCard from '../../components/ServiceUsageCard';
import { membershipStyles as styles } from '../../styles/membership.styles';
import { globalStyles } from '../../styles/global.styles';
import { getMembershipPlans, getMyMembership } from '../../services/accounts.api';
import { formatCurrency } from '../../helpers/pricing.helper';
import { getBillingCycleLabel } from '../../constants/billing.constants';
import {
  getMembershipStatus,
  isMembershipPausedNow,
  getNextRenewalDate,
  formatDate,
} from '../../helpers/membership.helper';
import { colors } from '../../theme';
import { SCREENS } from '../../constants/navigation.constants';
import logger from '../../helpers/logger.helper';

// ─── Active Membership View ─────────────────────────────────────────────────
const ActiveMembershipView = ({ membership, onUpgrade }) => {
  const { membership_plan, billing_cycle, start_date, end_date } = membership;
  const planServices = membership_plan?.plan_services || [];
  const planName = membership_plan?.name || 'Membership';
  const { status: mStatus, text: statusText, color: statusColor } = getMembershipStatus(membership);
  const isPaused = isMembershipPausedNow(membership);

  const nextRenewal = useMemo(
    () => getNextRenewalDate(start_date, billing_cycle),
    [start_date, billing_cycle]
  );

  const showUpgrade = !isPaused && mStatus !== 'expired' && mStatus !== 'inactive';

  return (
    <>
      {/* Plan Overview Card */}
      <View style={styles.detailCard}>
        <View style={styles.detailCardHeader}>
          <View style={styles.detailPlanIdentity}>
            <View style={styles.detailPlanIcon}>
              <MaterialCommunityIcons name="card-account-details-outline" size={22} color={colors.accent} />
            </View>
            <View style={styles.detailPlanInfo}>
              <Text style={styles.detailPlanName}>{planName}</Text>
              {billing_cycle && (
                <Text style={styles.detailPlanBilling}>
                  {getBillingCycleLabel(billing_cycle.billing_cycle)} · {formatCurrency(parseFloat(billing_cycle.price))}
                </Text>
              )}
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusBadgeText, { color: statusColor }]}>
              {statusText}
            </Text>
          </View>
        </View>

        <View style={styles.detailDivider} />

        <View style={styles.detailMetaRow}>
          <View style={styles.detailMetaItem}>
            <Text style={styles.detailMetaLabel}>
              <MaterialCommunityIcons name="calendar-outline" size={13} color={colors.textTertiary} /> Member Since
            </Text>
            <Text style={styles.detailMetaValue}>
              {start_date ? formatDate(new Date(start_date)) : 'N/A'}
            </Text>
          </View>

          {membership.auto_renewal !== false ? (
            <View style={styles.detailMetaItem}>
              <Text style={styles.detailMetaLabel}>
                <MaterialCommunityIcons name="sync" size={13} color={colors.textTertiary} /> Next Charge
              </Text>
              <Text style={styles.detailMetaValue}>
                {nextRenewal ? formatDate(nextRenewal) : 'N/A'}
              </Text>
            </View>
          ) : end_date ? (
            <View style={styles.detailMetaItem}>
              <Text style={styles.detailMetaLabel}>
                <MaterialCommunityIcons name="clock-outline" size={13} color={colors.textTertiary} /> Access Ends
              </Text>
              <Text style={styles.detailMetaValue}>
                {formatDate(new Date(end_date))}
              </Text>
            </View>
          ) : null}
        </View>

        {isPaused && (
          <View style={styles.pauseBanner}>
            <MaterialCommunityIcons name="pause-circle-outline" size={16} color={colors.info} />
            <Text style={styles.pauseBannerText}>
              Membership paused
              {membership.pause_end_at
                ? ` until ${formatDate(new Date(membership.pause_end_at))}`
                : ' until resumed'}
            </Text>
          </View>
        )}

        {showUpgrade && (
          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={onUpgrade}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="arrow-up-bold-outline" size={18} color={colors.accent} />
            <Text style={styles.upgradeButtonText}>Change Plan</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Service Usage Cards */}
      {planServices.length > 0 && !isPaused && (
        <>
          <View style={styles.sectionTitleRow}>
            <MaterialCommunityIcons name="view-grid-outline" size={16} color={colors.textPrimary} />
            <Text style={styles.sectionTitleText}>Service Allotments</Text>
          </View>
          {planServices.map((ps) => {
            const used = Number(ps.used_quantity || 0);
            const remaining = ps.remaining_quantity == null ? null : Number(ps.remaining_quantity);
            const total = remaining === null ? null : used + remaining;
            const nextReset = getNextRenewalDate(start_date, billing_cycle);

            return (
              <ServiceUsageCard
                key={ps.id || ps.service_id}
                serviceName={ps.service?.name || 'Service'}
                used={used}
                remaining={remaining}
                total={total}
                resetDate={nextReset ? formatDate(nextReset) : null}
              />
            );
          })}
        </>
      )}
    </>
  );
};

// ─── Plans List View ────────────────────────────────────────────────────────
const PlansListView = ({ plans, selectedCycles, onSelectCycle, onSelectPlan }) => (
  <>
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
          style={[styles.planCard, isFeatured && styles.planCardFeatured]}
        >
          {isFeatured && (
            <View style={styles.featuredBadge}>
              <Text style={styles.featuredBadgeText}>POPULAR</Text>
            </View>
          )}

          <Text style={styles.planName}>{plan.name}</Text>
          {plan.description && (
            <Text style={styles.planDescription}>{plan.description}</Text>
          )}

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
                    onPress={() => onSelectCycle(plan.id, cycle)}
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
              <Text style={styles.planPrice}>{formatCurrency(displayPrice)}</Text>
              <Text style={styles.planPeriod}>
                /{selectedCycle?.billing_cycle || 'month'}
              </Text>
            </View>
          )}

          {planServices.length > 0 && (
            <View style={styles.planServicesSection}>
              {planServices.map((ps, i) => (
                <View key={ps.id || i} style={styles.planServiceRow}>
                  <MaterialCommunityIcons name="check-circle" size={18} color={colors.success} />
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

          {planServices.length === 0 && plan.benefits && plan.benefits.length > 0 && (
            <View style={styles.planBenefits}>
              {plan.benefits.map((benefit, i) => (
                <View key={i} style={styles.benefitRow}>
                  <MaterialCommunityIcons name="check-circle" size={18} color={colors.success} />
                  <Text style={styles.benefitText}>
                    {typeof benefit === 'string' ? benefit : benefit.description || benefit.name}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity
            style={[styles.selectPlanButton, isFeatured && styles.selectPlanButtonFeatured]}
            onPress={() => onSelectPlan(plan)}
            activeOpacity={0.8}
          >
            <Text style={styles.selectPlanButtonText}>Select Plan</Text>
          </TouchableOpacity>
        </View>
      );
    })}
  </>
);

// ─── Main Screen ─────────────────────────────────────────────────────────────
const MembershipPlansScreen = ({ navigation, route }) => {
  const showPlansOnly = route.params?.showPlansOnly || false;

  const [membership, setMembership] = useState(null);
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCycles, setSelectedCycles] = useState({});
  const [viewMode, setViewMode] = useState(showPlansOnly ? 'plans' : null); // null = auto-detect

  const loadData = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setIsRefreshing(true);
      else setIsLoading(true);
      setError(null);

      if (!showPlansOnly) {
        // Try to fetch active membership first
        try {
          const membershipRes = await getMyMembership();
          const membershipData = membershipRes?.data || null;
          setMembership(membershipData);
          if (membershipData) {
            setViewMode('details');
            return;
          }
        } catch (membershipErr) {
          // 404 = no membership, which is fine — show plans
          if (membershipErr?.response?.status !== 404) {
            logger.warn('Failed to fetch membership:', membershipErr?.message);
          }
          setMembership(null);
        }
      }

      // No active membership (or showPlansOnly) — load available plans
      setViewMode('plans');
      const { data } = await getMembershipPlans();
      const planList = data || [];
      setPlans(planList);

      const defaults = {};
      planList.forEach((plan) => {
        const cycles = plan.billing_cycles || plan.billingCycles || [];
        const defaultCycle = cycles.find((c) => c.is_default) || cycles[0];
        if (defaultCycle) defaults[plan.id] = defaultCycle;
      });
      setSelectedCycles(defaults);
    } catch (err) {
      logger.warn('Failed to load membership data:', err?.message || err);
      setError('Failed to load membership information.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [showPlansOnly]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });
    return unsubscribe;
  }, [navigation, loadData]);

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

  const handleUpgrade = useCallback(() => {
    navigation.push(SCREENS.MEMBERSHIP_PLANS, { showPlansOnly: true });
  }, [navigation]);

  const screenTitle = viewMode === 'plans' ? 'Membership Plans' : 'Membership';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader
        title={screenTitle}
        onBack={() => navigation.goBack()}
      />

      {isLoading ? (
        <ListSkeleton count={4} />
      ) : error ? (
        <View style={globalStyles.errorContainer}>
          <Text style={globalStyles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => loadData()} style={globalStyles.retryButton}>
            <Text style={globalStyles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => loadData(true)}
              tintColor={colors.primary}
            />
          }
        >
          {viewMode === 'details' && membership ? (
            <ActiveMembershipView
              membership={membership}
              onUpgrade={handleUpgrade}
            />
          ) : viewMode === 'plans' && plans.length > 0 ? (
            <PlansListView
              plans={plans}
              selectedCycles={selectedCycles}
              onSelectCycle={handleSelectCycle}
              onSelectPlan={handleSelectPlan}
            />
          ) : viewMode === 'plans' ? (
            <EmptyState
              icon="card-account-details-outline"
              title="No Plans Available"
              message="There are no membership plans available at this time."
            />
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default MembershipPlansScreen;
