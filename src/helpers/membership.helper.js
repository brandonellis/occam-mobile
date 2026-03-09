import { colors } from '../theme/colors';

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

/**
 * Check if a membership is currently in a paused window.
 *
 * @param {object} membership
 * @returns {boolean}
 */
export const isMembershipPausedNow = (membership) => {
  if (!membership?.is_paused) return false;
  const now = Date.now();
  const afterStart = !membership.pause_start_at || now > new Date(membership.pause_start_at).getTime();
  const beforeEnd = !membership.pause_end_at || now < new Date(membership.pause_end_at).getTime();
  return afterStart && beforeEnd;
};

/**
 * Get membership status display info (mirrors web portal getMembershipStatus).
 *
 * @param {object} membership
 * @returns {{ status: string, color: string, text: string }}
 */
export const getMembershipStatus = (membership) => {
  if (!membership) {
    return { status: 'inactive', color: colors.textTertiary, text: 'No Membership' };
  }

  const status = (membership.stripe_status || '').toLowerCase();
  const isPaused = isMembershipPausedNow(membership);

  const endCandidates = [
    membership.end_date,
    membership.current_period_end,
    membership.expires_at,
    membership.ends_at,
  ].filter(Boolean);

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const isCanceledLike = status === 'canceled' || status === 'cancelled';
  if (isCanceledLike && endCandidates.length > 0) {
    const end = new Date(endCandidates[0]);
    if (end >= startOfToday) {
      const formatted = formatDate(end);
      return { status: 'active_until', color: colors.warning, text: `Active until ${formatted}` };
    }
  }

  if (isPaused) {
    return { status: 'paused', color: colors.info, text: 'Paused' };
  }

  const isExpired = endCandidates.length > 0 && endCandidates.some((e) => new Date(e) < startOfToday);
  if (isExpired) {
    return { status: 'expired', color: colors.textTertiary, text: 'Expired' };
  }

  if (status === 'active' || status === 'trialing' || status === 'past_due') {
    return { status: 'active', color: colors.success, text: 'Active' };
  }

  return { status: 'inactive', color: colors.textTertiary, text: 'Inactive' };
};

/**
 * Calculate the next renewal/reset date for a membership billing cycle.
 *
 * @param {string} startDate - ISO date string of the membership start
 * @param {object} billingCycle - Billing cycle object with duration_months
 * @returns {Date|null} Next renewal Date, or null
 */
export const getNextRenewalDate = (startDate, billingCycle) => {
  if (!startDate || !billingCycle) return null;
  const start = new Date(startDate);
  const months = billingCycle.duration_months || 1;
  const now = new Date();
  let next = new Date(start);
  while (next <= now) {
    next.setMonth(next.getMonth() + months);
  }
  return next;
};

/**
 * Format a Date to "MMM D, YYYY" (e.g., "Jan 5, 2026").
 * @param {Date} date
 * @returns {string}
 */
export const formatDate = (date) => {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};
