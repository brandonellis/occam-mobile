import * as SecureStore from 'expo-secure-store';
import { STORAGE_KEYS } from '../constants/auth.constants';

export const setToken = async (token) => {
  await SecureStore.setItemAsync(STORAGE_KEYS.AUTH_TOKEN, token);
};

export const getToken = async () => {
  return await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN);
};

export const removeToken = async () => {
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
  await SecureStore.setItemAsync(STORAGE_KEYS.TENANT_ID, tenantId);
};

export const getTenantId = async () => {
  return await SecureStore.getItemAsync(STORAGE_KEYS.TENANT_ID);
};

export const removeTenantId = async () => {
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
  await Promise.all([
    removeToken(),
    removeUserData(),
    removeTenantId(),
    removeActiveRole(),
    removeCompanyData(),
  ]);
};
