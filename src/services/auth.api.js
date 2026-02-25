import apiClient, { centralClient } from './apiClient';

export const login = async (email, password, tenantId) => {
  const response = await apiClient.post('/login', {
    email,
    password,
    tenant_id: tenantId,
  });
  return response.data;
};

export const logout = async () => {
  const response = await apiClient.post('/logout');
  return response.data;
};

export const getUser = async () => {
  const response = await apiClient.get('/user');
  return response.data;
};

export const forgotPassword = async (email) => {
  const response = await apiClient.post('/forgot-password', { email });
  return response.data;
};

/**
 * Get the Google OAuth redirect URL for a given tenant.
 * @param {string} tenantSlug - The tenant ID/slug
 * @param {string} returnUrl - The deep link URL for the callback
 * @returns {Promise<{redirect_url: string}>}
 */
export const getGoogleAuthUrl = async (tenantSlug, returnUrl) => {
  const response = await centralClient.get('/auth/google/redirect', {
    params: {
      tenant: tenantSlug,
      context: 'tenant',
      return_url: returnUrl,
      original_domain: '__mobile_app__',
    },
  });
  return response.data;
};
