import React from 'react';
import PropTypes from 'prop-types';
import { View } from 'react-native';
import { Icon, Surface, Text } from 'react-native-paper';
import { bookingsCardStyles as styles } from '../../styles/bookingsCard.styles';
import { BOOKING_STATUS_CONFIG } from '../../constants/booking.constants';
import { colors } from '../../theme/colors';

const STATUS_CONFIG = {
  ...BOOKING_STATUS_CONFIG,
  no_show: { color: colors.error, label: 'No Show', icon: 'close-circle', backgroundColor: colors.errorLight },
};

const BookingRow = ({ booking }) => {
  const statusCfg = STATUS_CONFIG[booking.status] || STATUS_CONFIG.confirmed;
  const coaches = booking.coaches || [];
  const coachLabel = coaches.length > 0 ? coaches.join(', ') : null;

  return (
    <View style={styles.row}>
      <View style={styles.rowMain}>
        <Text style={styles.rowService} numberOfLines={1}>
          {booking.service || 'Session'}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: statusCfg.color }]}>
          <Text style={styles.statusText}>{statusCfg.label}</Text>
        </View>
      </View>
      <View style={styles.rowDetails}>
        {booking.date_display ? (
          <View style={styles.detail}>
            <Icon source="calendar-outline" size={12} color={colors.textTertiary} />
            <Text style={styles.detailText}>{booking.date_display}</Text>
          </View>
        ) : null}
        {booking.time_display ? (
          <View style={styles.detail}>
            <Icon source="clock-outline" size={12} color={colors.textTertiary} />
            <Text style={styles.detailText}>{booking.time_display}</Text>
          </View>
        ) : null}
        {booking.location ? (
          <View style={styles.detail}>
            <Icon source="map-marker-outline" size={12} color={colors.textTertiary} />
            <Text style={styles.detailText}>{booking.location}</Text>
          </View>
        ) : null}
        {coachLabel ? (
          <View style={styles.detail}>
            <Icon source="account-outline" size={12} color={colors.textTertiary} />
            <Text style={styles.detailText}>{coachLabel}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
};

BookingRow.propTypes = {
  booking: PropTypes.shape({
    id: PropTypes.number,
    service: PropTypes.string,
    location: PropTypes.string,
    coaches: PropTypes.arrayOf(PropTypes.string),
    date_display: PropTypes.string,
    time_display: PropTypes.string,
    status: PropTypes.string,
  }).isRequired,
};

const BookingsCard = ({ bookings }) => {
  if (!bookings) return null;

  const items = bookings.bookings || [];
  if (items.length === 0) return null;

  const total = bookings.total || items.length;

  return (
    <Surface style={styles.card} elevation={0}>
      <View style={styles.header}>
        <Icon source="calendar-outline" size={16} color={colors.textSecondary} />
        <Text style={styles.headerTitle}>
          {total} {total === 1 ? 'Booking' : 'Bookings'}
        </Text>
      </View>
      <View style={styles.list}>
        {items.map((booking, index) => (
          <BookingRow key={booking.id ?? `booking-${index}`} booking={booking} />
        ))}
      </View>
    </Surface>
  );
};

BookingsCard.propTypes = {
  bookings: PropTypes.shape({
    bookings: PropTypes.array,
    total: PropTypes.number,
    timezone: PropTypes.string,
  }),
};

export default BookingsCard;
