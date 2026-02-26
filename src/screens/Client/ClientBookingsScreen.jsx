import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SCREENS } from '../../constants/navigation.constants';
import { formatTime } from '../../constants/booking.constants';
import { getBookings, cancelBooking } from '../../services/bookings.api';
import { bookingsListStyles as styles } from '../../styles/bookingsList.styles';
import { globalStyles } from '../../styles/global.styles';
import EmptyState from '../../components/EmptyState';
import { colors } from '../../theme';

const TABS = { UPCOMING: 'upcoming', PAST: 'past' };

const STATUS_MAP = {
  confirmed: { style: styles.statusConfirmed, textStyle: styles.statusTextConfirmed, label: 'CONFIRMED' },
  pending: { style: styles.statusPending, textStyle: styles.statusTextPending, label: 'PENDING' },
  cancelled: { style: styles.statusCancelled, textStyle: styles.statusTextCancelled, label: 'CANCELLED' },
  completed: { style: styles.statusCompleted, textStyle: styles.statusTextCompleted, label: 'COMPLETED' },
};

const ClientBookingsScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState(TABS.UPCOMING);
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadBookings = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setIsRefreshing(true);
      else setIsLoading(true);

      const { data } = await getBookings({ per_page: 50 });
      const all = data || [];
      const now = new Date();

      if (activeTab === TABS.UPCOMING) {
        const upcoming = all
          .filter((b) => b.start_time && new Date(b.start_time) >= now)
          .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));
        setBookings(upcoming);
      } else {
        const past = all
          .filter((b) => !b.start_time || new Date(b.start_time) < now)
          .sort((a, b) => (b.start_time || '').localeCompare(a.start_time || ''));
        setBookings(past);
      }
    } catch {
      setBookings([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [activeTab]);

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

  const formatBookingDate = (isoStr) => {
    if (!isoStr) return '';
    const date = new Date(isoStr);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderBooking = ({ item }) => {
    const status = STATUS_MAP[item.status] || STATUS_MAP.confirmed;
    const isUpcoming = activeTab === TABS.UPCOMING;

    return (
      <View style={styles.bookingCard}>
        <View style={styles.bookingHeader}>
          <Text style={styles.bookingService}>
            {item.services?.[0]?.name || 'Session'}
          </Text>
          <View style={[styles.statusBadge, status.style]}>
            <Text style={[styles.statusText, status.textStyle]}>
              {status.label}
            </Text>
          </View>
        </View>

        <View style={styles.bookingDetails}>
          <View style={styles.bookingRow}>
            <Ionicons name="calendar-outline" size={14} color={colors.textTertiary} />
            <Text style={styles.bookingDetailText}>
              {formatBookingDate(item.start_time)}
            </Text>
          </View>
          <View style={styles.bookingRow}>
            <Ionicons name="time-outline" size={14} color={colors.textTertiary} />
            <Text style={styles.bookingDetailText}>
              {formatTime(item.start_time)}
              {item.end_time ? ` — ${formatTime(item.end_time)}` : ''}
            </Text>
          </View>
          {item.coaches?.[0] && (
            <View style={styles.bookingRow}>
              <Ionicons name="person-outline" size={14} color={colors.textTertiary} />
              <Text style={styles.bookingDetailText}>
                {item.coaches[0].first_name} {item.coaches[0].last_name}
              </Text>
            </View>
          )}
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
              onPress={() => navigation.navigate(SCREENS.LOCATION_SELECTION, { bookingData: {} })}
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
            onPress={() => setActiveTab(tab)}
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
                  ? () => navigation.navigate(SCREENS.LOCATION_SELECTION, { bookingData: {} })
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
