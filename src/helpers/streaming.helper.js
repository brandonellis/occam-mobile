/**
 * Shared streaming request builder for SSE endpoints.
 *
 * Centralizes auth token retrieval, tenant header construction,
 * and streamSSE invocation so individual API services only need
 * to specify their endpoint path and event handlers.
 */
import { getToken, getTenantId, clearAllStorage } from './storage.helper';
import { getTenantApiUrl } from '../config';
import { streamSSE } from './sse.helper';

/**
 * Build and execute an authenticated SSE streaming request.
 *
 * @param {string} endpoint   - API path (e.g., '/marshal/chat/stream')
 * @param {Object} body       - Request body (will be JSON-stringified)
 * @param {Object} handlers   - SSE event handlers { token, card, done, error, ... }
 * @returns {Promise<any>} The parsed data from the "done" event
 * @throws {Error} If auth token is missing, or streaming fails
 */
export const sendStreamingRequest = async (endpoint, body, handlers = {}) => {
  const token = await getToken();
  if (!token) {
    throw new Error('Authentication token is required');
  }

  const tenantId = await getTenantId();
  const baseUrl = tenantId ? getTenantApiUrl(tenantId) : '';
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    Accept: 'text/event-stream',
    'X-Requested-With': 'XMLHttpRequest',
  };
  if (tenantId) {
    headers['X-Tenant'] = tenantId;
  }

  const { promise } = streamSSE(
    `${baseUrl}${endpoint}`,
    {
      headers,
      body: JSON.stringify(body),
      timeout: 60000,
      onUnauthorized: () => clearAllStorage(),
    },
    handlers,
  );

  return promise;
};
