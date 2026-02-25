export const AUTH_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGOUT: 'LOGOUT',
  SET_USER: 'SET_USER',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  RESTORE_SESSION: 'RESTORE_SESSION',
  SWITCH_ROLE: 'SWITCH_ROLE',
};

export const initialAuthState = {
  isLoading: true,
  isAuthenticated: false,
  user: null,
  role: null,
  activeRole: null,
  error: null,
};

export const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.SET_LOADING:
      return { ...state, isLoading: action.payload };

    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        isLoading: false,
        isAuthenticated: true,
        user: action.payload.user,
        role: action.payload.role,
        activeRole: action.payload.activeRole || action.payload.role,
        error: null,
      };

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...initialAuthState,
        isLoading: false,
      };

    case AUTH_ACTIONS.SET_USER:
      return {
        ...state,
        user: action.payload.user,
        role: action.payload.role,
        activeRole: state.activeRole || action.payload.activeRole || action.payload.role,
      };

    case AUTH_ACTIONS.SET_ERROR:
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return { ...state, error: null };

    case AUTH_ACTIONS.RESTORE_SESSION:
      return {
        ...state,
        isLoading: false,
        isAuthenticated: true,
        user: action.payload.user,
        role: action.payload.role,
        activeRole: action.payload.activeRole || action.payload.role,
      };

    case AUTH_ACTIONS.SWITCH_ROLE:
      return {
        ...state,
        activeRole: action.payload,
      };

    default:
      return state;
  }
};
