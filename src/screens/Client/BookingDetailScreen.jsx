import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from 'react-native-paper';
import { getBooking, cancelBooking } from '../../services/bookings.api';
import { formatTimeInTz, formatDateInTz } from '../../helpers/timezone.helper';
import useAuth from '../../hooks/useAuth';
import { BOOKING_STATUS_CONFIG } from '../../constants/booking.constants';
import { SCREENS } from '../../constants/navigation.constants';
import { bookingDetailStyles as styles } from '../../styles/bookingDetail.styles';
import { globalStyles } from '../../styles/global.styles';
import { colors } from '../../theme';
import ScreenHeader from '../../components/ScreenHeader';
import { DetailSkeleton } from '../../components/SkeletonLoader';
import logger from '../../helpers/logger.helper';
import {
  buildBookingEditData,
  canEditBooking,
  getBookingEditEntryScreen,
  isStaffBookingRole,
} from '../../helpers/bookingEdit.helper';
import { buildBookingMarshalIntent } from '../../helpers/marshalIntent.helper';

const BookingDetailScreen = ({ navigation, route }) => {
  const { bookingId, booking: passedBooking } = route.params || {};
  const { company, activeRole, user } = useAuth();

  const [booking, setBooking] = useState(passedBooking || null);
  const [isLoading, setIsLoading] = useState(!passedBooking);

  const loadBooking = useCallback(async () => {
    if (!bookingId && !passedBooking) return;
    try {
      setIsLoading(true);
      const { data } = await getBooking(bookingId || passedBooking?.id);
      setBooking(data);
    } catch (err) {
      logger.warn('Failed to load booking:', err?.message || err);
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
    const isStaffView = isStaffBookingRole(activeRole) || activeRole === 'coach';
    Alert.alert(
      'Cancel Booking',
      `Are you sure you want to cancel ${isStaffView ? 'this' : 'your'} ${booking.services?.[0]?.name || 'booking'}?`,
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
                logger.warn('Failed to cancel booking:', err?.message || err);
                Alert.alert('Error', 'Failed to cancel booking.');
              }
            }
          },
        },
      ]
    );
  }, [activeRole, booking, navigation]);

  const handleEdit = useCallback(() => {
    if (!booking) return;
    navigation.navigate(getBookingEditEntryScreen(activeRole), {
      bookingData: buildBookingEditData(booking),
    });
  }, [activeRole, booking, navigation]);

  const handleOpenMarshal = useCallback(() => {
    if (!booking) return;

    const intent = buildBookingMarshalIntent({ booking, company });
    const parentScreen = activeRole === 'coach' ? SCREENS.COACH_TABS : SCREENS.ADMIN_TABS;

    navigation.navigate(parentScreen, {
      screen: SCREENS.MARSHAL,
      params: {
        marshalIntent: intent,
      },
    });
  }, [activeRole, booking, company, navigation]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScreenHeader title="Booking Details" onBack={() => navigation.goBack()} />
        <DetailSkeleton />
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

  const status = BOOKING_STATUS_CONFIG[booking.status] || BOOKING_STATUS_CONFIG.confirmed;
  const service = booking.services?.[0];
  const coach = booking.coaches?.[0];
  const location = booking.location;
  const resources = booking.resources || [];
  const windowHours = company?.cancellation_window_hours ?? 24;
  const isWithinCancellationWindow = booking.start_time &&
    new Date(booking.start_time).getTime() < Date.now() + windowHours * 3600000;
  const isStaffView = isStaffBookingRole(activeRole) || activeRole === 'coach';
  const canCancel = (isStaffView || !isWithinCancellationWindow) &&
    (booking.status === 'confirmed' || booking.status === 'pending');
  const canEdit = canEditBooking({ booking, activeRole, user });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="Booking Details" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Status banner */}
        <View style={[styles.statusBanner, { backgroundColor: status.color + '14' }]}>
          <MaterialCommunityIcons name={status.icon} size={20} color={status.color} />
          <Text style={[styles.statusBannerText, { color: status.color }]}>
            {status.label}
          </Text>
        </View>

        {/* Date & Time */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="calendar-outline" size={18} color={colors.textSecondary} />
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
              <MaterialCommunityIcons name="golf" size={18} color={colors.textSecondary} />
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
              <MaterialCommunityIcons name="account-outline" size={18} color={colors.textSecondary} />
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
              <MaterialCommunityIcons name="map-marker-outline" size={18} color={colors.textSecondary} />
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
              <MaterialCommunityIcons name="cube-outline" size={18} color={colors.textSecondary} />
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
              <MaterialCommunityIcons name="file-document-outline" size={18} color={colors.textSecondary} />
              <Text style={styles.cardTitle}>Notes</Text>
            </View>
            <Text style={styles.secondaryText}>{booking.notes}</Text>
          </View>
        )}

        {(isStaffView || canEdit || canCancel) && (
          <View style={styles.actionGroup}>
            {isStaffView && (
              <Button
                mode="contained-tonal"
                icon="robot-outline"
                onPress={handleOpenMarshal}
                style={styles.marshalButton}
                contentStyle={styles.marshalButtonContent}
                labelStyle={styles.marshalButtonLabel}
              >
                Open in Marshal
              </Button>
            )}
            {canEdit && (
              <TouchableOpacity
                style={styles.editButton}
                onPress={handleEdit}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="pencil-outline" size={18} color={colors.accentDark} />
                <Text style={styles.editButtonText}>Edit Booking</Text>
              </TouchableOpacity>
            )}
            {canCancel && (
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancel}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="close-circle-outline" size={18} color={colors.error} />
                <Text style={styles.cancelButtonText}>Cancel Booking</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default BookingDetailScreen;
