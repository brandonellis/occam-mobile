import apiClient from './apiClient';

/**
 * Create a Stripe PaymentIntent for a service booking.
 * Backend calculates platform fee via application_fee_amount.
 *
 * @param {Object} data
 * @param {number} data.client_id
 * @param {number} data.service_id
 * @param {number} [data.booking_id]
 * @param {Object} [data.metadata]
 * @returns {Promise<Object>} { success, client_secret, payment_intent_id, service_amount, platform_fee, total_amount, connect_account, status }
 */
export const createServicePayment = async (data) => {
  const response = await apiClient.post('/billing/service-payment', data);
  return response.data;
};

/**
 * Notify backend that a payment was confirmed successfully.
 *
 * @param {string} paymentIntentId
 * @returns {Promise<Object>}
 */
export const handlePaymentSuccess = async (paymentIntentId) => {
  const response = await apiClient.post('/billing/payment-success', {
    payment_intent_id: paymentIntentId,
  });
  return response.data;
};

/**
 * Create a Stripe subscription for a membership plan.
 * Requires a payment_method_id (from CardField + createPaymentMethod).
 *
 * @param {Object} data
 * @param {number} data.client_id
 * @param {number} data.membership_plan_id
 * @param {number} data.billing_cycle_id
 * @param {string} data.payment_method_id
 * @returns {Promise<Object>} { success, client_secret, subscription_id, subscription_status, amount, platform_fee }
 */
export const createMembershipSubscription = async (data) => {
  const response = await apiClient.post('/billing/membership-subscription', data);
  return response.data;
};

/**
 * Fetch saved payment methods for a client (staff endpoint).
 *
 * @param {number} clientId
 * @returns {Promise<Object>} { payment_methods, default_payment_method }
 */
export const getClientPaymentMethods = async (clientId) => {
  const response = await apiClient.get(`/clients/${clientId}/payment-methods`);
  return response.data;
};

/**
 * Fetch the authenticated user's own saved payment methods.
 *
 * @returns {Promise<Object>} { payment_methods, default_payment_method }
 */
export const getMyPaymentMethods = async () => {
  const response = await apiClient.get('/auth/my-payment-methods');
  return response.data;
};

/**
 * Calculate tax for a given amount using the Stripe Tax Calculation API.
 *
 * @param {number} amountCents - Taxable amount in cents
 * @param {string} [currency='usd'] - Three-letter currency code
 * @returns {Promise<Object>} { success, tax_amount } (tax_amount in cents)
 */
export const calculateTaxForAmount = async (amountCents, currency = 'usd') => {
  try {
    const response = await apiClient.post('/billing/tax-estimate', { amount_cents: amountCents, currency });
    return response.data;
  } catch (_) {
    return { success: true, tax_amount: 0 };
  }
};

/**
 * Resolve a booking payment token to booking details.
 * Public endpoint — no auth required.
 *
 * @param {string} token - 64-char payment token (72-hour TTL)
 * @returns {Promise<Object>} { success, data: { service_name, start_time, end_time, ... } }
 */
export const resolvePaymentToken = async (token) => {
  const response = await apiClient.get(`/public/billing/payment-link/${token}`);
  return response.data;
};

/**
 * Create a PaymentIntent for a tokenized booking payment.
 *
 * @param {string} token
 * @returns {Promise<Object>} { success, client_secret, payment_intent_id, service_amount, platform_fee, total_amount, connect_account }
 */
export const createTokenPayment = async (token) => {
  const response = await apiClient.post(`/public/billing/payment-link/${token}/pay`);
  return response.data;
};

/**
 * Collect payment for an existing unpaid booking (staff/coach action).
 *
 * @param {number} bookingId
 * @param {Object} [options]
 * @param {boolean} [options.useSavedPaymentMethod]
 * @param {string} [options.paymentMethodId]
 * @returns {Promise<Object>} { success, client_secret, payment_intent_id, service_amount, total_amount, status, connect_account }
 */
export const collectBookingPayment = async (bookingId, options = {}) => {
  const payload = {};
  if (options.useSavedPaymentMethod) payload.use_saved_payment_method = true;
  if (options.paymentMethodId) payload.payment_method_id = options.paymentMethodId;
  const response = await apiClient.post(`/billing/bookings/${bookingId}/collect-payment`, payload);
  return response.data;
};
