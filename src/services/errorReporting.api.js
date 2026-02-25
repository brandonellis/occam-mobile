import axios from 'axios';
import apiClient from './apiClient';
import { getTenantApiUrl } from '../config';
import { getTenantId } from '../helpers/storage.helper';

/**
 * Report a frontend error to the backend, which relays it to Slack.
 * Mirrors occam-client's reportFrontendError in misc.api.js.
 *
 * Uses the tenant apiClient when a tenant is already set (most common case).
 * Falls back to building the URL manually from stored tenant ID so errors
 * that occur before full auth setup still get reported.
 *
 * @param {Object} payload
 * @returns {Promise<void>}
 */
export const reportFrontendError = async (payload = {}) => {
  try {
    // Fast path: tenant apiClient already has baseURL via interceptor
    await apiClient.post('/errors/report', payload);
  } catch {
    // Fallback: build URL manually from stored tenant ID
    try {
      const tenantId = await getTenantId();
      if (tenantId) {
        const baseURL = getTenantApiUrl(tenantId);
        await axios.post(`${baseURL}/errors/report`, payload, {
          timeout: 5000,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    } catch {
      // Swallow — reporting failures should never crash the app
    }
  }
};
