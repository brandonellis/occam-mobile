import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TouchableRipple } from 'react-native-paper';
import PropTypes from 'prop-types';
import useAuth from '../../hooks/useAuth';
import { SCREENS } from '../../constants/navigation.constants';
import { formatDateKeyLong, formatTimeInTz, getTodayKey } from '../../helpers/timezone.helper';
import { getBookings } from '../../services/bookings.api';
import { BOOKING_STATUS_CONFIG } from '../../constants/booking.constants';
import { adminDashboardStyles as styles } from '../../styles/adminDashboard.styles';
import { CoachDashboardSkeleton } from '../../components/SkeletonLoader';
import EmptyState from '../../components/EmptyState';
import useUnreadNotifications from '../../hooks/useUnreadNotifications';
import { colors } from '../../theme';
import logger from '../../helpers/logger.helper';

const QUICK_ACTIONS = [
  {
    key: 'new-booking',
    title: 'New Booking',
    subtitle: 'Create a booking for any client',
    icon: 'plus-circle-outline',
    color: colors.accent,
    bg: colors.accentLight,
  },
  {
    key: 'schedule',
    title: 'Today\'s Schedule',
    subtitle: 'Review today\'s bookings and availability',
    icon: 'calendar-outline',
    color: colors.info,
    bg: colors.infoLight,
  },
  {
    key: 'clients',
    title: 'Clients',
    subtitle: 'Search clients and open their detail view',
    icon: 'account-group-outline',
    color: colors.success,
    bg: colors.successLight,
  },
  {
    key: 'record-video',
    title: 'Record Video',
    subtitle: 'Use the existing coach video workflow from admin mode',
    icon: 'video-outline',
    color: colors.twilightPurple,
    bg: colors.lavenderMistLight,
  },
];

