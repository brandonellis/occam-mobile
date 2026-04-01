import React, { useEffect, useCallback, useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ListSkeleton } from '../../components/SkeletonLoader';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ScreenHeader from '../../components/ScreenHeader';
import EmptyState from '../../components/EmptyState';
import ServiceUsageCard from '../../components/ServiceUsageCard';
import { membershipStyles as styles } from '../../styles/membership.styles';
import { globalStyles } from '../../styles/global.styles';
import { pauseMembership, resumeMembership } from '../../services/accounts.api';
import { formatCurrency } from '../../helpers/pricing.helper';
import { getBillingCycleLabel } from '../../constants/billing.constants';
import logger from '../../helpers/logger.helper';
import {
  getMembershipStatus,
  isMembershipPausedNow,
  getNextRenewalDate,
  formatDate,
} from '../../helpers/membership.helper';
import { colors } from '../../theme';
import { SCREENS } from '../../constants/navigation.constants';
import { COACH_ROLES } from '../../constants/auth.constants';
import useAuth from '../../hooks/useAuth';
import useMyMembershipSelfQuery from '../../hooks/useMyMembershipSelfQuery';
import useMembershipPlansQuery from '../../hooks/useMembershipPlansQuery';
import useRefetchOnFocus from '../../hooks/useRefetchOnFocus';
import { openMembershipPurchase } from '../../helpers/webRedirect.helper';

// ─── Active Membership View ─────────────────────────────────────────────────
const ActiveMembershipView = ({ membership, onUpgrade, onPause, onResume }) => {
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
  const showActions = mStatus !== 'expired' && mStatus !== 'inactive';

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

        {showActions && (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {showUpgrade && (
              <TouchableOpacity
                style={[styles.upgradeButton, { flex: 1 }]}
                onPress={onUpgrade}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="arrow-up-bold-outline" size={18} color={colors.accent} />
                <Text style={styles.upgradeButtonText}>Change Plan</Text>
              </TouchableOpacity>
            )}
            {isPaused ? (
              <TouchableOpacity
                style={[styles.upgradeButton, { flex: 1 }]}
                onPress={onResume}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="play-circle-outline" size={18} color={colors.success} />
                <Text style={[styles.upgradeButtonText, { color: colors.success }]}>Resume</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.upgradeButton, { flex: 1 }]}
                onPress={onPause}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="pause-circle-outline" size={18} color={colors.warning} />
                <Text style={[styles.upgradeButtonText, { color: colors.warning }]}>Pause</Text>
              </TouchableOpacity>
            )}
          </View>
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
const PlansListView = ({ plans, selectedCycles, onSelectCycle, onSelectPlan, isCoach }) => (
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
            <Text style={styles.selectPlanButtonText}>{isCoach ? 'Select Plan' : 'Purchase on Web'}</Text>
          </TouchableOpacity>
        </View>
      );
    })}
  </>
);

