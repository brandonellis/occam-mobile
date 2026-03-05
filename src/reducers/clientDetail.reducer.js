export const CLIENT_DETAIL_ACTIONS = {
  // Data loading
  SET_LOADING: 'SET_LOADING',
  SET_REFRESHING: 'SET_REFRESHING',
  SET_CLIENT: 'SET_CLIENT',
  SET_BOOKINGS: 'SET_BOOKINGS',
  SET_MODULES: 'SET_MODULES',
  SET_SHARED_MEDIA: 'SET_SHARED_MEDIA',
  SET_SNAPSHOTS: 'SET_SNAPSHOTS',
  SET_ACTIVITIES: 'SET_ACTIVITIES',
  LOAD_COMPLETE: 'LOAD_COMPLETE',

  // Section accordion
  TOGGLE_SECTION: 'TOGGLE_SECTION',
  SECTION_LOADING: 'SECTION_LOADING',
  SECTION_LOADED: 'SECTION_LOADED',

  // UI state
  SET_SHOW_ALL_MODULES: 'SET_SHOW_ALL_MODULES',
  SET_SHOW_MEDIA_PICKER: 'SET_SHOW_MEDIA_PICKER',
  SET_IS_SHARING: 'SET_IS_SHARING',
  SET_IS_CREATING_SNAPSHOT: 'SET_IS_CREATING_SNAPSHOT',
  SET_SELECTED_ACTIVITY: 'SET_SELECTED_ACTIVITY',
  SET_SNACKBAR: 'SET_SNACKBAR',
  DISMISS_SNACKBAR: 'DISMISS_SNACKBAR',

  // Inline updates
  ADD_SHARED_MEDIA: 'ADD_SHARED_MEDIA',
  REMOVE_SHARED_MEDIA: 'REMOVE_SHARED_MEDIA',
  RESTORE_SHARED_MEDIA: 'RESTORE_SHARED_MEDIA',
  ADD_SNAPSHOT: 'ADD_SNAPSHOT',
};

export const clientDetailInitialState = {
  // Data
  client: null,
  modules: [],
  upcomingBookings: [],
  pastBookings: [],
  sharedMedia: [],
  snapshots: [],
  activities: [],
  activitiesTotal: 0,

  // Loading
  isLoading: true,
  isRefreshing: false,

  // Section accordion
  expandedSections: {},
  loadedSections: {},
  loadingSections: {},

  // UI
  showMediaPicker: false,
  isSharing: false,
  isCreatingSnapshot: false,
  showAllModules: false,
  selectedActivity: null,
  snackbar: { visible: false, message: '', undoData: null },
};

export const clientDetailReducer = (state, action) => {
  switch (action.type) {
    // ── Data loading ──────────────────────────────────────────────────
    case CLIENT_DETAIL_ACTIONS.SET_LOADING:
      return { ...state, isLoading: action.payload };

    case CLIENT_DETAIL_ACTIONS.SET_REFRESHING:
      return { ...state, isRefreshing: action.payload };

    case CLIENT_DETAIL_ACTIONS.SET_CLIENT:
      return { ...state, client: action.payload };

    case CLIENT_DETAIL_ACTIONS.SET_BOOKINGS:
      return {
        ...state,
        upcomingBookings: action.payload.upcoming,
        pastBookings: action.payload.past,
      };

    case CLIENT_DETAIL_ACTIONS.SET_MODULES:
      return { ...state, modules: action.payload };

    case CLIENT_DETAIL_ACTIONS.SET_SHARED_MEDIA:
      return { ...state, sharedMedia: action.payload };

    case CLIENT_DETAIL_ACTIONS.SET_SNAPSHOTS:
      return { ...state, snapshots: action.payload };

    case CLIENT_DETAIL_ACTIONS.SET_ACTIVITIES:
      return {
        ...state,
        activities: action.payload.items,
        activitiesTotal: action.payload.total,
      };

    case CLIENT_DETAIL_ACTIONS.LOAD_COMPLETE:
      return { ...state, isLoading: false, isRefreshing: false };

    // ── Section accordion ─────────────────────────────────────────────
    case CLIENT_DETAIL_ACTIONS.TOGGLE_SECTION:
      return {
        ...state,
        expandedSections: {
          ...state.expandedSections,
          [action.payload]: !state.expandedSections[action.payload],
        },
      };

    case CLIENT_DETAIL_ACTIONS.SECTION_LOADING:
      return {
        ...state,
        loadingSections: {
          ...state.loadingSections,
          [action.payload]: true,
        },
      };

    case CLIENT_DETAIL_ACTIONS.SECTION_LOADED:
      return {
        ...state,
        loadedSections: {
          ...state.loadedSections,
          [action.payload]: true,
        },
        loadingSections: {
          ...state.loadingSections,
          [action.payload]: false,
        },
      };

    // ── UI state ──────────────────────────────────────────────────────
    case CLIENT_DETAIL_ACTIONS.SET_SHOW_ALL_MODULES:
      return { ...state, showAllModules: action.payload };

    case CLIENT_DETAIL_ACTIONS.SET_SHOW_MEDIA_PICKER:
      return { ...state, showMediaPicker: action.payload };

    case CLIENT_DETAIL_ACTIONS.SET_IS_SHARING:
      return { ...state, isSharing: action.payload };

    case CLIENT_DETAIL_ACTIONS.SET_IS_CREATING_SNAPSHOT:
      return { ...state, isCreatingSnapshot: action.payload };

    case CLIENT_DETAIL_ACTIONS.SET_SELECTED_ACTIVITY:
      return { ...state, selectedActivity: action.payload };

    case CLIENT_DETAIL_ACTIONS.SET_SNACKBAR:
      return { ...state, snackbar: action.payload };

    case CLIENT_DETAIL_ACTIONS.DISMISS_SNACKBAR:
      return { ...state, snackbar: { visible: false, message: '', undoData: null } };

    // ── Inline updates ────────────────────────────────────────────────
    case CLIENT_DETAIL_ACTIONS.ADD_SHARED_MEDIA:
      return { ...state, sharedMedia: [action.payload, ...state.sharedMedia] };

    case CLIENT_DETAIL_ACTIONS.REMOVE_SHARED_MEDIA:
      return {
        ...state,
        sharedMedia: state.sharedMedia.filter((m) => m.id !== action.payload),
      };

    case CLIENT_DETAIL_ACTIONS.RESTORE_SHARED_MEDIA:
      return {
        ...state,
        sharedMedia: [...state.sharedMedia, action.payload].sort((a, b) => b.id - a.id),
      };

    case CLIENT_DETAIL_ACTIONS.ADD_SNAPSHOT:
      return { ...state, snapshots: [action.payload, ...state.snapshots] };

    default:
      return state;
  }
};
