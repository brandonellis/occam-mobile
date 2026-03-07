import apiClient from './apiClient';

/**
 * Validate a promo code against a service/location context.
 * Returns discount preview data if valid.
 *
 * @param {Object} params
 * @param {string} params.code - The promo code to validate
 * @param {number} params.service_id - Service ID
 * @param {number} params.location_id - Location ID
 * @param {number} [params.client_id] - Client ID (optional)
 * @param {number} [params.service_price] - Service price (optional, backend looks it up)
 * @returns {Promise<Object>} Discount preview data
 */
export const validatePromoCode = async (params) => {
  const response = await apiClient.post('/promotions/validate', params);
  return response.data;
};
