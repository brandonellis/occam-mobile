import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import useAuth from '../../hooks/useAuth';
import { SCREENS } from '../../constants/navigation.constants';
import { formatTimeInTz, getTodayKey } from '../../helpers/timezone.helper';
import { getBookings } from '../../services/bookings.api';
import { getClients } from '../../services/accounts.api';
import { dashboardStyles as styles } from '../../styles/dashboard.styles';
import { globalStyles } from '../../styles/global.styles';
import EmptyState from '../../components/EmptyState';
import { colors } from '../../theme';

const CoachDashboardScreen = ({ navigation }) => {
  const { user, company } = useAuth();
  const firstName = user?.first_name || user?.name?.split(' ')[0] || 'Coach';

  const [sessions, setSessions] = useState([]);
  const [clientCount, setClientCount] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const todayKey = getTodayKey(company);

  const loadDashboard = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setIsRefreshing(true);
      else setIsLoading(true);

      const [bookingsRes, clientsRes] = await Promise.allSettled([
        getBookings({ start_date: todayKey, end_date: todayKey, coach_id: user?.id }),
        getClients({ per_page: 1 }),
      ]);

      if (bookingsRes.status === 'fulfilled') {
        const data = bookingsRes.value?.data || [];
        const sorted = data.sort((a, b) =>
          (a.start_time || '').localeCompare(b.start_time || '')
        );
        setSessions(sorted);
      }

      if (clientsRes.status === 'fulfilled') {
        const meta = clientsRes.value?.meta || clientsRes.value;
        setClientCount(meta?.total ?? clientsRes.value?.data?.length ?? null);
      }
    } catch {
      // Keep existing state on error
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [todayKey]);

  // Load on mount + refresh when returning to dashboard
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadDashboard();
    });
    return unsubscribe;
  }, [navigation, loadDashboard]);

  const now = new Date();
  const upcomingSessions = sessions.filter((s) => {
    if (!s.start_time) return true;
    // start_time is ISO 8601 — compare as Date
    const startDate = new Date(s.start_time);
    return isNaN(startDate.getTime()) || startDate >= now;
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadDashboard(true)}
            tintColor={colors.primary}
          />
        }
      >
        <View style={[styles.header, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }]}>
          <View>
            <Text style={styles.greeting}>Hello, {firstName}</Text>
            <Text style={styles.subtitle}>Here's your day at a glance</Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate(SCREENS.NOTIFICATIONS)}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="notifications-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={globalStyles.loadingContainerInline}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
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
                  style={styles.quickActionButton}
                  activeOpacity={0.7}
                  onPress={() => navigation.navigate(SCREENS.CLIENT_SELECTION, { bookingData: {} })}
                >
                  <View style={[styles.quickActionIcon, { backgroundColor: colors.accentLight }]}>
                    <Ionicons name="add-circle-outline" size={18} color={colors.accent} />
                  </View>
                  <Text style={styles.quickActionLabel} numberOfLines={1}>New Booking</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickActionButton}
                  activeOpacity={0.7}
                  onPress={() => navigation.navigate(SCREENS.VIDEO_RECORDING)}
                >
                  <View style={[styles.quickActionIcon, { backgroundColor: colors.lavenderMistLight }]}>
                    <Ionicons name="videocam-outline" size={18} color={colors.twilightPurple} />
                  </View>
                  <Text style={styles.quickActionLabel} numberOfLines={1}>Record Video</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickActionButton}
                  activeOpacity={0.7}
                  onPress={() => navigation.navigate(SCREENS.COACH_CLIENTS)}
                >
                  <View style={[styles.quickActionIcon, { backgroundColor: colors.successLight }]}>
                    <Ionicons name="people-outline" size={18} color={colors.success} />
                  </View>
                  <Text style={styles.quickActionLabel} numberOfLines={1}>View Clients</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Upcoming Sessions</Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate(SCREENS.COACH_SCHEDULE)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.seeAllLink}>See All</Text>
                </TouchableOpacity>
              </View>
              {upcomingSessions.length === 0 ? (
                <EmptyState
                  icon="calendar-outline"
                  title="All Clear"
                  message="No more sessions for today. Enjoy the rest of your day!"
                />
              ) : (
                upcomingSessions.slice(0, 5).map((session) => (
                  <TouchableOpacity
                    key={session.id}
                    style={styles.bookingCard}
                    activeOpacity={0.7}
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
                        <Text style={styles.bookingTime}>
                          {formatTimeInTz(session.start_time, company)}
                          {session.end_time ? ` — ${formatTimeInTz(session.end_time, company)}` : ''}
                        </Text>
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={18}
                        color={colors.textTertiary}
                      />
                    </View>
                  </TouchableOpacity>
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
