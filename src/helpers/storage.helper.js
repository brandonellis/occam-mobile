import * as SecureStore from 'expo-secure-store';
import { STORAGE_KEYS } from '../constants/auth.constants';

// In-memory cache to avoid hitting SecureStore (native bridge) on every API call
// undefined = not yet loaded from SecureStore; null = loaded but no value stored
let cachedToken = undefined;
let cachedTenantId = undefined;

export const setToken = async (token) => {
  cachedToken = token;
  await SecureStore.setItemAsync(STORAGE_KEYS.AUTH_TOKEN, token);
};

export const getToken = async () => {
  if (cachedToken !== undefined) return cachedToken;
  cachedToken = (await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN)) || null;
  return cachedToken;
};

export const removeToken = async () => {
  cachedToken = undefined;
  await SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH_TOKEN);
};

export const setUserData = async (userData) => {
  await SecureStore.setItemAsync(
    STORAGE_KEYS.USER_DATA,
    JSON.stringify(userData)
  );
};

export const getUserData = async () => {
  const data = await SecureStore.getItemAsync(STORAGE_KEYS.USER_DATA);
  return data ? JSON.parse(data) : null;
};

export const removeUserData = async () => {
  await SecureStore.deleteItemAsync(STORAGE_KEYS.USER_DATA);
};

export const setTenantId = async (tenantId) => {
  cachedTenantId = tenantId;
  await SecureStore.setItemAsync(STORAGE_KEYS.TENANT_ID, tenantId);
};

export const getTenantId = async () => {
  if (cachedTenantId !== undefined) return cachedTenantId;
  cachedTenantId = (await SecureStore.getItemAsync(STORAGE_KEYS.TENANT_ID)) || null;
  return cachedTenantId;
};

export const removeTenantId = async () => {
  cachedTenantId = undefined;
  await SecureStore.deleteItemAsync(STORAGE_KEYS.TENANT_ID);
};

export const setActiveRole = async (role) => {
  await SecureStore.setItemAsync(STORAGE_KEYS.ACTIVE_ROLE, role);
};

export const getActiveRole = async () => {
  return await SecureStore.getItemAsync(STORAGE_KEYS.ACTIVE_ROLE);
};

export const removeActiveRole = async () => {
  await SecureStore.deleteItemAsync(STORAGE_KEYS.ACTIVE_ROLE);
};

export const setCompanyData = async (companyData) => {
  await SecureStore.setItemAsync(
    STORAGE_KEYS.COMPANY_DATA,
    JSON.stringify(companyData)
  );
};

export const getCompanyData = async () => {
  const data = await SecureStore.getItemAsync(STORAGE_KEYS.COMPANY_DATA);
  return data ? JSON.parse(data) : null;
};

export const removeCompanyData = async () => {
  await SecureStore.deleteItemAsync(STORAGE_KEYS.COMPANY_DATA);
};

export const clearAllStorage = async () => {
  cachedToken = undefined;
  cachedTenantId = undefined;
  await Promise.all([
    removeToken(),
    removeUserData(),
    removeTenantId(),
    removeActiveRole(),
    removeCompanyData(),
  ]);
};
