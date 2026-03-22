import { useState, useEffect } from 'react';
import { getMyBookingBenefits } from '../services/packages.api';
import logger from '../helpers/logger.helper';

/**
 * Fetches package benefit status for the authenticated client.
 * Only fires after membership has resolved — if the service is already
 * covered by membership, package check is skipped.
 *
 * Coach bookings skip package check (packages are client-facing).
 */
const useBookingPackage = ({
  clientId,
  serviceId,
  isEditMode,
  isCoach,
  membershipLoading,
  isMembershipBooking,
  membershipRefreshKey,
}) => {
  const [packageBenefit, setPackageBenefit] = useState(null);
  const [packageBenefitLoading, setPackageBenefitLoading] = useState(false);

  useEffect(() => {
    if (isEditMode || !clientId || !serviceId) return;
    // Wait for membership to finish loading before checking packages
    if (membershipLoading) return;
    // If membership covers this service, skip package check
    if (isMembershipBooking) {
      setPackageBenefit(null);
      setPackageBenefitLoading(false);
      return;
    }
    // Only check for the authenticated client (not coach booking for others)
    if (isCoach) {
      setPackageBenefit(null);
      setPackageBenefitLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setPackageBenefitLoading(true);
        const data = await getMyBookingBenefits(serviceId);
        if (cancelled) return;
        const packages = data?.packages || [];
        if (packages.length > 0) {
          setPackageBenefit({
            hasPackage: true,
            bestPackage: packages[0],
            client_package_id: packages[0].client_package_id,
            package_name: packages[0].package_name,
            remaining: packages[0].remaining,
          });
        } else {
          setPackageBenefit({ hasPackage: false });
        }
      } catch (err) {
        logger.warn('Failed to fetch booking benefits:', err.message);
        if (!cancelled) setPackageBenefit({ hasPackage: false });
      } finally {
        if (!cancelled) setPackageBenefitLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [clientId, isEditMode, serviceId, isCoach, membershipLoading, isMembershipBooking, membershipRefreshKey]);

  const isPackageBooking = !isMembershipBooking && !!packageBenefit?.hasPackage;

  return {
    packageBenefit,
    packageBenefitLoading,
    isPackageBooking,
  };
};

export default useBookingPackage;
