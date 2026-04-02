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
import { collectBookingPayment, handlePaymentSuccess, sendPaymentRequest } from '../../services/billing.api';
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
import useMarshalIntent from '../../hooks/useMarshalIntent';
import ClassSessionSection from '../../components/Booking/ClassSessionSection';

const BookingDetailScreen = ({ navigation, route }) => {
  const { bookingId, booking: passedBooking } = route.params || {};
  const { company, activeRole, user } = useAuth();

  const [booking, setBooking] = useState(passedBooking || null);
  const [isLoading, setIsLoading] = useState(!passedBooking);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentRequestLoading, setPaymentRequestLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

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
    const bookingType = booking.booking_type;
    const reversalNote = bookingType === 'membership'
      ? '\n\nYour membership allotment will be restored.'
      : bookingType === 'package'
        ? '\n\nYour package credit will be restored.'
        : '';
    Alert.alert(
      'Cancel Booking',
      `Are you sure you want to cancel ${isStaffView ? 'this' : 'your'} ${booking.services?.[0]?.name || 'booking'}?${reversalNote}`,
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Cancel Booking',
          style: 'destructive',
          onPress: async () => {
            setCancelLoading(true);
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
            } finally {
              setCancelLoading(false);
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

  const handleCollectPayment = useCallback(() => {
    if (!booking) return;
    Alert.alert(
      'Collect Payment',
      'This will charge the client for this booking. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Collect Payment',
          onPress: async () => {
            setPaymentLoading(true);
            try {
              const result = await collectBookingPayment(booking.id);
              if (result.success && result.payment_intent_id) {
                if (result.status === 'succeeded') {
                  await handlePaymentSuccess(result.payment_intent_id);
                  Alert.alert('Success', 'Payment collected successfully.');
                  loadBooking();
                } else {
                  Alert.alert('Payment Pending', 'Payment intent created. Client will need to complete payment.');
                }
              } else {
                Alert.alert('Error', result.error || 'Failed to collect payment.');
              }
            } catch (err) {
              const msg = err?.response?.data?.error || err?.message || 'Failed to collect payment.';
              Alert.alert('Payment Failed', msg);
            } finally {
              setPaymentLoading(false);
            }
          },
        },
      ]
    );
  }, [booking, loadBooking]);

  const handleSendPaymentRequest = useCallback(async () => {
    if (!booking) return;
    setPaymentRequestLoading(true);
    try {
      const result = await sendPaymentRequest(booking.id);
      if (result.success) {
        Alert.alert('Sent', result.message || 'Payment request sent to client.');
      } else {
        Alert.alert('Error', result.error || 'Failed to send payment request.');
      }
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || 'Failed to send payment request.';
      Alert.alert('Error', msg);
    } finally {
      setPaymentRequestLoading(false);
    }
  }, [booking]);

  const { deliverIntent } = useMarshalIntent();

  const handleOpenMarshal = useCallback(() => {
    if (!booking) return;

    deliverIntent(buildBookingMarshalIntent({ booking, company }));
    const parentScreen = activeRole === 'coach' ? SCREENS.COACH_TABS : SCREENS.ADMIN_TABS;
    navigation.navigate(parentScreen, { screen: SCREENS.MARSHAL });
  }, [activeRole, booking, company, deliverIntent, navigation]);

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
  const canCollectPayment = isStaffView &&
    booking.booking_type === 'one_off' &&
    service?.payment_required === false &&
    booking.status === 'confirmed' &&
    !booking.paid_at &&
    !booking.class_session_id;
  const canSendPaymentRequest = isStaffView &&
    booking.booking_type === 'one_off' &&
    booking.status === 'confirmed' &&
    !booking.paid_at &&
    !booking.class_session_id;
  const isPastBooking = booking.end_time && new Date(booking.end_time) < new Date();
  const canSendFeedback = isStaffView && isPastBooking &&
    booking.status === 'confirmed' && !booking.class_session_id;
  const feedbackAlreadySent = !!booking.feedback_email_sent_at;

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

        {/* Class session detail (attendees, capacity, waitlist, enroll, cancel) */}
        {booking.class_session_id && (
          <ClassSessionSection
            classSessionId={booking.class_session_id}
            isStaffView={isStaffView}
            onSessionCancelled={() => navigation.goBack()}
            onEnrollmentChanged={loadBooking}
          />
        )}

        {(isStaffView || canEdit || canCancel || canCollectPayment || canSendPaymentRequest || canSendFeedback) && (
          <View style={styles.actionGroup}>
            {canCollectPayment && (
              <Button
                mode="contained"
                icon="currency-usd"
                onPress={handleCollectPayment}
                loading={paymentLoading}
                disabled={paymentLoading}
                buttonColor={colors.accent}
                textColor={colors.textInverse}
              >
                Collect Payment
              </Button>
            )}
            {canSendPaymentRequest && (
              <Button
                mode="outlined"
                icon="email-send-outline"
                onPress={handleSendPaymentRequest}
                loading={paymentRequestLoading}
                disabled={paymentRequestLoading}
              >
                Send Payment Request
              </Button>
            )}
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
            {canSendFeedback && (
              <Button
                mode="outlined"
                icon="send"
                textColor={feedbackAlreadySent ? colors.textSecondary : colors.accentDark}
                disabled={feedbackAlreadySent}
                onPress={() => navigation.navigate(SCREENS.LESSON_FEEDBACK, { booking })}
              >
                {feedbackAlreadySent ? 'Recap Sent' : 'Send Lesson Recap'}
              </Button>
            )}
            {canEdit && (
              <Button
                mode="outlined"
                icon="pencil-outline"
                textColor={colors.accentDark}
                onPress={handleEdit}
                style={styles.editButton}
                contentStyle={styles.editButtonContent}
              >
                Edit Booking
              </Button>
            )}
            {canCancel && (
              <Button
                mode="text"
                icon="close-circle-outline"
                textColor={colors.error}
                onPress={handleCancel}
                loading={cancelLoading}
                disabled={cancelLoading}
              >
                Cancel Booking
              </Button>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default BookingDetailScreen;
