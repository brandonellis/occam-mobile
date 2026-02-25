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
