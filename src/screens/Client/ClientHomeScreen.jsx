import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import useAuth from '../../hooks/useAuth';
import { SCREENS } from '../../constants/navigation.constants';
import { getBookings } from '../../services/bookings.api';
import { formatTimeInTz, formatDateInTz, getTodayKey, getFutureDateKey } from '../../helpers/timezone.helper';
import dayjs from '../../utils/dayjs';
import { dashboardStyles as styles } from '../../styles/dashboard.styles';
import { DashboardSkeleton } from '../../components/SkeletonLoader';
import EmptyState from '../../components/EmptyState';
import { colors } from '../../theme';

const ClientHomeScreen = ({ navigation }) => {
  const { user, company } = useAuth();
  const firstName = user?.first_name || user?.name?.split(' ')[0] || '';

  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const todayKey = getTodayKey(company);
  const futureKey = getFutureDateKey(company, 30);

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
    } catch (err) {
      console.warn('Failed to load bookings:', err?.message || err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.id, todayKey, futureKey]);

  // Refetch every time the screen comes into focus (e.g. after booking)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadBookings();
    });
    return unsubscribe;
  }, [navigation, loadBookings]);

  // Filter to only upcoming sessions (compare in UTC for reliability)
  const nowUtc = dayjs.utc();
  const upcomingSessions = sessions.filter((s) => {
    if (!s.start_time) return true;
    const startUtc = dayjs.utc(s.start_time);
    return !startUtc.isValid() || startUtc.isSameOrAfter(nowUtc);
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <DashboardSkeleton />
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
          <View>
            <Text style={styles.greeting}>Welcome, {firstName}</Text>
            <Text style={styles.subtitle}>Ready to improve your game?</Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate(SCREENS.NOTIFICATIONS)}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="notifications-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickActionButton}
              activeOpacity={0.7}
              onPress={() => navigation.navigate(SCREENS.LOCATION_SELECTION, { bookingData: {} })}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: colors.accentLight }]}>
                <Ionicons name="calendar-outline" size={18} color={colors.accent} />
              </View>
              <Text style={styles.quickActionLabel} numberOfLines={1}>Book Session</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionButton}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('ProgressTab', { screen: SCREENS.CLIENT_PROGRESS, params: { initialTab: 'resources' } })}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: colors.lavenderMistLight }]}>
                <Ionicons name="play-circle-outline" size={18} color={colors.twilightPurple} />
              </View>
              <Text style={styles.quickActionLabel} numberOfLines={1}>My Resources</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionButton}
              activeOpacity={0.7}
              onPress={() => navigation.navigate(SCREENS.MEMBERSHIP_PLANS)}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: colors.successLight }]}>
                <Ionicons name="card-outline" size={18} color={colors.success} />
              </View>
              <Text style={styles.quickActionLabel} numberOfLines={1}>Membership</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Sessions</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate(SCREENS.CLIENT_BOOKINGS)}
              activeOpacity={0.7}
            >
              <Text style={styles.seeAllLink}>See All</Text>
            </TouchableOpacity>
          </View>
          {upcomingSessions.length === 0 ? (
            <EmptyState
              icon="calendar-outline"
              title="No Upcoming Sessions"
              message="Book a session to get started."
            />
          ) : (
            upcomingSessions.slice(0, 5).map((session) => {
              const coach = session.coaches?.[0] || null;
              return (
                <TouchableOpacity
                  key={session.id}
                  style={styles.bookingCard}
                  activeOpacity={0.7}
                  onPress={() => navigation.navigate(SCREENS.CLIENT_BOOKINGS)}
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
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={colors.textTertiary}
                    />
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              Your recent activity will appear here.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ClientHomeScreen;
