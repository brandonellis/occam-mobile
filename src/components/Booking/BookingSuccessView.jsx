import React, { useEffect } from 'react';
import { View, ScrollView, Animated } from 'react-native';
import { Text, Icon, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import PropTypes from 'prop-types';
import Avatar from '../Avatar';
import { bookingStyles as styles } from '../../styles/booking.styles';
import { formatTimeInTz } from '../../helpers/timezone.helper';
import { colors } from '../../theme';
import { haptic } from '../../helpers/haptic.helper';

const BookingSuccessView = ({
  createdBookingData,
  bookingData,
  service,
  coach,
  location,
  client,
  selectedResource,
  timeSlot,
  formattedDate,
  isEditMode,
  isCoach,
  isMembershipBooking,
  isPackageBooking,
  company,
  navigation,
  successScale,
  successOpacity,
}) => {
  const isRecurring = Boolean(createdBookingData?.created_count);
  const successService = createdBookingData?.services?.[0] || service;
  const successCoach = createdBookingData?.coaches?.[0] || coach;
  const successLocation = createdBookingData?.location || location;
  const successResource = createdBookingData?.resources?.[0] || selectedResource;
  const bookingCode = createdBookingData?.booking_code;
  const clientName = client ? `${client.first_name}` : null;

  useEffect(() => {
    haptic.success();
  }, []);

  const getSuccessSubtitle = () => {
    if (isEditMode) {
      return 'Your booking changes have been saved.';
    }
    if (isRecurring) {
      const created = createdBookingData.created_count || 0;
      const failed = createdBookingData.failed_count || 0;
      if (failed > 0) {
        return `${created} session${created !== 1 ? 's' : ''} booked. ${failed} could not be scheduled due to conflicts.`;
      }
      return `${created} recurring session${created !== 1 ? 's' : ''} have been booked.`;
    }
    if (isMembershipBooking && isCoach && clientName) {
      return `${clientName}'s membership session is all set.`;
    }
    if (isMembershipBooking) {
      return 'Your membership session is all set.';
    }
    if (isPackageBooking) {
      return 'Your package session is all set. No payment needed.';
    }
    if (isCoach && clientName) {
      return `${clientName}'s session has been booked.`;
    }
    if (isCoach) {
      return 'The session has been booked for your client.';
    }
    return 'Your session is all set. See you there!';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={[styles.scrollContent, styles.successContainer]}>
        {/* Animated checkmark icon */}
        <Animated.View style={[
          styles.successIconCircle,
          { transform: [{ scale: successScale }], opacity: successOpacity },
        ]}>
          <Icon source="check-bold" size={40} color={colors.white} />
        </Animated.View>

        <Animated.View style={{ opacity: successOpacity, alignItems: 'center' }}>
          <Text style={styles.successTitle}>{isEditMode ? 'Booking Updated' : isRecurring ? 'Bookings Confirmed' : 'Booking Confirmed'}</Text>
          <Text style={styles.successSubtitle}>{getSuccessSubtitle()}</Text>
        </Animated.View>

        {/* Booking code — only show real codes, not raw numeric IDs */}
        {bookingCode && typeof bookingCode === 'string' && !/^\d+$/.test(bookingCode) && (
          <Animated.View style={[styles.successCodeContainer, { opacity: successOpacity }]}>
            <Text style={styles.successCodeLabel}>BOOKING REFERENCE</Text>
            <Text style={styles.successCodeValue}>{bookingCode}</Text>
          </Animated.View>
        )}

        <Animated.View style={[styles.successDetailsCard, { opacity: successOpacity }]}>
          {successService && (
            <>
              <Text style={styles.successDetailLabel}>SERVICE</Text>
              <Text style={styles.successDetailValue}>{successService.name}</Text>
            </>
          )}
          {successCoach && (
            <>
              <View style={styles.successDetailDivider} />
              <Text style={styles.successDetailLabel}>COACH</Text>
              <View style={styles.successDetailRow}>
                <Avatar
                  uri={successCoach.avatar_url}
                  name={`${successCoach.first_name} ${successCoach.last_name}`}
                  size={28}
                />
                <Text style={[styles.successDetailValue, styles.successDetailValueWithMargin]}>
                  {successCoach.first_name} {successCoach.last_name}
                </Text>
              </View>
            </>
          )}
          {successLocation && (
            <>
              <View style={styles.successDetailDivider} />
              <Text style={styles.successDetailLabel}>LOCATION</Text>
              <Text style={styles.successDetailValue}>{successLocation.name}</Text>
            </>
          )}
          {successResource?.name && (
            <>
              <View style={styles.successDetailDivider} />
              <Text style={styles.successDetailLabel}>RESOURCE</Text>
              <Text style={styles.successDetailValue}>{successResource.name}</Text>
            </>
          )}
          <View style={styles.successDetailDivider} />
          <Text style={styles.successDetailLabel}>DATE & TIME</Text>
          <Text style={styles.successDetailValue}>{formattedDate}</Text>
          <Text style={styles.successDetailTime}>
            {formatTimeInTz(timeSlot?.start_time, company)}
            {timeSlot?.end_time ? ` – ${formatTimeInTz(timeSlot.end_time, company)}` : ''}
          </Text>
        </Animated.View>
      </ScrollView>

      <View style={styles.successBottomBar}>
        {!isEditMode && isCoach && (
          <Button
            mode="outlined"
            style={[styles.successSecondaryButton]}
            onPress={() => navigation.popToTop()}
            labelStyle={styles.successSecondaryButtonText}
          >
            Schedule
          </Button>
        )}
        <Button
          mode="contained"
          style={[styles.continueButton, styles.successPrimaryFull]}
          onPress={() => navigation.popToTop()}
          labelStyle={styles.continueButtonText}
        >
          {isEditMode ? 'Done' : isCoach ? 'Book Another' : 'Done'}
        </Button>
      </View>
    </SafeAreaView>
  );
};

BookingSuccessView.propTypes = {
  createdBookingData: PropTypes.object,
  bookingData: PropTypes.object,
  service: PropTypes.object,
  coach: PropTypes.object,
  location: PropTypes.object,
  client: PropTypes.object,
  selectedResource: PropTypes.object,
  timeSlot: PropTypes.object,
  formattedDate: PropTypes.string,
  isEditMode: PropTypes.bool,
  isCoach: PropTypes.bool,
  isMembershipBooking: PropTypes.bool,
  isPackageBooking: PropTypes.bool,
  company: PropTypes.object,
  navigation: PropTypes.object.isRequired,
  successScale: PropTypes.object.isRequired,
  successOpacity: PropTypes.object.isRequired,
};

export default BookingSuccessView;
