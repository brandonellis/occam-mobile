import React, { useEffect, useCallback, useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SCREENS } from '../../constants/navigation.constants';
import { getBookings, cancelBooking } from '../../services/bookings.api';
import { formatTimeInTz, formatDateInTz } from '../../helpers/timezone.helper';
import dayjs, { getEffectiveTimezone } from '../../utils/dayjs';
import useAuth from '../../hooks/useAuth';
import { bookingsListStyles as styles } from '../../styles/bookingsList.styles';
import { globalStyles } from '../../styles/global.styles';
import EmptyState from '../../components/EmptyState';
import { colors } from '../../theme';

const TABS = { UPCOMING: 'upcoming', PAST: 'past' };

const UPCOMING_FILTERS = [
  { key: 'all', label: 'All' },
  { key: '7d', label: 'Next 7 Days' },
  { key: '30d', label: 'Next 30 Days' },
  { key: '90d', label: 'Next 3 Months' },
];

const PAST_FILTERS = [
  { key: 'all', label: 'All' },
  { key: '7d', label: 'Last 7 Days' },
  { key: '30d', label: 'Last 30 Days' },
  { key: '90d', label: 'Last 3 Months' },
];

const STATUS_MAP = {
  confirmed: { style: styles.statusConfirmed, textStyle: styles.statusTextConfirmed, label: 'CONFIRMED' },
  pending: { style: styles.statusPending, textStyle: styles.statusTextPending, label: 'PENDING' },
  cancelled: { style: styles.statusCancelled, textStyle: styles.statusTextCancelled, label: 'CANCELLED' },
  completed: { style: styles.statusCompleted, textStyle: styles.statusTextCompleted, label: 'COMPLETED' },
};

const ClientBookingsScreen = ({ navigation }) => {
  const { user, company } = useAuth();
  const [activeTab, setActiveTab] = useState(TABS.UPCOMING);
  const [dateFilter, setDateFilter] = useState('all');
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const dateRange = useMemo(() => {
    const tz = getEffectiveTimezone(company);
    const today = dayjs().tz(tz);

    if (dateFilter === 'all') return {};

    const days = dateFilter === '7d' ? 7 : dateFilter === '30d' ? 30 : 90;

    if (activeTab === TABS.UPCOMING) {
      return {
        start_date: today.format('YYYY-MM-DD'),
        end_date: today.add(days, 'day').format('YYYY-MM-DD'),
      };
    }
    return {
      start_date: today.subtract(days, 'day').format('YYYY-MM-DD'),
      end_date: today.format('YYYY-MM-DD'),
    };
  }, [company, dateFilter, activeTab]);

  const loadBookings = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setIsRefreshing(true);
      else setIsLoading(true);

      const tz = getEffectiveTimezone(company);
      const nowTz = dayjs().tz(tz);

      const params = { client_id: user?.id, per_page: 50, ...dateRange };
      const { data } = await getBookings(params);
      const all = data || [];

      if (activeTab === TABS.UPCOMING) {
        const upcoming = all
          .filter((b) => b.start_time && dayjs(b.start_time).tz(tz).isSameOrAfter(nowTz))
          .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));
        setBookings(upcoming);
      } else {
        const past = all
          .filter((b) => !b.start_time || dayjs(b.start_time).tz(tz).isBefore(nowTz))
          .sort((a, b) => (b.start_time || '').localeCompare(a.start_time || ''));
        setBookings(past);
      }
    } catch {
      setBookings([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.id, company, activeTab, dateRange]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const handleCancel = useCallback((booking) => {
    Alert.alert(
      'Cancel Booking',
      `Are you sure you want to cancel your ${booking.services?.[0]?.name || 'booking'}?`,
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Cancel Booking',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelBooking(booking.id);
              loadBookings();
            } catch {
              Alert.alert('Error', 'Failed to cancel booking.');
            }
          },
        },
      ]
    );
  }, [loadBookings]);


  const renderBooking = ({ item }) => {
    const status = STATUS_MAP[item.status] || STATUS_MAP.confirmed;
    const isUpcoming = activeTab === TABS.UPCOMING;
    const coach = item.coaches?.[0] || null;

    return (
      <View style={styles.bookingCard}>
        <View style={styles.bookingCardRow}>
          <View style={styles.bookingTimeBlock}>
            <Text style={styles.bookingTimeValue}>
              {formatTimeInTz(item.start_time, company)}
            </Text>
            <Text style={styles.bookingTimeDate}>
              {formatDateInTz(item.start_time, company)}
            </Text>
          </View>
          <View style={styles.bookingCardContent}>
            <Text style={styles.bookingService}>
              {item.services?.[0]?.name || 'Session'}
            </Text>
            {coach && (
              <Text style={styles.bookingCoach}>
                {coach.first_name} {coach.last_name}
              </Text>
            )}
            {item.location && (
              <Text style={styles.bookingLocation}>
                {item.location.name}
              </Text>
            )}
          </View>
          <View style={styles.bookingEndColumn}>
            <View style={[styles.statusBadge, status.style]}>
              <Text style={[styles.statusText, status.textStyle]}>
                {status.label}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          </View>
        </View>

        {isUpcoming && item.status !== 'cancelled' && (
          <View style={styles.bookingActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => handleCancel(item)}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {!isUpcoming && (
          <View style={styles.bookingActions}>
            <TouchableOpacity
              style={styles.rebookButton}
              onPress={() => navigation.navigate('HomeTab', { screen: SCREENS.LOCATION_SELECTION, params: { bookingData: {} } })}
              activeOpacity={0.7}
            >
              <Text style={styles.rebookButtonText}>Book Again</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.tabBar}>
        {[TABS.UPCOMING, TABS.PAST].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => { setActiveTab(tab); setDateFilter('all'); }}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.tabTextActive,
              ]}
            >
              {tab === TABS.UPCOMING ? 'Upcoming' : 'Past'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterBar}
      >
        {(activeTab === TABS.UPCOMING ? UPCOMING_FILTERS : PAST_FILTERS).map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[
              styles.filterChip,
              dateFilter === f.key && styles.filterChipActive,
            ]}
            onPress={() => setDateFilter(f.key)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterChipText,
                dateFilter === f.key && styles.filterChipTextActive,
              ]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {isLoading ? (
        <View style={globalStyles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={bookings}
          renderItem={renderBooking}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={[
            styles.listContent,
            bookings.length === 0 && { flex: 1 },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => loadBookings(true)}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon={activeTab === TABS.UPCOMING ? 'calendar-outline' : 'time-outline'}
              title={activeTab === TABS.UPCOMING ? 'No Upcoming Bookings' : 'No Past Bookings'}
              message={
                activeTab === TABS.UPCOMING
                  ? 'Book a session to get started.'
                  : 'Your completed sessions will appear here.'
              }
              actionLabel={activeTab === TABS.UPCOMING ? 'Book a Session' : undefined}
              onAction={
                activeTab === TABS.UPCOMING
                  ? () => navigation.navigate('HomeTab', { screen: SCREENS.LOCATION_SELECTION, params: { bookingData: {} } })
                  : undefined
              }
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

export default ClientBookingsScreen;
