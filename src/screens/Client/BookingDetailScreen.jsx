import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getBooking, cancelBooking } from '../../services/bookings.api';
import { formatTimeInTz, formatDateInTz } from '../../helpers/timezone.helper';
import useAuth from '../../hooks/useAuth';
import { bookingDetailStyles as styles } from '../../styles/bookingDetail.styles';
import { globalStyles } from '../../styles/global.styles';
import { colors } from '../../theme';
import ScreenHeader from '../../components/ScreenHeader';

const STATUS_CONFIG = {
  confirmed: { icon: 'checkmark-circle', color: colors.success, label: 'Confirmed' },
  pending: { icon: 'time-outline', color: colors.warning, label: 'Pending' },
  cancelled: { icon: 'close-circle', color: colors.error, label: 'Cancelled' },
  completed: { icon: 'checkmark-done-circle', color: colors.textTertiary, label: 'Completed' },
};

const BookingDetailScreen = ({ navigation, route }) => {
  const { bookingId, booking: passedBooking } = route.params || {};
  const { company } = useAuth();

  const [booking, setBooking] = useState(passedBooking || null);
  const [isLoading, setIsLoading] = useState(!passedBooking);

  const loadBooking = useCallback(async () => {
    if (!bookingId && !passedBooking) return;
    try {
      setIsLoading(true);
      const { data } = await getBooking(bookingId || passedBooking?.id);
      setBooking(data);
    } catch (err) {
      console.warn('Failed to load booking:', err?.message || err);
    } finally {
      setIsLoading(false);
    }
  }, [bookingId, passedBooking]);

  useEffect(() => {
    if (!passedBooking) {
      loadBooking();
    }
  }, [loadBooking, passedBooking]);

  const handleCancel = useCallback(() => {
    if (!booking) return;
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
              navigation.goBack();
            } catch (err) {
              const status = err?.response?.status;
              const serverMsg = err?.response?.data?.message;
              if (status === 403 && serverMsg) {
                Alert.alert('Cannot Cancel', serverMsg);
              } else {
                console.warn('Failed to cancel booking:', err?.message || err);
                Alert.alert('Error', 'Failed to cancel booking.');
              }
            }
          },
        },
      ]
    );
  }, [booking, navigation]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScreenHeader title="Booking Details" onBack={() => navigation.goBack()} />
        <View style={globalStyles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!booking) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScreenHeader title="Booking Details" onBack={() => navigation.goBack()} />
        <View style={globalStyles.loadingContainer}>
          <Text style={styles.errorText}>Booking not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const status = STATUS_CONFIG[booking.status] || STATUS_CONFIG.confirmed;
  const service = booking.services?.[0];
  const coach = booking.coaches?.[0];
  const location = booking.location;
  const resources = booking.resources || [];
  const windowHours = company?.cancellation_window_hours ?? 24;
  const isWithinCancellationWindow = booking.start_time &&
    new Date(booking.start_time).getTime() < Date.now() + windowHours * 3600000;
  const canCancel = !isWithinCancellationWindow &&
    (booking.status === 'confirmed' || booking.status === 'pending');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="Booking Details" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Status banner */}
        <View style={[styles.statusBanner, { backgroundColor: status.color + '14' }]}>
          <Ionicons name={status.icon} size={20} color={status.color} />
          <Text style={[styles.statusBannerText, { color: status.color }]}>
            {status.label}
          </Text>
        </View>

        {/* Date & Time */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} />
            <Text style={styles.cardTitle}>Date & Time</Text>
          </View>
          <Text style={styles.dateText}>
            {formatDateInTz(booking.start_time, company, 'long')}
          </Text>
          <Text style={styles.timeText}>
            {formatTimeInTz(booking.start_time, company)}
            {booking.end_time ? ` – ${formatTimeInTz(booking.end_time, company)}` : ''}
          </Text>
        </View>

        {/* Service */}
        {service && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="golf-outline" size={18} color={colors.textSecondary} />
              <Text style={styles.cardTitle}>Service</Text>
            </View>
            <Text style={styles.primaryText}>{service.name}</Text>
            {service.duration_minutes && (
              <Text style={styles.secondaryText}>{service.duration_minutes} minutes</Text>
            )}
          </View>
        )}

        {/* Coach */}
        {coach && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="person-outline" size={18} color={colors.textSecondary} />
              <Text style={styles.cardTitle}>Coach</Text>
            </View>
            <Text style={styles.primaryText}>
              {coach.first_name} {coach.last_name}
            </Text>
          </View>
        )}

        {/* Location */}
        {location && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="location-outline" size={18} color={colors.textSecondary} />
              <Text style={styles.cardTitle}>Location</Text>
            </View>
            <Text style={styles.primaryText}>{location.name}</Text>
            {location.address && (
              <Text style={styles.secondaryText}>{location.address}</Text>
            )}
          </View>
        )}

        {/* Resources */}
        {resources.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="cube-outline" size={18} color={colors.textSecondary} />
              <Text style={styles.cardTitle}>Resources</Text>
            </View>
            {resources.map((r) => (
              <Text key={r.id} style={styles.primaryText}>{r.name}</Text>
            ))}
          </View>
        )}

        {/* Notes */}
        {booking.notes && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="document-text-outline" size={18} color={colors.textSecondary} />
              <Text style={styles.cardTitle}>Notes</Text>
            </View>
            <Text style={styles.secondaryText}>{booking.notes}</Text>
          </View>
        )}

        {/* Cancel action */}
        {canCancel && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancel}
            activeOpacity={0.7}
          >
            <Ionicons name="close-circle-outline" size={18} color={colors.error} />
            <Text style={styles.cancelButtonText}>Cancel Booking</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default BookingDetailScreen;
