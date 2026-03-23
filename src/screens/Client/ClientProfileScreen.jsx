import React, { useEffect, useCallback, useState, useMemo, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { ActivityIndicator, Button as PaperButton, List } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import useAuth from '../../hooks/useAuth';
import RoleSwitcher from '../../components/RoleSwitcher';
import ServiceUsageCard from '../../components/ServiceUsageCard';
import EmptyState from '../../components/EmptyState';
import { globalStyles } from '../../styles/global.styles';
import { clientProfileStyles as styles } from '../../styles/clientProfile.styles';
import { getMyMembership } from '../../services/accounts.api';
import { getMyPackages } from '../../services/packages.api';
import { getMembershipStatus, getNextRenewalDate, formatDate, isMembershipPausedNow } from '../../helpers/membership.helper';
import { formatCurrency } from '../../helpers/pricing.helper';
import { getBillingCycleLabel } from '../../constants/billing.constants';
import { colors, spacing } from '../../theme';
import { SCREENS } from '../../constants/navigation.constants';
import logger from '../../helpers/logger.helper';

const ClientProfileScreen = ({ navigation }) => {
  const { user, logout } = useAuth();

  const [membership, setMembership] = useState(null);
  const [packages, setPackages] = useState([]);
  const [benefitsLoading, setBenefitsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadBenefits = useCallback(async ({ refresh = false, silent = false } = {}) => {
    if (refresh) setRefreshing(true);
    else if (!silent) setBenefitsLoading(true);

    const [membershipResult, packagesResult] = await Promise.allSettled([
      getMyMembership(),
      getMyPackages(),
    ]);

    if (membershipResult.status === 'fulfilled') {
      setMembership(membershipResult.value?.data || null);
    } else {
      if (membershipResult.reason?.response?.status !== 404) {
        logger.warn('Failed to fetch membership:', membershipResult.reason?.message);
      }
      setMembership(null);
    }

    if (packagesResult.status === 'fulfilled') {
      const list = packagesResult.value;
      setPackages(Array.isArray(list) ? list : []);
    } else {
      logger.warn('Failed to fetch packages:', packagesResult.reason?.message);
      setPackages([]);
    }

    setBenefitsLoading(false);
    setRefreshing(false);
  }, []);

  // Track initial load — skip silent refetch on first mount since loadBenefits
  // already shows a loading state. On subsequent focus events (e.g. returning
  // from package purchase), refetch silently so updated data appears.
  const hasMounted = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (!hasMounted.current) {
        hasMounted.current = true;
        loadBenefits();
      } else {
        loadBenefits({ silent: true });
      }
    }, [loadBenefits])
  );

  const activePackages = useMemo(
    () => packages.filter((cp) => cp.status === 'active'),
    [packages]
  );

  const membershipStatus = membership ? getMembershipStatus(membership) : null;
  const isPaused = membership ? isMembershipPausedNow(membership) : false;
  const planServices = membership?.membership_plan?.plan_services || [];
  const billingCycle = membership?.billing_cycle;
  const startDate = membership?.start_date;

  const hasBenefits = !!membership || activePackages.length > 0;

  return (
    <SafeAreaView style={globalStyles.container} edges={['top']}>
      <View style={globalStyles.screenHeader}>
        <Text style={globalStyles.screenHeaderTitle}>Profile</Text>
      </View>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: spacing.tabBarClearance }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadBenefits({ refresh: true })}
            tintColor={colors.primary}
          />
        }
      >
        {/* User Info Card */}
        <View style={styles.userCard}>
          <Text style={styles.userName}>
            {user?.first_name} {user?.last_name}
          </Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>

        <RoleSwitcher />

        {/* ─── Benefits Section ───────────────────────────────────────── */}
        <View style={styles.benefitsSection}>
          <View style={styles.sectionTitleRow}>
            <MaterialCommunityIcons name="star-outline" size={18} color={colors.textPrimary} />
            <Text style={styles.sectionTitleText}>My Benefits</Text>
          </View>

          {benefitsLoading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={colors.accent} />
              <Text style={styles.loadingText}>Loading benefits...</Text>
            </View>
          ) : !hasBenefits ? (
            <EmptyState
              icon="gift-outline"
              title="No Active Benefits"
              message="Unlock memberships and packages for the best value on your sessions."
              actionLabel="Browse Plans"
              onAction={() => navigation.navigate('HomeTab', { screen: SCREENS.MEMBERSHIP_PLANS })}
            />
          ) : (
            <>
              {/* ─── Membership Allotments ─── */}
              {membership && (
                <>
                  <View style={styles.membershipCard}>
                    <View style={styles.membershipHeader}>
                      <Text style={styles.membershipPlanName}>
                        {membership.membership_plan?.name || 'Membership'}
                      </Text>
                      {membershipStatus && (
                        <View style={[styles.statusBadge, { backgroundColor: membershipStatus.color + '20' }]}>
                          <View style={[styles.statusDot, { backgroundColor: membershipStatus.color }]} />
                          <Text style={[styles.statusBadgeText, { color: membershipStatus.color }]}>
                            {membershipStatus.text}
                          </Text>
                        </View>
                      )}
                    </View>
                    {billingCycle && (
                      <Text style={styles.membershipBilling}>
                        {getBillingCycleLabel(billingCycle.billing_cycle)} · {formatCurrency(parseFloat(billingCycle.price))}
                      </Text>
                    )}
                  </View>

                  {planServices.length > 0 && !isPaused && planServices.map((ps) => {
                    const used = Number(ps.used_quantity || 0);
                    const remaining = ps.remaining_quantity == null ? null : Number(ps.remaining_quantity);
                    const total = remaining === null ? null : used + remaining;
                    const nextReset = getNextRenewalDate(startDate, billingCycle);

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

              {/* ─── Package Allotments ─── */}
              {activePackages.length > 0 && (
                <>
                  {activePackages.map((cp) => {
                    const pkg = cp.package || {};
                    const balanceSummary = cp.balance_summary || [];

                    return (
                      <React.Fragment key={cp.id}>
                        <View style={styles.packageCard}>
                          <View style={styles.packageHeader}>
                            <Text style={styles.packageName}>
                              {pkg.name || 'Package'}
                            </Text>
                            <View style={[styles.statusBadge, { backgroundColor: colors.success + '20' }]}>
                              <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
                              <Text style={[styles.statusBadgeText, { color: colors.success }]}>
                                Active
                              </Text>
                            </View>
                          </View>
                        </View>

                        {balanceSummary.map((svc) => (
                          <ServiceUsageCard
                            key={`${cp.id}-${svc.service_id}`}
                            serviceName={svc.service_name || 'Service'}
                            used={svc.used ?? 0}
                            remaining={svc.remaining ?? null}
                            total={svc.quantity ?? 0}
                          />
                        ))}
                      </React.Fragment>
                    );
                  })}
                </>
              )}

              {/* ─── Action Buttons ─── */}
              <View style={styles.actionButtonRow}>
                {membership && !isPaused && membershipStatus?.status !== 'expired' && membershipStatus?.status !== 'inactive' && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => navigation.navigate('HomeTab', { screen: SCREENS.MEMBERSHIP_PLANS })}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons name="arrow-up-bold-outline" size={16} color={colors.accent} />
                    <Text style={styles.actionButtonText}>Upgrade Membership</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => navigation.navigate('HomeTab', { screen: SCREENS.PACKAGE_LIST })}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="package-variant" size={16} color={colors.accent} />
                  <Text style={styles.actionButtonText}>Purchase Package</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        {/* Settings */}
        <View style={styles.settingsSection}>
          <List.Item
            title="Notification Settings"
            left={(props) => <List.Icon {...props} icon="bell-cog-outline" color={colors.textSecondary} />}
            right={(props) => <List.Icon {...props} icon="chevron-right" color={colors.textTertiary} />}
            onPress={() => navigation.navigate(SCREENS.NOTIFICATION_PREFERENCES)}
            style={styles.settingsRow}
          />
          <List.Item
            title="Calendar Sync"
            description="Sync bookings to your calendar"
            left={(props) => <List.Icon {...props} icon="calendar-sync-outline" color={colors.textSecondary} />}
            right={(props) => <List.Icon {...props} icon="chevron-right" color={colors.textTertiary} />}
            onPress={() => navigation.navigate(SCREENS.CALENDAR_SYNC)}
            style={styles.settingsRow}
          />
        </View>

        {/* Sign Out */}
        <PaperButton
          testID="sign-out-button"
          mode="text"
          textColor={colors.error}
          onPress={logout}
          style={styles.signOutButton}
        >
          Sign Out
        </PaperButton>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ClientProfileScreen;