// ─── Main Screen ─────────────────────────────────────────────────────────────
const MembershipPlansScreen = ({ navigation, route }) => {
  const { activeRole } = useAuth();
  const isCoach = COACH_ROLES.includes(activeRole);
  const showPlansOnly = route.params?.showPlansOnly || false;

  const { data: membership, isLoading: membershipLoading, refetch: refetchMembership, isRefetching: membershipRefetching, error: membershipError } = useMyMembershipSelfQuery();

  // Show plans if: showPlansOnly flag, or no active membership
  const shouldShowPlans = showPlansOnly || (!membershipLoading && !membership);
  const { data: plans = [], isLoading: plansLoading, refetch: refetchPlans, isRefetching: plansRefetching, error: plansError } = useMembershipPlansQuery({
    enabled: shouldShowPlans,
  });

  const refetch = useCallback(() => {
    refetchMembership();
    if (shouldShowPlans) refetchPlans();
  }, [refetchMembership, refetchPlans, shouldShowPlans]);

  useRefetchOnFocus(refetch);

  const isLoading = membershipLoading || (shouldShowPlans && plansLoading);
  const isRefreshing = membershipRefetching || plansRefetching;
  const error = membershipError || plansError;

  const viewMode = (!membershipLoading && membership && !showPlansOnly) ? 'details' : 'plans';

  const [selectedCycles, setSelectedCycles] = useState({});

  // Initialize default billing cycles when plans load
  useEffect(() => {
    if (plans.length > 0) {
      setSelectedCycles((prev) => {
        const defaults = { ...prev };
        plans.forEach((plan) => {
          if (!defaults[plan.id]) {
            const cycles = plan.billing_cycles || plan.billingCycles || [];
            const defaultCycle = cycles.find((c) => c.is_default) || cycles[0];
            if (defaultCycle) defaults[plan.id] = defaultCycle;
          }
        });
        return defaults;
      });
    }
  }, [plans]);

  const handleSelectCycle = useCallback((planId, cycle) => {
    setSelectedCycles((prev) => ({ ...prev, [planId]: cycle }));
  }, []);

  const handleSelectPlan = useCallback(
    (plan) => {
      const billingCycle = selectedCycles[plan.id];

      // Clients: redirect to web for purchase (App Store compliance)
      if (!isCoach) {
        Alert.alert(
          'Purchase on Web',
          'To purchase this membership, you\'ll be taken to our website. Your membership will appear here once completed.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Continue',
              onPress: async () => {
                await openMembershipPurchase();
                refetch();
              },
            },
          ]
        );
        return;
      }

      // Conflict check: if user already has an active membership, warn before proceeding
      if (membership) {
        const currentPlan = membership.membership_plan;
        const currentCycle = membership.billing_cycle;

        // Duplicate: same plan and same billing cycle
        if (currentPlan?.id === plan.id && currentCycle?.id === billingCycle?.id) {
          Alert.alert(
            'Duplicate Membership',
            'You already have this exact membership active.',
            [{ text: 'OK' }]
          );
          return;
        }

        // Determine change type for messaging
        const currentPrice = parseFloat(currentCycle?.price || 0);
        const selectedPrice = parseFloat(billingCycle?.price || 0);
        let changeType = 'replace';
        if (currentPlan?.id === plan.id) changeType = 'change billing cycle';
        else if (selectedPrice > currentPrice) changeType = 'upgrade';
        else if (selectedPrice < currentPrice) changeType = 'downgrade';

        Alert.alert(
          'Membership Change',
          `You currently have the ${currentPlan?.name || 'current'} plan. Proceeding will ${changeType} your membership to ${plan.name}. Your current membership will be cancelled.`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Continue',
              onPress: () => navigation.navigate(SCREENS.MEMBERSHIP_CHECKOUT, {
                plan,
                billingCycle,
                existingMembership: membership,
              }),
            },
          ]
        );
        return;
      }

      navigation.navigate(SCREENS.MEMBERSHIP_CHECKOUT, { plan, billingCycle });
    },
    [navigation, selectedCycles, membership, isCoach, refetch]
  );

  const handleUpgrade = useCallback(() => {
    navigation.push(SCREENS.MEMBERSHIP_PLANS, { showPlansOnly: true });
  }, [navigation]);

  const handlePause = useCallback(() => {
    if (!membership?.id) return;
    Alert.alert(
      'Pause Membership',
      'Are you sure you want to pause your membership? You will not be able to use membership benefits while paused.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Pause Now',
          style: 'destructive',
          onPress: async () => {
            try {
              await pauseMembership(membership.id, {
                pause_start_at: new Date().toISOString(),
                reason: 'Paused from mobile app',
              });
              refetchMembership();
            } catch (err) {
              logger.warn('Failed to pause membership:', err?.response?.data?.message || err?.message);
              Alert.alert('Error', 'Failed to pause membership. Please try again.');
            }
          },
        },
      ]
    );
  }, [membership?.id, refetchMembership]);

  const handleResume = useCallback(() => {
    if (!membership?.id) return;
    Alert.alert(
      'Resume Membership',
      'Resume your membership and regain access to all benefits?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Resume',
          onPress: async () => {
            try {
              await resumeMembership(membership.id);
              refetchMembership();
            } catch (err) {
              logger.warn('Failed to resume membership:', err?.response?.data?.message || err?.message);
              Alert.alert('Error', 'Failed to resume membership. Please try again.');
            }
          },
        },
      ]
    );
  }, [membership?.id, refetchMembership]);

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
          <Text style={globalStyles.errorText}>Failed to load membership information.</Text>
          <TouchableOpacity onPress={refetch} style={globalStyles.retryButton}>
            <Text style={globalStyles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
        >
          {viewMode === 'details' && membership ? (
            <ActiveMembershipView
              membership={membership}
              onUpgrade={handleUpgrade}
              onPause={handlePause}
              onResume={handleResume}
            />
          ) : viewMode === 'plans' && plans.length > 0 ? (
            <PlansListView
              plans={plans}
              selectedCycles={selectedCycles}
              onSelectCycle={handleSelectCycle}
              onSelectPlan={handleSelectPlan}
              isCoach={isCoach}
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
