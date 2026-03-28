import React from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import Avatar from '../Avatar';
import { bookingStyles as styles } from '../../styles/booking.styles';
import { formatDuration } from '../../constants/booking.constants';
import { formatTimeInTz } from '../../helpers/timezone.helper';
import { colors } from '../../theme';

const BookingDetailsSection = ({
  service,
  coach,
  location,
  selectedResource,
  formattedDate,
  timeSlot,
  effectiveDuration,
  summary,
  company,
}) => (
  <View style={styles.confirmSection}>
    {location && (
      <>
        <Text style={styles.confirmLabel}>LOCATION</Text>
        <Text style={styles.confirmValue}>{location.name}</Text>
        <View style={styles.confirmDivider} />
      </>
    )}

    <Text style={styles.confirmLabel}>SERVICE</Text>
    <Text style={styles.confirmValue}>{service?.name}</Text>
    <View style={styles.confirmDivider} />
    <View style={styles.confirmRow}>
      <View>
        <Text style={styles.confirmLabel}>DURATION</Text>
        <Text style={styles.confirmValue}>{formatDuration(effectiveDuration)}</Text>
      </View>
      <View style={styles.confirmPriceColumn}>
        <Text style={styles.confirmLabel}>PRICE</Text>
        <Text style={styles.confirmValue}>{summary.subtotalFormatted}</Text>
      </View>
    </View>

    {coach && (
      <>
        <View style={styles.confirmDivider} />
        <Text style={styles.confirmLabel}>COACH</Text>
        <View style={styles.confirmRowWithAvatar}>
          <Avatar uri={coach.avatar_url} name={`${coach.first_name} ${coach.last_name}`} size={32} />
          <Text style={[styles.confirmValue, styles.confirmValueWithMargin]}>
            {coach.first_name} {coach.last_name}
          </Text>
        </View>
      </>
    )}

    {selectedResource?.name && (
      <>
        <View style={styles.confirmDivider} />
        <Text style={styles.confirmLabel}>RESOURCE</Text>
        <Text style={styles.confirmValue}>{selectedResource.name}</Text>
      </>
    )}

    <View style={styles.confirmDivider} />
    <Text style={styles.confirmLabel}>DATE & TIME</Text>
    <Text style={styles.confirmValue}>{formattedDate}</Text>
    <Text style={[styles.confirmValue, styles.confirmTimeSubtext, { color: colors.textSecondary }]}>
      {formatTimeInTz(timeSlot?.start_time, company)}
      {timeSlot?.end_time ? ` — ${formatTimeInTz(timeSlot.end_time, company)}` : ''}
    </Text>
  </View>
);

export default BookingDetailsSection;
