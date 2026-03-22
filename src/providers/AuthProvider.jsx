import React, { useReducer, useEffect, useCallback } from 'react';
import { queryClient } from './QueryClientProvider';
import AuthContext from '../context/Auth.context';
import { authReducer, initialAuthState, AUTH_ACTIONS } from '../reducers/auth.reducer';
import { ADMIN_SHELL_ROLES, COACH_ROLES } from '../constants/auth.constants';
import {
  setToken,
  setTenantId,
  setUserData,
  setActiveRole as persistActiveRole,
  setCompanyData,
  getToken,
  getUserData,
  getActiveRole as loadActiveRole,
  getCompanyData,
  clearAllStorage,
} from '../helpers/storage.helper';
import * as authApi from '../services/auth.api';
import { getCompany } from '../services/bookings.api';
import { unregisterPushToken } from '../services/notifications.api';
import * as Notifications from 'expo-notifications';
import logger from '../helpers/logger.helper';

const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialAuthState);

  const getRoleNames = useCallback((user) => (
    user?.roles?.map((role) => (typeof role === 'string' ? role : role.name)) || []
  ), []);

  const resolveRole = (user) => {
    const roleNames = getRoleNames(user);
    if (!roleNames.length) return null;
    if (roleNames.some((roleName) => ADMIN_SHELL_ROLES.includes(roleName))) return 'admin';
    if (roleNames.some((roleName) => COACH_ROLES.includes(roleName))) return 'coach';
    return 'client';
  };

  const normalizeActiveRole = useCallback((user, savedActiveRole, resolvedRole) => {
    const roleNames = getRoleNames(user);
    const hasAdminShellRole = roleNames.some((roleName) => ADMIN_SHELL_ROLES.includes(roleName));

    if (!savedActiveRole) return resolvedRole;
    if (savedActiveRole === 'owner') return 'admin';
    if (hasAdminShellRole && savedActiveRole === 'coach') return 'admin';
    if (!['admin', 'coach', 'client'].includes(savedActiveRole)) return resolvedRole;

    return savedActiveRole;
  }, [getRoleNames]);

  const checkIsDualRole = (user) => {
    const roleNames = getRoleNames(user);
    if (!roleNames.length) return false;
    const hasCoachOrAdmin = roleNames.some((roleName) => COACH_ROLES.includes(roleName));
    const hasClient = roleNames.includes('client');
    return hasCoachOrAdmin && hasClient;
  };

  const fetchAndStoreCompany = useCallback(async () => {
    try {
      const resp = await getCompany();
      const companyData = resp?.data || resp;
      await setCompanyData(companyData);
      dispatch({ type: AUTH_ACTIONS.SET_COMPANY, payload: companyData });
    } catch (err) {
      logger.warn('Failed to fetch company:', err.message);
    }
  }, []);

  const restoreSession = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
        return;
      }

      const [cachedUser, savedActiveRole, cachedCompany] = await Promise.all([
        getUserData(),
        loadActiveRole(),
        getCompanyData(),
      ]);

      if (cachedUser) {
        const role = resolveRole(cachedUser);
        const activeRole = normalizeActiveRole(cachedUser, savedActiveRole, role);
        dispatch({
          type: AUTH_ACTIONS.RESTORE_SESSION,
          payload: {
            user: cachedUser,
            role,
            activeRole,
          },
        });
      }

      if (cachedCompany) {
        dispatch({ type: AUTH_ACTIONS.SET_COMPANY, payload: cachedCompany });
      }

      const freshUser = await authApi.getUser();
      const role = resolveRole(freshUser);
      const activeRole = normalizeActiveRole(freshUser, savedActiveRole, role);
      await setUserData(freshUser);
      await persistActiveRole(activeRole);
      dispatch({
        type: AUTH_ACTIONS.SET_USER,
        payload: {
          user: freshUser,
          role,
          activeRole,
        },
      });

      fetchAndStoreCompany();
    } catch {
      await clearAllStorage();
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  }, [fetchAndStoreCompany, normalizeActiveRole]);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const login = useCallback(async (email, password, tenantId) => {
    dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

    try {
      // Store tenant ID first so apiClient interceptor can set baseURL + X-Tenant header
      await setTenantId(tenantId);

      const loginResponse = await authApi.login(email, password, tenantId);
      const token = loginResponse.access_token;

      await setToken(token);

      const user = await authApi.getUser();
      const role = resolveRole(user);

      await setUserData(user);

      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { user, role },
      });

      fetchAndStoreCompany();

      return { success: true };
    } catch (error) {
      // Clear tenant ID on login failure so stale tenant doesn't persist
      await clearAllStorage();
      const message =
        error.response?.data?.message || 'Login failed. Please try again.';
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: message });
      return { success: false, error: message };
    }
  }, [fetchAndStoreCompany]);

  const loginWithGoogle = useCallback(async (accessToken, userData, tenantSlug) => {
    dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

    try {
      const role = resolveRole(userData);

      await setToken(accessToken);
      await setUserData(userData);
      if (tenantSlug) {
        await setTenantId(tenantSlug);
      }

      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { user: userData, role },
      });

      fetchAndStoreCompany();

      return { success: true };
    } catch (error) {
      const message = 'Google sign-in failed. Please try again.';
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: message });
      return { success: false, error: message };
    }
  }, [fetchAndStoreCompany]);

  const switchRole = useCallback(async (newRole) => {
    await persistActiveRole(newRole);
    dispatch({ type: AUTH_ACTIONS.SWITCH_ROLE, payload: newRole });
  }, []);

  const logoutUser = useCallback(async () => {
    try {
      // Unregister push token before logging out
      try {
        const tokenData = await Notifications.getExpoPushTokenAsync();
        if (tokenData?.data) {
          await unregisterPushToken(tokenData.data);
        }
      } catch {
        // Push token cleanup is best-effort
      }
      await authApi.logout();
    } catch {
      // Proceed with local logout even if API call fails
    } finally {
      await clearAllStorage();
      queryClient.clear();
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  }, []);

  const setError = useCallback((message) => {
    dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: message });
  }, []);

  const isDualRole = checkIsDualRole(state.user);

  const value = {
    ...state,
    isDualRole,
    login,
    loginWithGoogle,
    logout: logoutUser,
    switchRole,
    clearError,
    setError,
    restoreSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
