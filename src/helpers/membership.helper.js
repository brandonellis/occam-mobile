/**
 * Determine if a membership subscription data object represents an active membership.
 *
 * @param {object} membershipData - The membership data from getCurrentClientMembership API
 * @returns {boolean} Whether the membership is considered active for usage purposes
 */
export const isMembershipActive = (membershipData) => {
  if (!membershipData) return false;
  const status = (membershipData.stripe_status || '').toLowerCase();
  const endDate = membershipData.end_date || membershipData.ends_at || null;
  const notEnded = !endDate || new Date(endDate) >= new Date();
  return (status === 'active' || ((status === 'canceled' || status === 'cancelled') && notEnded)) && !membershipData.is_paused;
};

/**
 * Build a per-service allotment map from membership plan services.
 * Returns an object keyed by service ID with { remaining, total } values,
 * or null if no allotments are available.
 *
 * @param {object} membershipData - The membership data from getCurrentClientMembership API
 * @returns {Object<number, {remaining: number|null, total: number}>|null}
 */
export const buildMembershipAllotments = (membershipData) => {
  if (!membershipData) return null;
  const planServices = membershipData.membership_plan?.plan_services || [];
  if (planServices.length === 0) return null;

  const allotments = {};
  planServices.forEach((ps) => {
    const serviceId = ps.service_id || ps.service?.id;
    if (serviceId) {
      allotments[serviceId] = {
        remaining: ps.remaining_quantity ?? null,
        total: ps.quantity || 0,
      };
    }
  });
  return Object.keys(allotments).length > 0 ? allotments : null;
};
