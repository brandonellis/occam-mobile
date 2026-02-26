import React, { useReducer, useEffect, useCallback } from 'react';
import AuthContext from '../context/Auth.context';
import { authReducer, initialAuthState, AUTH_ACTIONS } from '../reducers/auth.reducer';
import { COACH_ROLES } from '../constants/auth.constants';
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

const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialAuthState);

  const resolveRole = (user) => {
    if (!user?.roles?.length) return null;
    const roleNames = user.roles.map((r) => (typeof r === 'string' ? r : r.name));
    if (roleNames.some((r) => COACH_ROLES.includes(r))) {
      return roleNames.includes('admin') ? 'admin' : 'coach';
    }
    return 'client';
  };

  const checkIsDualRole = (user) => {
    if (!user?.roles?.length) return false;
    const roleNames = user.roles.map((r) => (typeof r === 'string' ? r : r.name));
    const hasCoachOrAdmin = roleNames.some((r) => COACH_ROLES.includes(r));
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
      console.warn('Failed to fetch company:', err.message);
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
        dispatch({
          type: AUTH_ACTIONS.RESTORE_SESSION,
          payload: {
            user: cachedUser,
            role,
            activeRole: savedActiveRole || role,
          },
        });
      }

      if (cachedCompany) {
        dispatch({ type: AUTH_ACTIONS.SET_COMPANY, payload: cachedCompany });
      }

      const { data: freshUser } = await authApi.getUser();
      const role = resolveRole(freshUser);
      await setUserData(freshUser);
      dispatch({
        type: AUTH_ACTIONS.SET_USER,
        payload: {
          user: freshUser,
          role,
          activeRole: savedActiveRole || role,
        },
      });

      fetchAndStoreCompany();
    } catch {
      await clearAllStorage();
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  }, [fetchAndStoreCompany]);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const login = useCallback(async (email, password, tenantId) => {
    dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

    try {
      const { data } = await authApi.login(email, password, tenantId);
      const { token, user } = data;
      const role = resolveRole(user);

      await setToken(token);
      await setUserData(user);

      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { user, role },
      });

      fetchAndStoreCompany();

      return { success: true };
    } catch (error) {
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
      await authApi.logout();
    } catch {
      // Proceed with local logout even if API call fails
    } finally {
      await clearAllStorage();
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
