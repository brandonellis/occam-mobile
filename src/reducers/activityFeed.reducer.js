import { sortNewestFirst } from '../helpers/activity.helper';
import { ACTIVITY_TYPES } from '../constants/activity.constants';

export const FEED_ACTIONS = {
  FETCH_START: 'FETCH_START',
  FETCH_SUCCESS: 'FETCH_SUCCESS',
  FETCH_MORE_START: 'FETCH_MORE_START',
  FETCH_MORE_SUCCESS: 'FETCH_MORE_SUCCESS',
  FETCH_ERROR: 'FETCH_ERROR',
  SET_TYPE_FILTER: 'SET_TYPE_FILTER',
  SET_DATE_FILTER: 'SET_DATE_FILTER',
  SET_TAG_FILTER: 'SET_TAG_FILTER',
  CLEAR_ALL_FILTERS: 'CLEAR_ALL_FILTERS',
  REFRESH_START: 'REFRESH_START',
};

export const feedInitialState = {
  activities: [],
  loading: true,
  refreshing: false,
  loadingMore: false,
  error: null,
  page: 1,
  lastPage: 1,
  activeFilter: ACTIVITY_TYPES.ALL,
  dateFilter: 'all',
  selectedTagIds: [],
};

export function feedReducer(state, action) {
  switch (action.type) {
    case FEED_ACTIONS.FETCH_START:
      return { ...state, loading: true, error: null };
    case FEED_ACTIONS.REFRESH_START:
      return { ...state, refreshing: true, error: null };
    case FEED_ACTIONS.FETCH_SUCCESS: {
      const sorted = [...action.payload.items].sort(sortNewestFirst);
      return {
        ...state,
        activities: sorted,
        loading: false,
        refreshing: false,
        page: action.payload.page,
        lastPage: action.payload.lastPage,
        error: null,
      };
    }
    case FEED_ACTIONS.FETCH_MORE_START:
      return { ...state, loadingMore: true };
    case FEED_ACTIONS.FETCH_MORE_SUCCESS: {
      const merged = [...state.activities, ...action.payload.items].sort(sortNewestFirst);
      const seen = new Set();
      const unique = merged.filter((item) => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      });
      return {
        ...state,
        activities: unique,
        loadingMore: false,
        page: action.payload.page,
        lastPage: action.payload.lastPage,
      };
    }
    case FEED_ACTIONS.FETCH_ERROR:
      return { ...state, loading: false, refreshing: false, loadingMore: false, error: action.payload };
    case FEED_ACTIONS.SET_TYPE_FILTER:
      return { ...state, activeFilter: action.payload, activities: [], page: 1, lastPage: 1, loading: true };
    case FEED_ACTIONS.SET_DATE_FILTER:
      return { ...state, dateFilter: action.payload, activities: [], page: 1, lastPage: 1, loading: true };
    case FEED_ACTIONS.SET_TAG_FILTER:
      return { ...state, selectedTagIds: action.payload, activities: [], page: 1, lastPage: 1, loading: true };
    case FEED_ACTIONS.CLEAR_ALL_FILTERS:
      return { ...state, activeFilter: ACTIVITY_TYPES.ALL, dateFilter: 'all', selectedTagIds: [], activities: [], page: 1, lastPage: 1, loading: true };
    default:
      return state;
  }
}