const AdminDashboardScreen = ({ navigation }) => {
  const { user, company } = useAuth();
  const firstName = user?.first_name || user?.name?.split(' ')[0] || 'Admin';
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const { unreadCount } = useUnreadNotifications();

  const todayKey = getTodayKey(company);

  const loadDashboard = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const [bookingsRes] = await Promise.allSettled([
        getBookings({ start_date: todayKey, end_date: todayKey, per_page: 200, status: 'all' }),
      ]);

      setError(null);

      if (bookingsRes.status === 'fulfilled') {
        const data = bookingsRes.value?.data || [];
        const sorted = [...data].sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));
        setBookings(sorted);
      } else {
        setBookings([]);
      }

    } catch (err) {
      logger.warn('Failed to load admin dashboard:', err?.message || err);
      setError('Unable to load the admin dashboard. Pull down to retry.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [todayKey]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadDashboard();
    });
    return unsubscribe;
  }, [navigation, loadDashboard]);

  const upcomingBookings = useMemo(() => {
    const now = Date.now();
    return bookings.filter((booking) => {
      if (!booking?.start_time) return false;
      const start = new Date(booking.start_time).getTime();
      return !Number.isNaN(start) && start >= now;
    });
  }, [bookings]);

  const remainingTodayCount = upcomingBookings.filter((booking) => booking?.status !== 'cancelled').length;
  const visibleBookings = upcomingBookings.length > 0 ? upcomingBookings : bookings;
  const todayLabel = formatDateKeyLong(todayKey);
  const heroMetrics = [
    { key: 'bookings', label: 'Bookings', value: bookings.length },
    { key: 'remaining', label: 'Still ahead', value: remainingTodayCount },
    { key: 'notifications', label: 'Unread', value: unreadCount || 0 },
  ];

  const handleQuickAction = useCallback((key) => {
    if (key === 'new-booking') {
      navigation.navigate(SCREENS.CLIENT_SELECTION, { bookingData: {} });
      return;
    }

    if (key === 'schedule') {
      navigation.navigate('ScheduleTab', { screen: SCREENS.ADMIN_SCHEDULE });
      return;
    }

    if (key === 'clients') {
      navigation.navigate('ClientsTab', { screen: SCREENS.COACH_CLIENTS });
      return;
    }

    if (key === 'record-video') {
      navigation.navigate(SCREENS.VIDEO_RECORDING);
      return;
    }

  }, [navigation]);

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
        {isLoading ? (
          <CoachDashboardSkeleton />
        ) : error ? (
          <EmptyState
            icon="cloud-offline-outline"
            title="Couldn't Load Dashboard"
            message={error}
            actionLabel="Retry"
            onAction={() => loadDashboard()}
          />
        ) : (
          <>
            <View style={styles.heroCard}>
              <View style={styles.heroTopRow}>
                <View style={styles.heroTitleBlock}>
                  <View style={styles.heroBadge}>
                    <Text style={styles.heroBadgeText}>Admin Operations</Text>
                  </View>
                  <Text style={styles.heroTitle}>Hello, {firstName}</Text>
                </View>
                <TouchableOpacity
                  style={styles.heroBellButton}
                  onPress={() => navigation.navigate(SCREENS.NOTIFICATIONS)}
                  activeOpacity={0.75}
                >
                  <View style={styles.notificationWrap}>
                    <MaterialCommunityIcons name="bell-outline" size={22} color={colors.textInverse} />
                    {unreadCount > 0 && (
                      <View style={styles.notificationBadge}>
                        <Text style={styles.notificationBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              </View>

              <View style={styles.heroContextRow}>
                <View style={styles.heroContextPill}>
                  <Text style={styles.heroContextPillText}>Today</Text>
                </View>
                <Text style={styles.heroContextText}>{todayLabel}</Text>
              </View>

              <View style={styles.heroMetricsRow}>
                {heroMetrics.map((metric, index) => (
                  <View
                    key={metric.key}
                    style={[styles.heroMetric, index > 0 && styles.heroMetricDivider]}
                  >
                    <Text style={styles.heroMetricLabel}>{metric.label}</Text>
                    <Text style={styles.heroMetricValue}>{metric.value}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Quick Actions</Text>
              </View>
              <View style={styles.actionGrid}>
                {QUICK_ACTIONS.map((action) => (
                  <TouchableOpacity
                    key={action.key}
                    style={styles.actionCard}
                    activeOpacity={0.75}
                    onPress={() => handleQuickAction(action.key)}
                  >
                    <View style={[styles.actionIconWrap, { backgroundColor: action.bg }]}>
                      <MaterialCommunityIcons name={action.icon} size={20} color={action.color} />
                    </View>
                    <Text style={styles.actionTitle}>{action.title}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{remainingTodayCount} Upcoming</Text>
                <TouchableRipple
                  onPress={() => navigation.navigate('ScheduleTab', { screen: SCREENS.ADMIN_SCHEDULE })}
                  borderless
                >
                  <Text style={styles.bookingCountText}>See All</Text>
                </TouchableRipple>
              </View>

              {visibleBookings.length === 0 ? (
                <EmptyState
                  icon="calendar-outline"
                  title="No Bookings Today"
                  message="You're clear for the day. New bookings and schedule updates will appear here."
                />
              ) : (
                visibleBookings.slice(0, 5).map((booking) => {
                  const serviceName = booking.services?.[0]?.name || booking.service?.name || 'Session';
                  const clientName = booking.client
                    ? `${booking.client.first_name || ''} ${booking.client.last_name || ''}`.trim()
                    : 'No client assigned';
                  const coachNames = Array.isArray(booking.coaches) && booking.coaches.length > 0
                    ? booking.coaches.map((coach) => `${coach.first_name || ''} ${coach.last_name || ''}`.trim()).join(', ')
                    : null;
                  const statusConfig = BOOKING_STATUS_CONFIG[booking.status] || BOOKING_STATUS_CONFIG.confirmed;

                  return (
                    <TouchableRipple
                      key={booking.id}
                      style={styles.bookingCard}
                      onPress={() => navigation.navigate(SCREENS.BOOKING_DETAIL, { bookingId: booking.id })}
                      borderless
                    >
                      <View style={styles.bookingCardRow}>
                        <View style={styles.bookingTimeBlock}>
                          <Text style={styles.bookingTimeValue}>{formatTimeInTz(booking.start_time, company)}</Text>
                          <Text style={styles.bookingTimeMeta}>
                            {booking.end_time ? `Until ${formatTimeInTz(booking.end_time, company)}` : 'Single slot'}
                          </Text>
                        </View>
                        <View style={styles.bookingCardContent}>
                          <View style={styles.bookingHeaderRow}>
                            <Text style={styles.bookingService}>{serviceName}</Text>
                            <View style={[styles.bookingStatusPill, { backgroundColor: statusConfig.backgroundColor }]}>
                              <Text style={[styles.bookingStatusText, { color: statusConfig.color }]}>
                                {statusConfig.label}
                              </Text>
                            </View>
                          </View>
                          <Text style={styles.bookingClient}>{clientName}</Text>
                          <Text style={styles.bookingMeta}>
                            {[coachNames, booking.location?.name].filter(Boolean).join(' · ') || 'Booking details available'}
                          </Text>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textTertiary} />
                      </View>
                    </TouchableRipple>
                  );
                })
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

AdminDashboardScreen.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
    addListener: PropTypes.func.isRequired,
  }).isRequired,
};

export default AdminDashboardScreen;
