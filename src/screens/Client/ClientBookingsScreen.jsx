import React, { useEffect, useCallback, useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TouchableRipple, Button as PaperButton } from 'react-native-paper';
import { SCREENS } from '../../constants/navigation.constants';
import { getBookings, cancelBooking } from '../../services/bookings.api';
import { formatTimeInTz, formatDateInTz, getTodayKey, getFutureDateKey } from '../../helpers/timezone.helper';
import useAuth from '../../hooks/useAuth';
import { bookingsListStyles as styles } from '../../styles/bookingsList.styles';
import { globalStyles } from '../../styles/global.styles';
import { ListSkeleton } from '../../components/SkeletonLoader';
import EmptyState from '../../components/EmptyState';
import { colors } from '../../theme';
import logger from '../../helpers/logger.helper';

const TABS = { UPCOMING: 'upcoming', PAST: 'past' };

const UPCOMING_FILTERS = [
  { key: 'all', label: 'All' },
  { key: '7d', label: 'Next 7 Days' },
  { key: '30d', label: 'Next 30 Days' },
];

const PAST_FILTERS = [
  { key: 'all', label: 'All' },
  { key: '7d', label: 'Last 7 Days' },
  { key: '30d', label: 'Last 30 Days' },
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
    if (dateFilter === 'all') return {};

    const todayStr = getTodayKey(company);
    const days = dateFilter === '7d' ? 7 : dateFilter === '30d' ? 30 : 90;

    if (activeTab === TABS.UPCOMING) {
      return {
        start_date: todayStr,
        end_date: getFutureDateKey(company, days),
      };
    }
    return {
      start_date: getFutureDateKey(company, -days),
      end_date: todayStr,
    };
  }, [company?.timezone, dateFilter, activeTab]);

  const loadBookings = useCallback(async (showRefresh = false) => {
    if (!company?.timezone || !user?.id) {
      // Wait for company + user data before loading
      return;
    }
    try {
      if (showRefresh) setIsRefreshing(true);
      else setIsLoading(true);

      const nowMs = Date.now();

      const params = { client_id: user.id, per_page: 50, ...dateRange };
      const { data } = await getBookings(params);
      const all = data || [];

      if (activeTab === TABS.UPCOMING) {
        const upcoming = all
          .filter((b) => {
            if (!b.start_time) return false;
            // Use end_time if available so in-progress bookings stay in upcoming
            // until they finish; fall back to start_time
            const cutoff = b.end_time || b.start_time;
            return new Date(cutoff).getTime() >= nowMs;
          })
          .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));
        setBookings(upcoming);
      } else {
        const past = all
          .filter((b) => {
            if (!b.start_time) return true;
            const cutoff = b.end_time || b.start_time;
            return new Date(cutoff).getTime() < nowMs;
          })
          .sort((a, b) => (b.start_time || '').localeCompare(a.start_time || ''));
        setBookings(past);
      }
    } catch (err) {
      logger.warn('Failed to load bookings:', err?.message || err);
      setBookings([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.id, company?.timezone, activeTab, dateRange]);

  // Defer initial fetch to focus — prevents firing when mounted by lazy={false} on inactive tab
  const hasLoaded = useRef(false);
  const isFocused = useRef(false);

  useEffect(() => {
    const onFocus = () => {
      isFocused.current = true;
      loadBookings(hasLoaded.current);
      hasLoaded.current = true;
    };
    const onBlur = () => { isFocused.current = false; };

    const unsubFocus = navigation.addListener('focus', onFocus);
    const unsubBlur = navigation.addListener('blur', onBlur);
    return () => { unsubFocus(); unsubBlur(); };
  }, [navigation, loadBookings]);

  // Re-fetch when tab or date filter changes while screen is visible
  useEffect(() => {
    if (hasLoaded.current && isFocused.current) {
      loadBookings();
    }
  }, [activeTab, dateFilter, loadBookings]);

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
            } catch (err) {
              const status = err?.response?.status;
              const serverMsg = err?.response?.data?.message;
              if (status === 403 && serverMsg) {
                Alert.alert('Cannot Cancel', serverMsg);
              } else {
                logger.warn('Failed to cancel booking:', err?.message || err);
                Alert.alert('Error', 'Failed to cancel booking.');
              }
            }
          },
        },
      ]
    );
  }, [loadBookings]);


  const renderBooking = useCallback(({ item }) => {
    const status = STATUS_MAP[item.status] || STATUS_MAP.confirmed;
    const isUpcoming = activeTab === TABS.UPCOMING;
    const coach = item.coaches?.[0] || null;

    return (
      <TouchableRipple
        style={styles.bookingCard}
        onPress={() => navigation.navigate(SCREENS.BOOKING_DETAIL, { booking: item })}
        borderless
      >
        <View>
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
              <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textTertiary} />
            </View>
          </View>

          {isUpcoming && item.status !== 'cancelled' && (() => {
            const windowHours = company?.cancellation_window_hours ?? 24;
            const withinWindow = item.start_time &&
              new Date(item.start_time).getTime() < Date.now() + windowHours * 3600000;
            if (withinWindow) return null;
            return (
              <View style={styles.bookingActions}>
                <PaperButton
                  mode="text"
                  textColor={colors.error}
                  compact
                  onPress={() => handleCancel(item)}
                >
                  Cancel
                </PaperButton>
              </View>
            );
          })()}

          {!isUpcoming && (
            <View style={styles.bookingActions}>
              <PaperButton
                mode="contained"
                buttonColor={colors.accent}
                textColor={colors.textInverse}
                compact
                onPress={() => navigation.navigate('HomeTab', {
                  screen: SCREENS.SERVICE_SELECTION,
                  params: {
                    bookingData: {},
                    rebookHints: {
                      serviceId: item.services?.[0]?.id || null,
                      coachId: coach?.id || null,
                      locationId: item.location?.id || null,
                    },
                  },
                })}
              >
                Book Again
              </PaperButton>
            </View>
          )}
        </View>
      </TouchableRipple>
    );
  }, [activeTab, company, handleCancel, navigation]);

  const keyExtractor = useCallback((item) => String(item.id), []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bookings</Text>
        <TouchableOpacity
          style={globalStyles.headerActionButton}
          onPress={() => navigation.navigate('HomeTab', { screen: SCREENS.SERVICE_SELECTION, params: { bookingData: {} } })}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="plus" size={18} color={colors.textInverse} />
          <Text style={globalStyles.headerActionText}>New</Text>
        </TouchableOpacity>
      </View>
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

      <View style={styles.filterBar}>
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
      </View>

      {isLoading ? (
        <ListSkeleton count={5} />
      ) : (
        <FlatList
          data={bookings}
          renderItem={renderBooking}
          keyExtractor={keyExtractor}
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
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews
          ListEmptyComponent={
            <EmptyState
              icon={activeTab === TABS.UPCOMING ? 'calendar-outline' : 'clock-outline'}
              title={activeTab === TABS.UPCOMING ? 'No Upcoming Bookings' : 'No Past Bookings'}
              message={
                activeTab === TABS.UPCOMING
                  ? 'Book a session to get started.'
                  : 'Your completed sessions will appear here.'
              }
              actionLabel={activeTab === TABS.UPCOMING ? 'Book a Session' : undefined}
              onAction={
                activeTab === TABS.UPCOMING
                  ? () => navigation.navigate('HomeTab', { screen: SCREENS.SERVICE_SELECTION, params: { bookingData: {} } })
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
