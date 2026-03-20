import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { IconButton, TouchableRipple } from 'react-native-paper';
import useAuth from '../../hooks/useAuth';
import { SCREENS } from '../../constants/navigation.constants';
import { getBookings } from '../../services/bookings.api';
import { getMyMembership } from '../../services/accounts.api';
import { isMembershipActive } from '../../helpers/membership.helper';
import { formatTimeInTz, formatDateInTz, getTodayKey, getFutureDateKey } from '../../helpers/timezone.helper';
import { dashboardStyles as styles } from '../../styles/dashboard.styles';
import { DashboardSkeleton } from '../../components/SkeletonLoader';
import EmptyState from '../../components/EmptyState';
import useUnreadNotifications from '../../hooks/useUnreadNotifications';
import { colors } from '../../theme';
import logger from '../../helpers/logger.helper';

const ClientHomeScreen = ({ navigation }) => {
  const { user, company } = useAuth();
  const firstName = user?.first_name || user?.name?.split(' ')[0] || '';

  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [hasMembership, setHasMembership] = useState(false);
  const { unreadCount } = useUnreadNotifications();

  const todayKey = useMemo(() => getTodayKey(company), [company]);
  const futureKey = useMemo(() => getFutureDateKey(company, 30), [company]);

  const loadBookings = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setIsRefreshing(true);
      else setIsLoading(true);
      const { data } = await getBookings({
        client_id: user?.id,
        start_date: todayKey,
        end_date: futureKey,
      });
      const sorted = (data || []).sort((a, b) =>
        (a.start_time || '').localeCompare(b.start_time || '')
      );
      setSessions(sorted);
      setError(null);
    } catch (err) {
      logger.warn('Failed to load bookings:', err?.message || err);
      setError('Unable to load your sessions. Pull down to retry.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.id, todayKey, futureKey]);

  const checkMembership = useCallback(async () => {
    try {
      const result = await getMyMembership();
      setHasMembership(isMembershipActive(result?.data || result));
    } catch {
      // Non-critical — default to showing the button
    }
  }, []);

  // Refetch every time the screen comes into focus (e.g. after booking)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadBookings();
      checkMembership();
    });
    return unsubscribe;
  }, [navigation, loadBookings, checkMembership]);

  // Filter to only upcoming sessions using native Date (Hermes-safe)
  const nowMs = Date.now();
  const upcomingSessions = sessions.filter((s) => {
    if (!s.start_time) return true;
    const cutoff = s.end_time || s.start_time;
    return new Date(cutoff).getTime() >= nowMs;
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <DashboardSkeleton />
      </SafeAreaView>
    );
  }

  if (error && sessions.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => loadBookings(true)}
              tintColor={colors.primary}
            />
          }
        >
          <View style={styles.header}>
            <Text style={styles.greeting}>Welcome, {firstName}</Text>
          </View>
          <EmptyState
            icon="cloud-offline-outline"
            title="Couldn't Load Sessions"
            message={error}
            actionLabel="Retry"
            onAction={() => loadBookings()}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadBookings(true)}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>Welcome, {firstName}</Text>
          <View>
            <IconButton
              icon="bell-outline"
              size={24}
              iconColor={colors.primary}
              onPress={() => navigation.navigate(SCREENS.NOTIFICATIONS)}
              style={{ margin: 0 }}
            />
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickActionButton}
              activeOpacity={0.7}
              onPress={() => navigation.navigate(SCREENS.SERVICE_SELECTION, { bookingData: {} })}
              testID="book-session-button"
            >
              <View style={[styles.quickActionIcon, { backgroundColor: colors.accentLight }]}>
                <MaterialCommunityIcons name="calendar-outline" size={18} color={colors.accent} />
              </View>
              <Text style={styles.quickActionLabel} numberOfLines={1}>Book Session</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionButton}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('ActivityTab', { screen: SCREENS.CLIENT_PROGRESS, params: { initialTab: 'resources' } })}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: colors.lavenderMistLight }]}>
                <MaterialCommunityIcons name="play-circle-outline" size={18} color={colors.twilightPurple} />
              </View>
              <Text style={styles.quickActionLabel} numberOfLines={1}>My Resources</Text>
            </TouchableOpacity>
            {!hasMembership && (
              <TouchableOpacity
                style={styles.quickActionButton}
                activeOpacity={0.7}
                onPress={() => navigation.navigate(SCREENS.MEMBERSHIP_PLANS)}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: colors.successLight }]}>
                  <MaterialCommunityIcons name="credit-card-outline" size={18} color={colors.success} />
                </View>
                <Text style={styles.quickActionLabel} numberOfLines={1}>Membership</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.quickActionButton}
              activeOpacity={0.7}
              onPress={() => navigation.navigate(SCREENS.PACKAGE_LIST)}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: colors.warningLight }]}>
                <MaterialCommunityIcons name="package-variant" size={18} color={colors.warning} />
              </View>
              <Text style={styles.quickActionLabel} numberOfLines={1}>Packages</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Sessions</Text>
            <TouchableRipple
              onPress={() => navigation.navigate(SCREENS.CLIENT_BOOKINGS)}
              borderless
            >
              <Text style={styles.seeAllLink}>See All</Text>
            </TouchableRipple>
          </View>
          {upcomingSessions.length === 0 ? (
            <EmptyState
              icon="calendar-outline"
              title="No Upcoming Sessions"
              message="Ready to hit the range? Book your next session and keep the momentum going."
              actionLabel="Book a Session"
              onAction={() => navigation.navigate(SCREENS.SERVICE_SELECTION, { bookingData: {} })}
            />
          ) : (
            upcomingSessions.slice(0, 5).map((session) => {
              const coach = session.coaches?.[0] || null;
              return (
                <TouchableRipple
                  key={session.id}
                  style={styles.bookingCard}
                  onPress={() => navigation.navigate(SCREENS.BOOKING_DETAIL, { booking: session })}
                  borderless
                >
                  <View style={styles.bookingCardRow}>
                    <View style={styles.bookingTimeBlock}>
                      <Text style={styles.bookingTimeValue}>
                        {formatTimeInTz(session.start_time, company)}
                      </Text>
                      <Text style={styles.bookingTimeDate}>
                        {formatDateInTz(session.start_time, company)}
                      </Text>
                    </View>
                    <View style={styles.bookingCardContent}>
                      <Text style={styles.bookingService}>
                        {session.services?.[0]?.name || 'Session'}
                      </Text>
                      {coach && (
                        <Text style={styles.bookingCoach}>
                          {coach.first_name} {coach.last_name}
                        </Text>
                      )}
                      {session.location && (
                        <Text style={styles.bookingTime}>
                          {session.location.name}
                        </Text>
                      )}
                    </View>
                    <MaterialCommunityIcons
                      name="chevron-right"
                      size={18}
                      color={colors.textTertiary}
                    />
                  </View>
                </TouchableRipple>
              );
            })
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

export default ClientHomeScreen;
