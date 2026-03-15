import React from 'react';
import { View, Text } from 'react-native';
import { ProgressBar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { membershipStyles as styles } from '../styles/membership.styles';
import { colors } from '../theme';

/**
 * ServiceUsageCard
 *
 * Shared component for displaying service allotment usage.
 * Used by membership allotments, package allotments, and the profile benefits view.
 *
 * Props:
 * - serviceName: display name of the service
 * - used: number of uses consumed
 * - remaining: number remaining (null = unlimited)
 * - total: total allotment (null = unlimited)
 * - resetDate: formatted string for next reset (membership only), null for packages
 */
const ServiceUsageCard = ({ serviceName, used, remaining, total, resetDate }) => {
  const isUnlimited = remaining === null;

  let percent = 0;
  let barColor = colors.accent;
  if (total) {
    percent = Math.min(1, used / Math.max(1, total));
    if (percent > 0.8) barColor = colors.error;
    else if (percent > 0.6) barColor = colors.warning;
  }

  return (
    <View style={styles.serviceCard}>
      <Text style={styles.serviceCardName}>{serviceName}</Text>

      {isUnlimited ? (
        <View style={styles.serviceUnlimited}>
          <MaterialCommunityIcons name="infinity" size={20} color={colors.success} />
          <Text style={styles.serviceUnlimitedText}>
            <Text style={styles.serviceUsageBold}>{used}</Text> sessions used
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.serviceUsageRow}>
            <View style={styles.serviceUsageStat}>
              <Text style={styles.serviceUsageBig}>{used}</Text>
              <Text style={styles.serviceUsageLabel}>used</Text>
            </View>
            <View style={styles.serviceUsageDivider} />
            <View style={styles.serviceUsageStat}>
              <Text style={styles.serviceUsageBig}>{remaining}</Text>
              <Text style={styles.serviceUsageLabel}>remaining</Text>
            </View>
            <View style={styles.serviceUsageDivider} />
            <View style={styles.serviceUsageStat}>
              <Text style={styles.serviceUsageBig}>{total}</Text>
              <Text style={styles.serviceUsageLabel}>total</Text>
            </View>
          </View>
          <ProgressBar
            progress={percent}
            color={barColor}
            style={styles.serviceProgressBar}
          />
        </>
      )}

      {resetDate && (
        <View style={styles.serviceResetRow}>
          <MaterialCommunityIcons name="sync" size={13} color={colors.textTertiary} />
          <Text style={styles.serviceResetText}>
            Resets {resetDate}
          </Text>
        </View>
      )}
    </View>
  );
};

ServiceUsageCard.propTypes = {
  serviceName: PropTypes.string.isRequired,
  used: PropTypes.number.isRequired,
  remaining: PropTypes.number,
  total: PropTypes.number,
  resetDate: PropTypes.string,
};

export default ServiceUsageCard;
