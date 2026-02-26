import { centralClient } from './apiClient';

/**
 * Search for organizations by name or slug.
 * Public endpoint — no auth required.
 * @param {string} query - Search term (min 2 chars)
 * @returns {Promise<Array<{id: string, name: string, domain: string}>>}
 */
export const searchTenants = async (query) => {
  console.log('[searchTenants] Searching for:', query);
  try {
    const response = await centralClient.get('/tenants/lookup', {
      params: { q: query },
    });
    console.log('[searchTenants] Status:', response.status);
    console.log('[searchTenants] Data:', JSON.stringify(response.data));
    console.log('[searchTenants] Results count:', Array.isArray(response.data) ? response.data.length : 'not an array');
    return response.data;
  } catch (error) {
    console.error('[searchTenants] Error:', error.message);
    console.error('[searchTenants] Response status:', error.response?.status);
    console.error('[searchTenants] Response data:', JSON.stringify(error.response?.data));
    throw error;
  }
};
