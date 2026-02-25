/**
 * Pricing helper functions — mirrors web client's pricing logic exactly.
 *
 * Web sources:
 *   calculateEffectivePrice → occam-client/src/utils/serviceHelpers.js
 *   formatCurrency          → occam-client/src/utils/helpers.jsx
 *   usePlatformFee          → occam-client/src/hooks/usePlatformFee.js
 *   usePaymentSummary       → occam-client/src/hooks/usePaymentSummary.js
 */

/**
 * Calculate the effective price for a booking, accounting for variable duration.
 * For variable-duration services, price scales linearly: (selectedDuration / baseDuration) * basePrice.
 * For standard services, returns the base price unchanged.
 *
 * @param {Object} service - Service object with price, duration_minutes, is_variable_duration
 * @param {number|null} selectedDuration - The duration selected by the client (minutes), or null for standard
 * @returns {number} - The calculated price
 */
export const calculateEffectivePrice = (service, selectedDuration = null) => {
  const basePrice = parseFloat(service?.price) || 0;
  if (!service?.is_variable_duration || !selectedDuration) return basePrice;

  const baseDuration =
    service.duration_minutes != null && service.duration_minutes > 0
      ? service.duration_minutes
      : 60;
  return Math.round((selectedDuration / baseDuration) * basePrice * 100) / 100;
};

/**
 * Format a numeric amount as currency using Intl.NumberFormat.
 *
 * @param {number} amount
 * @param {Object} [options]
 * @param {string} [options.locale='en-US']
 * @param {string} [options.currency='USD']
 * @returns {string}
 */
export const formatCurrency = (
  amount,
  { locale = 'en-US', currency = 'USD' } = {}
) => {
  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return formatter.format(amount || 0);
};

/**
 * Calculate platform fee for a given subtotal.
 *
 * @param {number} subtotal - The base service price
 * @param {number} feeRate  - Decimal fee rate (e.g. 0.03 for 3%)
 * @returns {number}
 */
export const calculatePlatformFee = (subtotal, feeRate = 0) => {
  return subtotal * feeRate;
};

/**
 * Build a full payment summary matching the web client's usePaymentSummary hook.
 *
 * @param {Object} params
 * @param {Object} params.service            - Service object
 * @param {number|null} params.durationMinutes - Selected duration (for variable services)
 * @param {number} params.platformFeeRate    - Decimal rate (e.g. 0.04 for 4%)
 * @param {boolean} params.isMembershipBooking - Whether membership covers this booking
 * @param {Object} [params.currencyOpts]     - { locale, currency }
 * @returns {Object} Payment summary
 */
export const buildPaymentSummary = ({
  service,
  durationMinutes = null,
  platformFeeRate = 0,
  isMembershipBooking = false,
  currencyOpts = {},
}) => {
  const subtotal = calculateEffectivePrice(service, durationMinutes);
  const platformFee = isMembershipBooking
    ? 0
    : calculatePlatformFee(subtotal, platformFeeRate);
  const total = isMembershipBooking ? 0 : subtotal + platformFee;

  return {
    subtotal,
    platformFee,
    total,
    subtotalFormatted: formatCurrency(subtotal, currencyOpts),
    platformFeeFormatted: isMembershipBooking
      ? formatCurrency(0, currencyOpts)
      : formatCurrency(platformFee, currencyOpts),
    totalFormatted: isMembershipBooking
      ? 'FREE'
      : formatCurrency(total, currencyOpts),
    isMembershipBooking,
    platformFeePercent: Math.round(platformFeeRate * 10000) / 100,
  };
};
