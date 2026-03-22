import { useMemo, useCallback, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCurrentClientMembership, getMyMembership } from '../services/accounts.api';
import { QUERY_KEYS } from '../constants/queryKeys.constants';

/**
 * Fetches and resolves membership status for a booking client.
 * Determines whether a booking qualifies as a membership booking
 * and the member price if applicable.
 *
 * Uses React Query internally for caching — switching between clients
 * or navigating back returns cached membership data instantly.
 *
 * Coach/Admin flow uses the staff endpoint (/clients/{id}/current-membership).
 * Client flow uses the client-accessible endpoint (/auth/my-membership).
 */
const useBookingMembership = ({ clientId, serviceId, isEditMode, isCoach }) => {
  const [refreshKey, setRefreshKey] = useState(0);

  const {
    data: rawMembership,
    isLoading: membershipLoading,
    isError: membershipError,
  } = useQuery({
    queryKey: [...QUERY_KEYS.MEMBERSHIPS.my, clientId, refreshKey],
    queryFn: async () => {
      try {
        return isCoach ? await getCurrentClientMembership(clientId) : await getMyMembership();
      } catch (err) {
        // 404 = no active membership — treat as null data, not an error
        if (err?.response?.status === 404) return null;
        throw err;
      }
    },
    enabled: !isEditMode && !!clientId && !!serviceId,
    staleTime: 30 * 1000, // 30s — membership can change mid-session
  });

  // Derive membership status from raw query data
  const membershipStatus = useMemo(() => {
    const membership = rawMembership?.data ?? rawMembership;
    if (!membership) return { hasActiveMembership: false, hasUsage: false };

    const stripeStatus = (membership.stripe_status || '').toLowerCase();
    const endDate = membership.end_date || membership.ends_at || null;
    const now = new Date();
    const notEnded = !endDate || new Date(endDate) >= now;
    const isActiveForUsage =
      stripeStatus === 'active' ||
      ((stripeStatus === 'canceled' || stripeStatus === 'cancelled') && notEnded);

    // Check pause window
    const pausedNow = !!(
      membership.is_paused &&
      (!membership.pause_start_at || now > new Date(membership.pause_start_at)) &&
      (!membership.pause_end_at || now < new Date(membership.pause_end_at))
    );

    if (isActiveForUsage && !pausedNow) {
      const planServices = membership.membership_plan?.plan_services || [];
      const serviceUsage = planServices.find((ps) => ps.service_id === serviceId);
      const hasUsage =
        !!serviceUsage &&
        (serviceUsage.remaining_quantity === null || serviceUsage.remaining_quantity > 0);

      return {
        hasActiveMembership: true,
        hasUsage,
        membershipId: membership.id,
        membershipPlanServiceId: serviceUsage?.id || null,
        planName: membership.membership_plan?.name,
        remainingQuantity: serviceUsage?.remaining_quantity,
        planServices,
        isPaused: false,
      };
    }

    return {
      hasActiveMembership: false,
      hasUsage: false,
      isPaused: pausedNow,
      planName: membership.membership_plan?.name || null,
    };
  }, [rawMembership, serviceId]);

  const isMembershipBooking =
    membershipStatus?.hasActiveMembership && membershipStatus?.hasUsage;

  const memberPriceCents = useMemo(() => {
    if (!membershipStatus?.hasActiveMembership || !serviceId) return null;
    const planServices = membershipStatus.planServices || [];
    const serviceUsage = planServices.find((ps) => ps.service_id === serviceId);
    return serviceUsage?.member_price ?? null;
  }, [membershipStatus, serviceId]);

  const refreshMembership = useCallback(() => {
    // Bump refresh key to force a new query with a fresh cache entry
    setRefreshKey((prev) => prev + 1);
  }, []);

  return {
    membershipStatus,
    membershipLoading,
    membershipError,
    isMembershipBooking,
    memberPriceCents,
    refreshMembership,
  };
};

export default useBookingMembership;
