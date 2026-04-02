import apiClient, { centralClient } from './apiClient';

export const login = async (email, password, tenantId) => {
  const response = await apiClient.post('/auth/login', {
    email,
    password,
    tenant_id: tenantId,
  });
  return response.data;
};

export const logout = async () => {
  const response = await apiClient.post('/auth/logout');
  return response.data;
};

export const getUser = async () => {
  const response = await apiClient.get('/auth/user-profile');
  return response.data;
};

export const forgotPassword = async (email) => {
  const response = await apiClient.post('/auth/forgot-password', { email });
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

/**
 * Authenticate with Apple using a native identityToken (from expo-apple-authentication).
 * Sends the identityToken to the backend which verifies it with Apple and returns a Sanctum token.
 * @param {string} identityToken - The Apple identityToken from native sign-in
 * @param {string} tenantSlug - The tenant ID/slug
 * @param {object|null} fullName - The user's full name (only provided on first sign-in)
 * @returns {Promise<{success: boolean, data: {token: string, user: object}}>}
 */
export const appleSignInNative = async (identityToken, tenantSlug, fullName) => {
  const response = await centralClient.post('/auth/apple/authenticate-native', {
    identity_token: identityToken,
    tenant: tenantSlug,
    full_name: fullName,
  });
  return response.data;
};

/**
 * Generate a single-use exchange token for transferring the current session
 * to the in-app browser (App Store compliance — web-based payment flows).
 * The token is valid for 5 minutes and consumed on first use.
 */
export const createExchangeToken = async () => {
  const response = await apiClient.post('/auth/exchange-token');
  return response.data.exchange_token;
};
