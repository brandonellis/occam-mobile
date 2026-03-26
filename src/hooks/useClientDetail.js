import { useEffect, useCallback, useReducer, useRef } from 'react';
import { Alert, LayoutAnimation } from 'react-native';
import {
  getClient,
  getClientPerformanceCurriculum,
  getClientSharedMedia,
  getClientPerformanceSnapshots,
  shareMediaWithClient,
  unshareMediaFromClient,
  createPerformanceSnapshot,
} from '../services/accounts.api';
import { getBookings } from '../services/bookings.api';
import { getClientActivities } from '../services/activity.api';
import {
  clientDetailReducer,
  clientDetailInitialState,
  CLIENT_DETAIL_ACTIONS,
} from '../reducers/clientDetail.reducer';
import { buildClientMarshalIntent } from '../helpers/marshalIntent.helper';
import useMarshalIntent from './useMarshalIntent';
import { SCREENS } from '../constants/navigation.constants';
import logger from '../helpers/logger.helper';

const SECTIONS = {
  ACTIVITY: 'activity',
  CURRICULUM: 'curriculum',
  RESOURCES: 'resources',
  REPORTS: 'reports',
  UPCOMING: 'upcoming',
  PAST: 'past',
};

const useClientDetail = ({ clientId, navigation, company }) => {
  const [state, dispatch] = useReducer(clientDetailReducer, clientDetailInitialState);
  const {
    client, modules, upcomingBookings, pastBookings, sharedMedia, snapshots,
    activities, activitiesTotal, isLoading, isRefreshing, showMediaPicker,
    isSharing, isCreatingSnapshot, showAllModules, selectedActivity, snackbar,
    expandedSections, loadedSections, loadingSections,
  } = state;
  const undoTimerRef = useRef(null);

  // Load only client profile + bookings on mount (essential data)
  const loadCoreData = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) dispatch({ type: CLIENT_DETAIL_ACTIONS.SET_REFRESHING, payload: true });
      else dispatch({ type: CLIENT_DETAIL_ACTIONS.SET_LOADING, payload: true });

      const [clientRes, bookingsRes] = await Promise.allSettled([
        getClient(clientId),
        getBookings({ client_id: clientId, per_page: 25, status: 'all' }),
      ]);

      if (clientRes.status === 'fulfilled') {
        dispatch({ type: CLIENT_DETAIL_ACTIONS.SET_CLIENT, payload: clientRes.value.data });
      }
      if (bookingsRes.status === 'fulfilled') {
        const all = bookingsRes.value.data || [];
        const now = new Date();
        const upcoming = all
          .filter((b) => b.start_time && new Date(b.start_time) > now)
          .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
        const past = all
          .filter((b) => !b.start_time || new Date(b.start_time) <= now)
          .sort((a, b) => new Date(b.start_time) - new Date(a.start_time));
        dispatch({
          type: CLIENT_DETAIL_ACTIONS.SET_BOOKINGS,
          payload: { upcoming: upcoming.slice(0, 5), past: past.slice(0, 5) },
        });
      }
    } catch (err) {
      logger.warn('Failed to load client data:', err?.message || err);
    } finally {
      dispatch({ type: CLIENT_DETAIL_ACTIONS.LOAD_COMPLETE });
    }
  }, [clientId]);

  // Lazy loaders for each section
  const loadSectionData = useCallback(async (section) => {
    dispatch({ type: CLIENT_DETAIL_ACTIONS.SECTION_LOADING, payload: section });
    try {
      if (section === SECTIONS.ACTIVITY) {
        const res = await getClientActivities(clientId, { per_page: 10 });
        const items = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
        const total = res?.meta?.total ?? items.length;
        dispatch({ type: CLIENT_DETAIL_ACTIONS.SET_ACTIVITIES, payload: { items, total } });
      } else if (section === SECTIONS.CURRICULUM) {
        const res = await getClientPerformanceCurriculum(clientId);
        const data = res.data;
        dispatch({ type: CLIENT_DETAIL_ACTIONS.SET_MODULES, payload: data?.modules || data || [] });
      } else if (section === SECTIONS.RESOURCES) {
        const res = await getClientSharedMedia(clientId);
        dispatch({ type: CLIENT_DETAIL_ACTIONS.SET_SHARED_MEDIA, payload: res.data || [] });
      } else if (section === SECTIONS.REPORTS) {
        const res = await getClientPerformanceSnapshots(clientId);
        dispatch({ type: CLIENT_DETAIL_ACTIONS.SET_SNAPSHOTS, payload: res.data || [] });
      }
      dispatch({ type: CLIENT_DETAIL_ACTIONS.SECTION_LOADED, payload: section });
    } catch (err) {
      logger.warn(`Failed to load ${section}:`, err?.message || err);
      dispatch({ type: CLIENT_DETAIL_ACTIONS.SECTION_LOADED, payload: section });
    }
  }, [clientId]);

  const toggleSection = useCallback((section) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const willExpand = !expandedSections[section];
    // Fetch data on first expand
    if (willExpand && !loadedSections[section] && !loadingSections[section]) {
      loadSectionData(section);
    }
    dispatch({ type: CLIENT_DETAIL_ACTIONS.TOGGLE_SECTION, payload: section });
  }, [expandedSections, loadedSections, loadingSections, loadSectionData]);

  // Refresh handler reloads core data + any already-expanded sections
  const handleRefresh = useCallback(async () => {
    dispatch({ type: CLIENT_DETAIL_ACTIONS.SET_REFRESHING, payload: true });
    await loadCoreData(true);
    // Re-fetch data for any sections that are currently expanded
    const expandedKeys = Object.keys(expandedSections).filter((k) => expandedSections[k]);
    if (expandedKeys.length > 0) {
      await Promise.allSettled(expandedKeys.map((s) => loadSectionData(s)));
    }
    dispatch({ type: CLIENT_DETAIL_ACTIONS.SET_REFRESHING, payload: false });
  }, [loadCoreData, expandedSections, loadSectionData]);

  // Load on mount + refresh when returning from curriculum editor or other screens
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadCoreData();
      // Re-fetch any already-loaded sections silently
      Object.keys(loadedSections).forEach((section) => {
        if (loadedSections[section]) loadSectionData(section);
      });
    });
    return unsubscribe;
  }, [navigation, loadCoreData, loadedSections, loadSectionData]);

  const handleShareMedia = useCallback(async ({ upload_id, notes }) => {
    dispatch({ type: CLIENT_DETAIL_ACTIONS.SET_IS_SHARING, payload: true });
    try {
      await shareMediaWithClient(clientId, { upload_id, notes });
      dispatch({ type: CLIENT_DETAIL_ACTIONS.SET_SHOW_MEDIA_PICKER, payload: false });
      loadSectionData(SECTIONS.RESOURCES);
    } catch (err) {
      const msg = err.response?.status === 409
        ? 'This resource is already shared with this client.'
        : err.response?.data?.message || 'Failed to share resource.';
      Alert.alert('Error', msg);
    } finally {
      dispatch({ type: CLIENT_DETAIL_ACTIONS.SET_IS_SHARING, payload: false });
    }
  }, [clientId, loadSectionData]);

  const handleCreateSnapshot = useCallback(() => {
    Alert.alert(
      'Share Progress Report',
      'This will capture a snapshot of the client\'s current curriculum progress and assessment scores, then share it with the client.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Share',
          onPress: async () => {
            dispatch({ type: CLIENT_DETAIL_ACTIONS.SET_IS_CREATING_SNAPSHOT, payload: true });
            try {
              await createPerformanceSnapshot(clientId);
              Alert.alert('Success', 'Progress report shared with client.');
              loadSectionData(SECTIONS.REPORTS);
            } catch (err) {
              Alert.alert(
                'Error',
                err.response?.data?.message || 'Failed to create progress report.'
              );
            } finally {
              dispatch({ type: CLIENT_DETAIL_ACTIONS.SET_IS_CREATING_SNAPSHOT, payload: false });
            }
          },
        },
      ]
    );
  }, [clientId, loadSectionData]);

  const { deliverIntent } = useMarshalIntent();

  const handleOpenMarshal = useCallback(() => {
    if (!client) return;

    deliverIntent(buildClientMarshalIntent({
      client,
      company,
      upcomingBookings,
      pastBookings,
    }));
    navigation.getParent()?.navigate(SCREENS.MARSHAL);
  }, [client, company, deliverIntent, upcomingBookings, pastBookings, navigation]);

  const handleUnshare = useCallback((sharedMediaId) => {
    // Find the item being removed so we can restore on undo
    const removedItem = sharedMedia.find((m) => m.id === sharedMediaId);
    if (!removedItem) return;

    // Optimistic removal with smooth animation
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    dispatch({ type: CLIENT_DETAIL_ACTIONS.REMOVE_SHARED_MEDIA, payload: sharedMediaId });

    // Clear any pending undo timer from a previous removal
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);

    // Show undo snackbar
    dispatch({
      type: CLIENT_DETAIL_ACTIONS.SET_SNACKBAR,
      payload: { visible: true, message: 'Resource removed', undoData: { sharedMediaId, removedItem } },
    });

    // Fire the API delete after a short delay to allow undo
    undoTimerRef.current = setTimeout(async () => {
      try {
        await unshareMediaFromClient(clientId, sharedMediaId);
      } catch (err) {
        logger.warn('Failed to unshare media:', err.message);
        // Restore the item on failure
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        dispatch({ type: CLIENT_DETAIL_ACTIONS.RESTORE_SHARED_MEDIA, payload: removedItem });
        dispatch({ type: CLIENT_DETAIL_ACTIONS.DISMISS_SNACKBAR });
        Alert.alert('Error', 'Failed to remove shared resource.');
      }
    }, 3500);
  }, [clientId, sharedMedia]);

  const handleUndoUnshare = useCallback(() => {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    const { undoData } = snackbar;
    if (undoData?.removedItem) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      dispatch({ type: CLIENT_DETAIL_ACTIONS.RESTORE_SHARED_MEDIA, payload: undoData.removedItem });
    }
    dispatch({ type: CLIENT_DETAIL_ACTIONS.DISMISS_SNACKBAR });
  }, [snackbar]);

  return {
    // State
    client,
    modules,
    upcomingBookings,
    pastBookings,
    sharedMedia,
    snapshots,
    activities,
    activitiesTotal,
    isLoading,
    isRefreshing,
    showMediaPicker,
    isSharing,
    isCreatingSnapshot,
    showAllModules,
    selectedActivity,
    snackbar,
    expandedSections,
    loadedSections,
    loadingSections,
    // Handlers
    dispatch,
    toggleSection,
    handleRefresh,
    handleShareMedia,
    handleCreateSnapshot,
    handleOpenMarshal,
    handleUnshare,
    handleUndoUnshare,
    // Constants
    SECTIONS,
  };
};

export default useClientDetail;
