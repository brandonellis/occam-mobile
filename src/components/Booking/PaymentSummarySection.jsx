import React from 'react';
import { View, TouchableOpacity, Animated } from 'react-native';
import { Text } from 'react-native-paper';
import PropTypes from 'prop-types';
import { bookingStyles as styles } from '../../styles/booking.styles';
import { colors } from '../../theme';
import { formatCurrency } from '../../helpers/pricing.helper';

const PaymentSummarySection = ({
  summary,
  appliedPromo,
  taxAmount = 0,
  feeBreakdownVisible,
  onToggleFeeBreakdown,
  feeDescription,
  membershipLoading,
  ecommerceLoading,
  isEditMode,
  skeletonAnim,
  seriesMultiplier = 1,
  occurrences = null,
}) => {
  if (isEditMode) return null;

  // Skeleton loading state
  if (membershipLoading || ecommerceLoading) {
    return (
      <View style={styles.confirmSection}>
        <Text style={styles.confirmLabel}>PAYMENT SUMMARY</Text>
        <Animated.View style={[styles.skeletonBlock, { opacity: skeletonAnim }]}>
          <View style={styles.skeletonRow}>
            <View style={[styles.skeletonBar, { width: '35%' }]} />
            <View style={[styles.skeletonBar, { width: '15%' }]} />
          </View>
          <View style={styles.skeletonRow}>
            <View style={[styles.skeletonBar, { width: '40%' }]} />
            <View style={[styles.skeletonBar, { width: '15%' }]} />
          </View>
          <View style={[styles.confirmDivider, styles.totalDivider]} />
          <View style={styles.skeletonRow}>
            <View style={[styles.skeletonBar, { width: '25%', height: 18 }]} />
            <View style={[styles.skeletonBar, { width: '20%', height: 18 }]} />
          </View>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={styles.confirmSection}>
      <Text style={styles.confirmLabel}>PAYMENT SUMMARY</Text>

      {/* Subtotal row */}
      <View style={[styles.confirmRow, styles.summaryFeesRow]}>
        <Text style={styles.summaryLabel}>
          {occurrences ? `Subtotal (${occurrences} sessions)` : 'Subtotal'}
        </Text>
        <Text style={[styles.summaryValue, appliedPromo && { textDecorationLine: 'line-through', color: colors.textTertiary }]}>
          {occurrences
            ? formatCurrency(summary.subtotal * seriesMultiplier)
            : summary.subtotalFormatted}
        </Text>
      </View>

      {/* Promo discount row */}
      {appliedPromo && (
        <View style={[styles.confirmRow, styles.summaryFeesRow]}>
          <Text style={[styles.summaryLabel, { color: colors.success }]}>Promo: {appliedPromo.code}</Text>
          <Text style={[styles.summaryValue, { color: colors.success }]}>-{formatCurrency(Number(appliedPromo.discount_amount || 0))}</Text>
        </View>
      )}

      {/* Taxes and Fees row with info toggle */}
      <View style={styles.summaryFeesRow}>
        <View style={styles.confirmRow}>
          <View style={styles.summaryFeesInner}>
            <Text style={styles.summaryLabel}>Taxes and Fees</Text>
            <TouchableOpacity
              onPress={onToggleFeeBreakdown}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.summaryInfoButton}
            >
              <Text style={[styles.summaryInfoIcon, { color: colors.primary }]}>ⓘ</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.summaryValue}>
            {formatCurrency((summary.platformFee + taxAmount) * seriesMultiplier)}
          </Text>
        </View>

        {/* Fee breakdown details */}
        {feeBreakdownVisible && (
          <View style={styles.feeBreakdown}>
            <Text style={styles.feeBreakdownTitle}>Breakdown:</Text>
            <Text style={styles.feeBreakdownItem}>
              Platform Fee ({summary.platformFeePercent}%): {summary.platformFeeFormatted}
            </Text>
            {taxAmount > 0 && (
              <Text style={styles.feeBreakdownItem}>
                Tax: {formatCurrency(taxAmount)}
              </Text>
            )}
            <Text style={styles.feeBreakdownDesc}>
              {feeDescription}
            </Text>
          </View>
        )}
      </View>

      {/* Total divider and total row */}
      <View style={[styles.confirmDivider, styles.totalDivider]} />

      <View style={styles.confirmRow}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalPrice}>
          {summary.isMembershipBooking || summary.isPackageBooking ? 'FREE' : formatCurrency((summary.total + taxAmount) * seriesMultiplier)}
        </Text>
      </View>
    </View>
  );
};

PaymentSummarySection.propTypes = {
  summary: PropTypes.shape({
    subtotalFormatted: PropTypes.string,
    platformFeePercent: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    platformFeeFormatted: PropTypes.string,
    totalFormatted: PropTypes.string,
  }).isRequired,
  appliedPromo: PropTypes.shape({
    code: PropTypes.string,
    discount_amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }),
  taxAmount: PropTypes.number,
  feeBreakdownVisible: PropTypes.bool,
  onToggleFeeBreakdown: PropTypes.func.isRequired,
  feeDescription: PropTypes.string,
  membershipLoading: PropTypes.bool,
  ecommerceLoading: PropTypes.bool,
  isEditMode: PropTypes.bool,
  skeletonAnim: PropTypes.object,
  seriesMultiplier: PropTypes.number,
  occurrences: PropTypes.number,
};

export default PaymentSummarySection;
