import axios from 'axios';
import config, { getTenantApiUrl } from '../config';
import { getToken, getTenantId, clearAllStorage } from '../helpers/storage.helper';

/**
 * Central API client — used for public endpoints like tenant lookup.
 * No auth token or tenant header needed.
 */
export const centralClient = axios.create({
  baseURL: config.centralUrl,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

/**
 * Tenant API client — used for all authenticated tenant requests.
 * Dynamically sets the baseURL based on the stored tenant slug.
 */
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
