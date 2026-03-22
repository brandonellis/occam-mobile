import React from 'react';
import { View, Animated } from 'react-native';
import { Text, ProgressBar } from 'react-native-paper';
import PropTypes from 'prop-types';
import { bookingStyles as styles } from '../../styles/booking.styles';
import { colors } from '../../theme';

const MembershipAllotmentSection = ({
  membershipStatus,
  membershipLoading,
  ecommerceLoading,
  isEditMode,
  isCoach,
  client,
  serviceId,
  coachNeedsPayment,
  skeletonAnim,
}) => {
  if (isEditMode) return null;

  // Loading skeleton
  if (membershipLoading || ecommerceLoading) {
    return (
      <View style={styles.allotmentSection}>
        <Text style={styles.allotmentTitle}>Payment</Text>
        <Animated.View style={[styles.skeletonBlock, { opacity: skeletonAnim }]}>
          <View style={styles.skeletonBar} />
          <View style={[styles.skeletonBar, { width: '60%' }]} />
        </Animated.View>
      </View>
    );
  }

  // No membership at all
  if (!membershipStatus?.hasActiveMembership && membershipStatus !== null) {
    // Coach sees a calm informational banner — not a warning
    if (isCoach) {
      return (
        <View style={styles.allotmentSection}>
          <Text style={styles.allotmentTitle}>Payment</Text>
          <View style={styles.coachInfoBanner}>
            <Text style={styles.coachInfoBannerText}>
              {membershipStatus.isPaused
                ? `${client?.first_name || 'This client'}'s membership is currently paused.`
                : `${client?.first_name || 'This client'} doesn't have an active membership.`}
              {coachNeedsPayment
                ? ' Payment will be collected below.'
                : ' This booking will be created as confirmed.'}
            </Text>
          </View>
        </View>
      );
    }

    // Client sees the standard membership status with payment info
    return (
      <View style={styles.allotmentSection}>
        <Text style={styles.allotmentTitle}>
          {membershipStatus.planName || 'Membership Status'}
        </Text>
        <View style={styles.allotmentNoMembership}>
          <Text style={styles.allotmentNoMembershipText}>
            {membershipStatus.isPaused
              ? 'Your membership is paused. Benefits are temporarily unavailable.'
              : "You don't currently have an active membership."}
          </Text>
          <Text style={[styles.allotmentNoMembershipText, styles.allotmentSubtext]}>
            Payment will be processed as a one-time booking.
          </Text>
        </View>
      </View>
    );
  }

  // Has membership — show allotment for all plan services
  if (membershipStatus?.hasActiveMembership && membershipStatus?.planServices?.length > 0) {
    const planServices = membershipStatus.planServices;

    return (
      <View style={styles.allotmentSection}>
        <Text style={styles.allotmentTitle}>
          {membershipStatus.planName || 'Membership'} — Service Usage This Cycle
        </Text>
        {planServices.map((ps) => {
          const serviceName = ps.service?.name || `Service ${ps.service_id}`;
          const total = ps.quantity || 0;
          const used = ps.used_quantity || 0;
          const remaining = ps.remaining_quantity != null
            ? ps.remaining_quantity
            : Math.max(0, total - used);
          const progress = total > 0 ? used / total : 0;
          const isCurrent = ps.service_id === serviceId;

          return (
            <View
              key={ps.service_id || ps.id}
              style={[styles.allotmentItem, isCurrent && styles.allotmentItemCurrent]}
            >
              <View style={styles.allotmentServiceRow}>
                <Text
                  style={[
                    styles.allotmentServiceName,
                    isCurrent && styles.allotmentServiceNameCurrent,
                  ]}
                >
                  {serviceName} {isCurrent ? '(Current)' : ''}
                </Text>
                <Text
                  style={[
                    styles.allotmentUsageText,
                    { color: remaining > 0 ? colors.success : colors.error },
                  ]}
                >
                  {used}/{total}
                </Text>
              </View>
              <ProgressBar
                progress={Math.min(progress, 1)}
                color={remaining > 0 ? colors.success : colors.error}
                style={styles.allotmentProgressBar}
              />
              <View style={styles.allotmentRemainingRow}>
                <Text style={styles.allotmentRemainingText}>
                  {remaining > 0 ? `${remaining} remaining` : 'Limit reached'}
                </Text>
              </View>
            </View>
          );
        })}

        {/* Warning if current service has no remaining usage */}
        {!membershipStatus.hasUsage && (
          <View style={isCoach ? styles.coachInfoBanner : styles.allotmentWarningBanner}>
            <Text style={isCoach ? styles.coachInfoBannerText : styles.allotmentNoMembershipText}>
              {isCoach
                ? `This service isn't covered by ${client?.first_name || 'the client'}'s plan, or the allotment has been used.${coachNeedsPayment ? ' Payment will be collected below.' : ' The booking will be created as confirmed.'}`
                : "This service isn't covered by your plan, or you've reached the allotment limit. Payment will be processed as a one-time booking."}
            </Text>
          </View>
        )}
      </View>
    );
  }

  return null;
};

MembershipAllotmentSection.propTypes = {
  membershipStatus: PropTypes.shape({
    hasActiveMembership: PropTypes.bool,
    hasUsage: PropTypes.bool,
    membershipId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    membershipPlanServiceId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    planName: PropTypes.string,
    remainingQuantity: PropTypes.number,
    planServices: PropTypes.array,
    isPaused: PropTypes.bool,
  }),
  membershipLoading: PropTypes.bool,
  ecommerceLoading: PropTypes.bool,
  isEditMode: PropTypes.bool,
  isCoach: PropTypes.bool,
  client: PropTypes.object,
  serviceId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  coachNeedsPayment: PropTypes.bool,
  skeletonAnim: PropTypes.object,
};

export default MembershipAllotmentSection;
