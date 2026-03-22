import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMyBookingBenefits } from '../services/packages.api';
import { QUERY_KEYS } from '../constants/queryKeys.constants';

/**
 * Fetches package benefit status for the authenticated client.
 * Only fires after membership has resolved — if the service is already
 * covered by membership, package check is skipped.
 *
 * Coach bookings skip package check (packages are client-facing).
 *
 * Uses React Query internally for caching — navigating back to the
 * booking screen returns cached package data instantly.
 */
const useBookingPackage = ({
  clientId,
  serviceId,
  isEditMode,
  isCoach,
  membershipLoading,
  isMembershipBooking,
}) => {
  const shouldFetch =
    !isEditMode &&
    !!clientId &&
    !!serviceId &&
    !isCoach &&
    !membershipLoading &&
    !isMembershipBooking;

  const {
    data: rawBenefits,
    isLoading: packageBenefitLoading,
    isError: packageBenefitError,
  } = useQuery({
    queryKey: QUERY_KEYS.PACKAGES.myBookingBenefits(serviceId),
    queryFn: () => getMyBookingBenefits(serviceId),
    enabled: shouldFetch,
    staleTime: 30 * 1000, // 30s — packages can change mid-session
  });

  // Derive package benefit from raw query data
  const packageBenefit = useMemo(() => {
    if (!shouldFetch) return null;
    if (!rawBenefits) return null;

    const packages = rawBenefits?.packages || [];
    if (packages.length > 0) {
      return {
        hasPackage: true,
        bestPackage: packages[0],
        client_package_id: packages[0].client_package_id,
        package_name: packages[0].package_name,
        remaining: packages[0].remaining,
      };
    }
    return { hasPackage: false };
  }, [rawBenefits, shouldFetch]);

  const isPackageBooking = !isMembershipBooking && !!packageBenefit?.hasPackage;

  return {
    packageBenefit,
    packageBenefitLoading: shouldFetch ? packageBenefitLoading : false,
    packageBenefitError: shouldFetch ? packageBenefitError : false,
    isPackageBooking,
  };
};

export default useBookingPackage;
