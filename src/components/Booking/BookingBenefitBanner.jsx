import React from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import PropTypes from 'prop-types';
import { bookingStyles as styles } from '../../styles/booking.styles';
import { colors } from '../../theme';

const BookingBenefitBanner = ({
  type,
  isCoach,
  clientFirstName,
  packageName,
  packageRemaining,
}) => {
  const labelMap = {
    membership: 'INCLUDED WITH MEMBERSHIP',
    package: 'COVERED BY PACKAGE',
    noPayment: 'NO UPFRONT PAYMENT',
  };

  const getDescription = () => {
    switch (type) {
      case 'membership':
        return isCoach
          ? `This session will use ${clientFirstName || 'the client'}'s membership allotment.`
          : 'This session will use your membership allotment. No payment needed.';

      case 'package':
        return `${packageName || 'Package'} — ${packageRemaining ?? '?'} use${packageRemaining !== 1 ? 's' : ''} remaining. No payment needed.`;

      case 'noPayment':
        return isCoach
          ? 'This service does not require payment at booking. Payment can be collected separately.'
          : 'No payment is needed right now. Payment may be collected at your appointment.';

      default:
        return '';
    }
  };

  return (
    <View style={[styles.confirmSection, { backgroundColor: colors.successLight }]}>
      <Text style={[styles.confirmLabel, { color: colors.success }]}>
        {labelMap[type] || ''}
      </Text>
      <Text style={[styles.confirmSubtext, { color: colors.textSecondary, marginTop: 2 }]}>
        {getDescription()}
      </Text>
    </View>
  );
};

BookingBenefitBanner.propTypes = {
  type: PropTypes.oneOf(['membership', 'package', 'noPayment']).isRequired,
  isCoach: PropTypes.bool,
  clientFirstName: PropTypes.string,
  packageName: PropTypes.string,
  packageRemaining: PropTypes.number,
};

export default BookingBenefitBanner;
