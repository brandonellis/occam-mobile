import { centralClient } from './apiClient';

/**
 * Search for organizations by name or slug.
 * Public endpoint — no auth required.
 * @param {string} query - Search term (min 2 chars)
 * @returns {Promise<Array<{id: string, name: string, domain: string}>>}
 */
export const searchTenants = async (query) => {
  const response = await centralClient.get('/tenants/lookup', {
    params: { q: query },
  });
  return response.data;
};
