import axios from 'axios';
import config, { getTenantApiUrl } from '../config';
import { getToken, getTenantId, clearAllStorage } from '../helpers/storage.helper';

// ---------------------------------------------------------------------------
// Retry helpers
// ---------------------------------------------------------------------------

const MAX_RETRIES = 3;
const RETRY_DELAY_BASE = 1000; // 1 second

/**
 * Returns true for errors that are safe to retry automatically:
 *   - Network errors (no response received)
 *   - HTTP 429 (rate limited)
 *   - HTTP 5xx (server errors)
 */
function isRetryableError(error) {
  if (!error.response) return true;
  if (error.response.status === 429) return true;
  if (error.response.status >= 500) return true;
  return false;
}

/**
 * Only retry idempotent / safe HTTP methods by default.
 * GET, HEAD, and OPTIONS never produce side-effects.
 */
function isRetryableMethod(method) {
  return ['get', 'head', 'options'].includes(method?.toLowerCase());
}

/**
 * Attaches an exponential-backoff retry interceptor to an axios instance.
 * Retries up to MAX_RETRIES times with delays of 1 s, 2 s, 4 s.
 *
 * This interceptor must be registered *before* other response-error
 * interceptors so it can retry transparently.
 */
function attachRetryInterceptor(client) {
  client.interceptors.response.use(null, async (error) => {
    const reqConfig = error.config;

    // Guard: skip if we've exhausted retries, the error isn't transient,
    // or the method isn't safe to replay.
    if (
      !reqConfig ||
      (reqConfig._retryCount || 0) >= MAX_RETRIES ||
      !isRetryableError(error) ||
      !isRetryableMethod(reqConfig.method)
    ) {
      return Promise.reject(error);
    }

    reqConfig._retryCount = (reqConfig._retryCount || 0) + 1;

    // Exponential backoff: 1 s, 2 s, 4 s
    const delay = RETRY_DELAY_BASE * Math.pow(2, reqConfig._retryCount - 1);
    await new Promise((resolve) => setTimeout(resolve, delay));

    return client(reqConfig);
  });
}

// ---------------------------------------------------------------------------
// Central API client — public endpoints (tenant lookup, etc.)
// ---------------------------------------------------------------------------

export const centralClient = axios.create({
  baseURL: config.centralUrl,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

attachRetryInterceptor(centralClient);

// ---------------------------------------------------------------------------
// Tenant API client — authenticated tenant requests
// ---------------------------------------------------------------------------

const apiClient = axios.create({
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

apiClient.interceptors.request.use(
  async (reqConfig) => {
    const token = await getToken();
    if (token) {
      reqConfig.headers.Authorization = `Bearer ${token}`;
    }

    const tenantId = await getTenantId();
    if (tenantId) {
      reqConfig.baseURL = getTenantApiUrl(tenantId);
      reqConfig.headers['X-Tenant'] = tenantId;
    }

    return reqConfig;
  },
  (error) => Promise.reject(error)
);

// Retry interceptor is registered before the 401 handler so transient
// failures are retried before we consider clearing auth state.
attachRetryInterceptor(apiClient);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await clearAllStorage();
    }
    return Promise.reject(error);
  }
);

export default apiClient;
