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
 * Authenticate with Google using a native idToken (from @react-native-google-signin).
 * Sends the idToken to the backend which verifies it with Google and returns a Sanctum token.
 * @param {string} idToken - The Google idToken from native sign-in
 * @param {string} tenantSlug - The tenant ID/slug
 * @returns {Promise<{success: boolean, data: {token: string, user: object}}>}
 */
export const googleSignInNative = async (idToken, tenantSlug) => {
  const response = await centralClient.post('/auth/google/authenticate-native', {
    id_token: idToken,
    tenant: tenantSlug,
  });
  return response.data;
};
