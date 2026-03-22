import { useState, useEffect, useMemo, useCallback } from 'react';
import { getCurrentClientMembership } from '../services/accounts.api';
import logger from '../helpers/logger.helper';

/**
 * Fetches and resolves membership status for a booking client.
 * Determines whether a booking qualifies as a membership booking
 * and the member price if applicable.
 */
const useBookingMembership = ({ clientId, serviceId, isEditMode }) => {
  const [membershipStatus, setMembershipStatus] = useState(null);
  const [membershipLoading, setMembershipLoading] = useState(false);
  const [membershipRefreshKey, setMembershipRefreshKey] = useState(0);

  useEffect(() => {
    if (isEditMode || !clientId || !serviceId) return;
    let cancelled = false;

    (async () => {
      try {
        setMembershipLoading(true);
        const membership = await getCurrentClientMembership(clientId);
        if (cancelled) return;

        if (membership?.data) {
          const stripeStatus = (membership.data.stripe_status || '').toLowerCase();
          const endDate = membership.data.end_date || membership.data.ends_at || null;
          const now = new Date();
          const notEnded = !endDate || new Date(endDate) >= now;
          const isActiveForUsage =
            stripeStatus === 'active' ||
            ((stripeStatus === 'canceled' || stripeStatus === 'cancelled') && notEnded);

          // Check pause window
          const pausedNow = !!(
            membership.data.is_paused &&
            (!membership.data.pause_start_at || now > new Date(membership.data.pause_start_at)) &&
            (!membership.data.pause_end_at || now < new Date(membership.data.pause_end_at))
          );

          if (isActiveForUsage && !pausedNow) {
            const planServices = membership.data.membership_plan?.plan_services || [];
            const serviceUsage = planServices.find((ps) => ps.service_id === serviceId);
            const hasUsage =
              !!serviceUsage &&
              (serviceUsage.remaining_quantity === null || serviceUsage.remaining_quantity > 0);

            setMembershipStatus({
              hasActiveMembership: true,
              hasUsage,
              membershipId: membership.data.id,
              membershipPlanServiceId: serviceUsage?.id || null,
              planName: membership.data.membership_plan?.name,
              remainingQuantity: serviceUsage?.remaining_quantity,
              planServices,
              isPaused: false,
            });
          } else {
            setMembershipStatus({
              hasActiveMembership: false,
              hasUsage: false,
              isPaused: pausedNow,
              planName: membership.data.membership_plan?.name || null,
            });
          }
        } else {
          setMembershipStatus({ hasActiveMembership: false, hasUsage: false });
        }
      } catch (err) {
        logger.warn('Failed to fetch membership status:', err.message);
        if (!cancelled) setMembershipStatus({ hasActiveMembership: false, hasUsage: false });
      } finally {
        if (!cancelled) setMembershipLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [clientId, isEditMode, serviceId, membershipRefreshKey]);

  const isMembershipBooking =
    membershipStatus?.hasActiveMembership && membershipStatus?.hasUsage;

  const memberPriceCents = useMemo(() => {
    if (!membershipStatus?.hasActiveMembership || !serviceId) return null;
    const planServices = membershipStatus.planServices || [];
    const serviceUsage = planServices.find((ps) => ps.service_id === serviceId);
    return serviceUsage?.member_price ?? null;
  }, [membershipStatus, serviceId]);

  const refreshMembership = useCallback(() => {
    setMembershipRefreshKey((prev) => prev + 1);
  }, []);

  return {
    membershipStatus,
    membershipLoading,
    isMembershipBooking,
    memberPriceCents,
    refreshMembership,
    membershipRefreshKey,
  };
};

export default useBookingMembership;
