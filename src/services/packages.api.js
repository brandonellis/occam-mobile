import apiClient from './apiClient';

/**
 * Fetch all available (active) packages.
 *
 * @returns {Promise<Array>} Array of package objects with package_services
 */
export const getPackages = async () => {
  const response = await apiClient.get('/packages');
  const raw = response.data;
  return raw?.data || (Array.isArray(raw) ? raw : []);
};

/**
 * Fetch packages owned by the authenticated client.
 *
 * @returns {Promise<Array>} Array of client package objects
 */
export const getMyPackages = async () => {
  const response = await apiClient.get('/auth/my-packages');
  const raw = response.data;
  return raw?.data || (Array.isArray(raw) ? raw : []);
};

/**
 * Create a Stripe PaymentIntent for a package purchase.
 *
 * @param {Object} data
 * @param {number} data.client_id
 * @param {number} data.package_id
 * @param {string} data.payment_method_id - From CardField + createPaymentMethod
 * @param {boolean} [data.use_saved_payment_method=false]
 * @returns {Promise<Object>} { success, client_secret, payment_intent_id, package_amount, status, ... }
 */
export const createPackagePayment = async (data) => {
  const response = await apiClient.post('/billing/package-payment', data);
  return response.data;
};

/**
 * Notify backend that a package payment was confirmed successfully.
 *
 * @param {string} paymentIntentId
 * @returns {Promise<Object>}
 */
export const handlePackagePaymentSuccess = async (paymentIntentId) => {
  const response = await apiClient.post('/billing/payment-success', {
    payment_intent_id: paymentIntentId,
  });
  return response.data;
};

/**
 * Fetch booking benefit summary for the authenticated user + service.
 * Returns membership status, available packages, and recommended source.
 *
 * @param {number} serviceId
 * @returns {Promise<Object>} { membership, packages, recommended_source }
 */
export const getMyBookingBenefits = async (serviceId) => {
  const response = await apiClient.get('/auth/my-booking-benefits', {
    params: { service_id: serviceId },
  });
  return response.data?.data ?? response.data;
};
