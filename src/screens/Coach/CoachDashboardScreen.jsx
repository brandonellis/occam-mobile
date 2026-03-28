import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { IconButton, TouchableRipple } from 'react-native-paper';
import useAuth from '../../hooks/useAuth';
import useProactiveInsights from '../../hooks/useProactiveInsights';
import { SCREENS } from '../../constants/navigation.constants';
import { formatTimeInTz, getTodayKey } from '../../helpers/timezone.helper';
import { buildInsightMarshalIntent } from '../../helpers/marshalIntent.helper';
import useMarshalIntent from '../../hooks/useMarshalIntent';
import { dashboardStyles as styles } from '../../styles/dashboard.styles';
import { CoachDashboardSkeleton } from '../../components/SkeletonLoader';
import EmptyState from '../../components/EmptyState';
import ProactiveInsightsSection from '../../components/Dashboard/ProactiveInsightsSection';
import useUnreadNotifications from '../../hooks/useUnreadNotifications';
import useBookingsQuery from '../../hooks/useBookingsQuery';
import useClientCountQuery from '../../hooks/useClientCountQuery';
import useRefetchOnFocus from '../../hooks/useRefetchOnFocus';
import { colors } from '../../theme';

const CoachDashboardScreen = ({ navigation }) => {
  const { user, company } = useAuth();
  const firstName = user?.first_name || user?.name?.split(' ')[0] || 'Coach';

  const { unreadCount } = useUnreadNotifications();
  const insights = useProactiveInsights();
  const { deliverIntent } = useMarshalIntent();

  const handleAskMarshal = useCallback((insightType, insightData) => {
    deliverIntent(buildInsightMarshalIntent({ insightType, data: insightData }));
    navigation.navigate(SCREENS.MARSHAL);
  }, [deliverIntent, navigation]);

  const todayKey = getTodayKey(company);

  const bookingParams = useMemo(() => ({
    start_date: todayKey,
    end_date: todayKey,
    coach_id: user?.id,
  }), [todayKey, user?.id]);

  const { data: rawSessions, isLoading: bookingsLoading, refetch: refetchBookings, isRefetching: bookingsRefetching, error: bookingsError } = useBookingsQuery(bookingParams);
  const { data: clientCount, refetch: refetchClients, isRefetching: clientsRefetching } = useClientCountQuery();

  const refetch = useCallback(() => {
    refetchBookings();
    refetchClients();
  }, [refetchBookings, refetchClients]);

  useRefetchOnFocus(refetch);

  const isLoading = bookingsLoading;
  const isRefreshing = bookingsRefetching || clientsRefetching;
  const error = bookingsError;

  const sessions = useMemo(() => {
    const list = rawSessions || [];
    return [...list].sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));
  }, [rawSessions]);

  const upcomingSessions = useMemo(() => {
    const now = Date.now();
    return sessions.filter((s) => {
      if (!s.start_time) return true;
      const startDate = new Date(s.start_time);
      return Number.isNaN(startDate.getTime()) || startDate.getTime() >= now;
    });
  }, [sessions]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
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
        <View style={styles.header}>
          <Text style={styles.greeting}>Hello, {firstName}</Text>
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

        {isLoading ? (
          <CoachDashboardSkeleton />
        ) : error ? (
          <EmptyState
            icon="cloud-offline-outline"
            title="Couldn't Load Dashboard"
            message="Unable to load your dashboard. Pull down to retry."
            actionLabel="Retry"
            onAction={refetch}
          />
        ) : (
          <>
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{sessions.length}</Text>
                <Text style={styles.statLabel}>Today's Sessions</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>
                  {clientCount != null ? clientCount : '—'}
                </Text>
                <Text style={styles.statLabel}>Active Clients</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <View style={styles.quickActions}>
                <TouchableOpacity
                  testID="new-booking-quick-action"
                  style={styles.quickActionButton}
                  activeOpacity={0.7}
                  onPress={() => navigation.navigate(SCREENS.CLIENT_SELECTION, { bookingData: {} })}
                >
                  <View style={[styles.quickActionIcon, { backgroundColor: colors.accentLight }]}>
                    <MaterialCommunityIcons name="plus-circle-outline" size={18} color={colors.accent} />
                  </View>
                  <Text style={styles.quickActionLabel} numberOfLines={1}>New Booking</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickActionButton}
                  activeOpacity={0.7}
                  onPress={() => navigation.navigate(SCREENS.VIDEO_RECORDING)}
                >
                  <View style={[styles.quickActionIcon, { backgroundColor: colors.lavenderMistLight }]}>
                    <MaterialCommunityIcons name="video-outline" size={18} color={colors.twilightPurple} />
                  </View>
                  <Text style={styles.quickActionLabel} numberOfLines={1}>Record Video</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickActionButton}
                  activeOpacity={0.7}
                  onPress={() => navigation.navigate('ClientsTab', { screen: SCREENS.COACH_CLIENTS })}
                >
                  <View style={[styles.quickActionIcon, { backgroundColor: colors.successLight }]}>
                    <MaterialCommunityIcons name="account-group-outline" size={18} color={colors.success} />
                  </View>
                  <Text style={styles.quickActionLabel} numberOfLines={1}>View Clients</Text>
                </TouchableOpacity>
              </View>
            </View>

            <ProactiveInsightsSection
              cards={insights.cards}
              isLoading={insights.isLoading}
              error={insights.error}
              onRefresh={insights.fetchInsights}
              onAskMarshal={handleAskMarshal}
            />

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Upcoming Sessions</Text>
                <TouchableRipple
                  onPress={() => navigation.navigate('ScheduleTab', { screen: SCREENS.COACH_SCHEDULE })}
                  borderless
                >
                  <Text style={styles.seeAllLink}>See All</Text>
                </TouchableRipple>
              </View>
              {upcomingSessions.length === 0 ? (
                <EmptyState
                  icon="calendar-outline"
                  title="All Clear"
                  message="No more sessions for today. Enjoy the rest of your day!"
                />
              ) : (
                upcomingSessions.slice(0, 5).map((session) => (
                  <TouchableRipple
                    key={session.id}
                    style={styles.bookingCard}
                    onPress={() => navigation.navigate(SCREENS.BOOKING_DETAIL, { bookingId: session.id })}
                    borderless
                  >
                    <View style={styles.bookingCardRow}>
                      <View style={styles.bookingTimeBlock}>
                        <Text style={styles.bookingTimeValue}>
                          {formatTimeInTz(session.start_time, company)}
                        </Text>
                      </View>
                      <View style={styles.bookingCardContent}>
                        <Text style={styles.bookingService}>
                          {session.services?.[0]?.name || session.service?.name || 'Session'}
                        </Text>
                        {session.client && (
                          <Text style={styles.bookingCoach}>
                            {session.client.first_name} {session.client.last_name}
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
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default CoachDashboardScreen;
