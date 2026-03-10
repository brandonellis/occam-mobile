import React, { useEffect, useCallback, useReducer, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  LayoutAnimation,
  UIManager,
  Platform,
} from 'react-native';
import { Snackbar, IconButton, TouchableRipple } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ScreenHeader from '../../components/ScreenHeader';
import Avatar from '../../components/Avatar';
import MediaPickerModal from '../../components/MediaPickerModal';
import ActivityCard from '../../components/ActivityCard';
import ActivityDetailSheet from '../../components/ActivityDetailSheet';
import { SCREENS } from '../../constants/navigation.constants';
import {
  getClient,
  getClientPerformanceCurriculum,
  getClientSharedMedia,
  getClientPerformanceSnapshots,
  shareMediaWithClient,
  unshareMediaFromClient,
  createPerformanceSnapshot,
} from '../../services/accounts.api';
import { getBookings } from '../../services/bookings.api';
import { getClientActivities } from '../../services/activity.api';
import { clientDetailStyles as styles } from '../../styles/clientDetail.styles';
import { globalStyles } from '../../styles/global.styles';
import { formatTimeInTz, formatDateInTz } from '../../helpers/timezone.helper';
import useAuth from '../../hooks/useAuth';
import { colors } from '../../theme';
import { resolveMediaUrl } from '../../helpers/media.helper';
import AuthImage from '../../components/AuthImage';
import logger from '../../helpers/logger.helper';
import {
  clientDetailReducer,
  clientDetailInitialState,
  CLIENT_DETAIL_ACTIONS,
} from '../../reducers/clientDetail.reducer';

const getDocIcon = (mime) => {
  if (mime.startsWith('application/pdf')) return 'file-document';
  if (mime.includes('spreadsheet') || mime.includes('excel')) return 'grid';
  if (mime.includes('presentation') || mime.includes('powerpoint')) return 'presentation';
  return 'file-document-outline';
};

const SharedMediaCard = ({ item, navigation, onUnshare, clientId }) => {
  const mime = item.mime_type || '';
  const isVideo = mime.startsWith('video/');
  const isImage = mime.startsWith('image/');
  const mediaUrl = resolveMediaUrl(item.url);
  const thumbUrl = resolveMediaUrl(item.thumbnail_url);

  const handleVideoPress = () => {
    if (item.url) {
      navigation.navigate(SCREENS.VIDEO_PLAYER, {
        videoUrl: item.url,
        videoTitle: item.filename || 'Video',
        uploadId: item.upload_id,
        targetType: 'client',
        targetId: clientId,
      });
    }
  };

  return (
    <View style={styles.sharedMediaCard}>
      {isImage && mediaUrl && (
        <AuthImage
          uri={mediaUrl}
          style={styles.sharedMediaPreview}
          resizeMode="cover"
        />
      )}

      {isVideo && mediaUrl && (
        <TouchableOpacity activeOpacity={0.8} onPress={handleVideoPress}>
          {thumbUrl ? (
            <View>
              <AuthImage
                uri={thumbUrl}
                style={styles.sharedMediaVideoContainer}
                resizeMode="cover"
              />
              <View style={styles.sharedMediaPlayOverlay}>
                <MaterialCommunityIcons name="play-circle" size={48} color="rgba(255,255,255,0.9)" />
              </View>
            </View>
          ) : (
            <View style={styles.sharedMediaVideoPlaceholder}>
              <MaterialCommunityIcons name="video" size={28} color={colors.textTertiary} />
              <View style={styles.sharedMediaPlayOverlay}>
                <MaterialCommunityIcons name="play-circle" size={48} color="rgba(255,255,255,0.7)" />
              </View>
            </View>
          )}
        </TouchableOpacity>
      )}

      {!isImage && !isVideo && (
        <View style={styles.sharedMediaDocPlaceholder}>
          <MaterialCommunityIcons name={getDocIcon(mime)} size={28} color={colors.textTertiary} />
          <Text style={styles.sharedMediaDocType}>
            {mime.split('/').pop()?.toUpperCase() || 'FILE'}
          </Text>
        </View>
      )}

      <View style={styles.sharedMediaInfoRow}>
        <View style={styles.sharedMediaInfo}>
          <Text style={styles.sharedItemName} numberOfLines={1}>
            {item.filename || 'Resource'}
          </Text>
          {item.notes && (
            <Text style={styles.sharedItemNotes} numberOfLines={1}>
              {item.notes}
            </Text>
          )}
        </View>
        <View style={styles.sharedMediaActions}>
          {isVideo && mediaUrl && (
            <>
              <IconButton
                icon="play-circle-outline"
                size={20}
                iconColor={colors.accent}
                onPress={handleVideoPress}
                style={{ margin: 0 }}
              />
              <IconButton
                icon="brush"
                size={18}
                iconColor={colors.accent}
                onPress={() =>
                  navigation.navigate(SCREENS.VIDEO_ANNOTATION, {
                    uploadId: item.upload_id,
                    videoUrl: item.url,
                    videoTitle: item.filename || 'Video',
                    targetType: 'client',
                    targetId: clientId,
                  })
                }
                style={{ margin: 0 }}
              />
            </>
          )}
          <IconButton
            icon="close-circle-outline"
            size={20}
            iconColor={colors.error}
            onPress={() => onUnshare(item.id)}
            style={{ margin: 0 }}
          />
        </View>
      </View>
    </View>
  );
};

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const SECTIONS = {
  ACTIVITY: 'activity',
  CURRICULUM: 'curriculum',
  RESOURCES: 'resources',
  REPORTS: 'reports',
  UPCOMING: 'upcoming',
  PAST: 'past',
};

const ClientDetailScreen = ({ route, navigation }) => {
  const { company } = useAuth();
  const { clientId } = route.params;

  const handleGoBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate(SCREENS.COACH_CLIENTS);
    }
  }, [navigation]);
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

  const renderBookingItem = (booking) => {
    const serviceName = Array.isArray(booking.services) && booking.services.length > 0
      ? booking.services.map((s) => s.name).join(', ')
      : booking.service?.name || 'Session';
    const coachName = Array.isArray(booking.coaches) && booking.coaches.length > 0
      ? booking.coaches.map((c) => `${c.first_name || ''} ${c.last_name || ''}`.trim()).join(', ')
      : null;
    const locationName = booking.location?.name || null;
    const startTime = booking.start_time;
    const dateDisplay = startTime
      ? formatDateInTz(startTime, company, 'short')
      : '';
    return (
      <View key={booking.id} style={styles.bookingItem}>
        <Text style={styles.bookingService}>{serviceName}</Text>
        <Text style={styles.bookingDate}>
          {dateDisplay}{startTime ? ` at ${formatTimeInTz(startTime, company)}` : ''}
        </Text>
        {(coachName || locationName) && (
          <Text style={styles.bookingDate}>
            {[coachName, locationName].filter(Boolean).join(' · ')}
          </Text>
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScreenHeader title="Client" onBack={handleGoBack} />
        <View style={globalStyles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const fullName = client
    ? `${client.first_name || ''} ${client.last_name || ''}`.trim()
    : 'Client';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title={fullName} onBack={handleGoBack} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileSection}>
          <Avatar uri={client?.avatar_url} name={fullName} size={72} />
          <Text style={styles.clientName}>{fullName}</Text>
          <Text style={styles.clientEmail}>{client?.email}</Text>
          {client?.membership?.is_active && (
            <View style={styles.membershipBadge}>
              <Text style={styles.membershipText}>
                {client.membership.plan?.name || 'Member'}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{upcomingBookings.length}</Text>
            <Text style={styles.statLabel}>Upcoming</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{pastBookings.length}</Text>
            <Text style={styles.statLabel}>Past Sessions</Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionButton}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('ScheduleTab', { screen: SCREENS.SERVICE_SELECTION, params: { bookingData: { client } } })}
          >
            <MaterialCommunityIcons name="plus-circle-outline" size={18} color={colors.accent} />
            <Text style={styles.actionButtonText}>Book Session</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            activeOpacity={0.7}
            onPress={() => dispatch({ type: CLIENT_DETAIL_ACTIONS.SET_SHOW_MEDIA_PICKER, payload: true })}
          >
            <MaterialCommunityIcons name="share-variant-outline" size={18} color={colors.info} />
            <Text style={styles.actionButtonText}>Share Resource</Text>
          </TouchableOpacity>
        </View>

        {/* Activity Feed — collapsible, lazy-loaded */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.collapsibleHeader}
            onPress={() => toggleSection(SECTIONS.ACTIVITY)}
            activeOpacity={0.7}
          >
            <View style={styles.collapsibleHeaderLeft}>
              <MaterialCommunityIcons name="newspaper-variant-outline" size={18} color={colors.accent} />
              <Text style={styles.sectionTitle}>Activity Feed</Text>
              {loadedSections[SECTIONS.ACTIVITY] && activitiesTotal > 0 && (
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{activitiesTotal}</Text>
                </View>
              )}
            </View>
            <MaterialCommunityIcons
              name={expandedSections[SECTIONS.ACTIVITY] ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={colors.textTertiary}
            />
          </TouchableOpacity>

          {expandedSections[SECTIONS.ACTIVITY] && (
            loadingSections[SECTIONS.ACTIVITY] ? (
              <View style={styles.sectionLoading}>
                <ActivityIndicator size="small" color={colors.accent} />
              </View>
            ) : activities.length === 0 ? (
              <View style={styles.emptyMini}>
                <Text style={styles.emptyMiniText}>No activity yet.</Text>
              </View>
            ) : (
              <>
                {activities.slice(0, 3).map((item) => (
                  <ActivityCard
                    key={item.id}
                    item={item}
                    company={company}
                    onPress={(pressed) => dispatch({ type: CLIENT_DETAIL_ACTIONS.SET_SELECTED_ACTIVITY, payload: pressed })}
                  />
                ))}
                {activitiesTotal > 3 && (
                  <TouchableOpacity
                    style={styles.showMoreButton}
                    onPress={() =>
                      navigation.navigate(SCREENS.CLIENT_ACTIVITY_FEED, {
                        clientId,
                        clientName: fullName,
                      })
                    }
                    activeOpacity={0.7}
                  >
                    <Text style={styles.showMoreText}>
                      View All Activity ({activitiesTotal})
                    </Text>
                    <MaterialCommunityIcons name="chevron-right" size={14} color={colors.accent} />
                  </TouchableOpacity>
                )}
              </>
            )
          )}
        </View>

        {/* Curriculum — collapsible, lazy-loaded */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.collapsibleHeader}
            onPress={() => toggleSection(SECTIONS.CURRICULUM)}
            activeOpacity={0.7}
          >
            <View style={styles.collapsibleHeaderLeft}>
              <MaterialCommunityIcons name="school-outline" size={18} color={colors.accent} />
              <Text style={styles.sectionTitle}>Curriculum</Text>
              {loadedSections[SECTIONS.CURRICULUM] && modules.length > 0 && (
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{modules.length}</Text>
                </View>
              )}
            </View>
            <View style={styles.collapsibleHeaderRight}>
              {expandedSections[SECTIONS.CURRICULUM] && (
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate(SCREENS.CURRICULUM_EDITOR, {
                      clientId,
                      clientName: fullName,
                    })
                  }
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.shareProgressText}>
                    {modules.length > 0 ? 'Edit' : 'Add'}
                  </Text>
                </TouchableOpacity>
              )}
              <MaterialCommunityIcons
                name={expandedSections[SECTIONS.CURRICULUM] ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={colors.textTertiary}
              />
            </View>
          </TouchableOpacity>

          {expandedSections[SECTIONS.CURRICULUM] && (
            loadingSections[SECTIONS.CURRICULUM] ? (
              <View style={styles.sectionLoading}>
                <ActivityIndicator size="small" color={colors.accent} />
              </View>
            ) : modules.length === 0 ? (
              <View style={styles.emptyMini}>
                <Text style={styles.emptyMiniText}>
                  No curriculum assigned. Tap "Add" to get started.
                </Text>
              </View>
            ) : (
              <>
                {(showAllModules ? modules : modules.slice(0, 3)).map((mod) => {
                  const lessons = mod.lessons || [];
                  const completed = lessons.filter((l) => l.completed).length;
                  return (
                    <TouchableRipple
                      key={mod.id}
                      style={styles.moduleItem}
                      onPress={() =>
                        navigation.navigate(SCREENS.CURRICULUM_EDITOR, {
                          clientId,
                          clientName: fullName,
                        })
                      }
                      borderless
                    >
                      <View>
                        <Text style={styles.moduleName}>{mod.title || mod.name}</Text>
                        <Text style={styles.moduleProgress}>
                          {completed} / {lessons.length} lessons
                        </Text>
                      </View>
                    </TouchableRipple>
                  );
                })}
                {modules.length > 3 && (
                  <TouchableOpacity
                    style={styles.showMoreButton}
                    onPress={() => dispatch({ type: CLIENT_DETAIL_ACTIONS.SET_SHOW_ALL_MODULES, payload: !showAllModules })}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.showMoreText}>
                      {showAllModules ? 'Show Less' : `Show ${modules.length - 3} More`}
                    </Text>
                    <MaterialCommunityIcons
                      name={showAllModules ? 'chevron-up' : 'chevron-down'}
                      size={14}
                      color={colors.accent}
                    />
                  </TouchableOpacity>
                )}
              </>
            )
          )}
        </View>

        {/* Shared Resources — collapsible, lazy-loaded */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.collapsibleHeader}
            onPress={() => toggleSection(SECTIONS.RESOURCES)}
            activeOpacity={0.7}
          >
            <View style={styles.collapsibleHeaderLeft}>
              <MaterialCommunityIcons name="folder-open-outline" size={18} color={colors.info} />
              <Text style={styles.sectionTitle}>Shared Resources</Text>
              {loadedSections[SECTIONS.RESOURCES] && sharedMedia.length > 0 && (
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{sharedMedia.length}</Text>
                </View>
              )}
            </View>
            <MaterialCommunityIcons
              name={expandedSections[SECTIONS.RESOURCES] ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={colors.textTertiary}
            />
          </TouchableOpacity>

          {expandedSections[SECTIONS.RESOURCES] && (
            loadingSections[SECTIONS.RESOURCES] ? (
              <View style={styles.sectionLoading}>
                <ActivityIndicator size="small" color={colors.accent} />
              </View>
            ) : sharedMedia.length === 0 ? (
              <View style={styles.emptyMini}>
                <Text style={styles.emptyMiniText}>No shared resources.</Text>
              </View>
            ) : (
              <>
                {sharedMedia.slice(0, 2).map((item) => (
                  <SharedMediaCard
                    key={item.id}
                    item={item}
                    navigation={navigation}
                    onUnshare={handleUnshare}
                    clientId={clientId}
                  />
                ))}
                {sharedMedia.length > 2 && (
                  <TouchableOpacity
                    style={styles.showMoreButton}
                    onPress={() =>
                      navigation.navigate(SCREENS.CLIENT_SHARED_MEDIA, {
                        clientId,
                        clientName: fullName,
                      })
                    }
                    activeOpacity={0.7}
                  >
                    <Text style={styles.showMoreText}>
                      Show All {sharedMedia.length} Resources
                    </Text>
                    <MaterialCommunityIcons name="chevron-right" size={14} color={colors.accent} />
                  </TouchableOpacity>
                )}
              </>
            )
          )}
        </View>

        {/* Progress Reports — collapsible, lazy-loaded */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.collapsibleHeader}
            onPress={() => toggleSection(SECTIONS.REPORTS)}
            activeOpacity={0.7}
          >
            <View style={styles.collapsibleHeaderLeft}>
              <MaterialCommunityIcons name="chart-bar" size={18} color={colors.accent} />
              <Text style={styles.sectionTitle}>Progress Reports</Text>
              {loadedSections[SECTIONS.REPORTS] && snapshots.length > 0 && (
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{snapshots.length}</Text>
                </View>
              )}
            </View>
            <View style={styles.collapsibleHeaderRight}>
              {expandedSections[SECTIONS.REPORTS] && (
                <TouchableOpacity
                  style={styles.shareProgressButton}
                  onPress={handleCreateSnapshot}
                  disabled={isCreatingSnapshot}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  {isCreatingSnapshot ? (
                    <ActivityIndicator size="small" color={colors.accent} />
                  ) : (
                    <>
                      <MaterialCommunityIcons name="share-variant-outline" size={14} color={colors.accent} />
                      <Text style={styles.shareProgressText}>Share</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
              <MaterialCommunityIcons
                name={expandedSections[SECTIONS.REPORTS] ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={colors.textTertiary}
              />
            </View>
          </TouchableOpacity>

          {expandedSections[SECTIONS.REPORTS] && (
            loadingSections[SECTIONS.REPORTS] ? (
              <View style={styles.sectionLoading}>
                <ActivityIndicator size="small" color={colors.accent} />
              </View>
            ) : snapshots.length === 0 ? (
              <View style={styles.emptyMini}>
                <Text style={styles.emptyMiniText}>
                  No progress reports yet. Tap "Share" to capture a snapshot.
                </Text>
              </View>
            ) : (
              snapshots.slice(0, 5).map((snap) => (
                <TouchableOpacity
                  key={snap.id}
                  style={styles.snapshotItem}
                  onPress={() =>
                    navigation.navigate(SCREENS.PROGRESS_REPORT_DETAIL, {
                      report: snap,
                    })
                  }
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="file-document-outline" size={18} color={colors.accent} />
                  <View style={styles.snapshotInfo}>
                    <Text style={styles.snapshotTitle}>
                      {snap.title || 'Progress Report'}
                    </Text>
                    <Text style={styles.snapshotDate}>
                      {new Date(snap.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={16} color={colors.textTertiary} />
                </TouchableOpacity>
              ))
            )
          )}
        </View>

        {/* Upcoming Bookings — collapsible, already loaded */}
        {upcomingBookings.length > 0 && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.collapsibleHeader}
              onPress={() => toggleSection(SECTIONS.UPCOMING)}
              activeOpacity={0.7}
            >
              <View style={styles.collapsibleHeaderLeft}>
                <MaterialCommunityIcons name="calendar-outline" size={18} color={colors.success} />
                <Text style={styles.sectionTitle}>Upcoming Bookings</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{upcomingBookings.length}</Text>
                </View>
              </View>
              <MaterialCommunityIcons
                name={expandedSections[SECTIONS.UPCOMING] ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={colors.textTertiary}
              />
            </TouchableOpacity>
            {expandedSections[SECTIONS.UPCOMING] && (
              upcomingBookings.map((booking) => renderBookingItem(booking))
            )}
          </View>
        )}

        {/* Past Bookings — collapsible, already loaded */}
        {pastBookings.length > 0 && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.collapsibleHeader}
              onPress={() => toggleSection(SECTIONS.PAST)}
              activeOpacity={0.7}
            >
              <View style={styles.collapsibleHeaderLeft}>
                <MaterialCommunityIcons name="clock-outline" size={18} color={colors.textTertiary} />
                <Text style={styles.sectionTitle}>Recent Bookings</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{pastBookings.length}</Text>
                </View>
              </View>
              <MaterialCommunityIcons
                name={expandedSections[SECTIONS.PAST] ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={colors.textTertiary}
              />
            </TouchableOpacity>
            {expandedSections[SECTIONS.PAST] && (
              pastBookings.map((booking) => renderBookingItem(booking))
            )}
          </View>
        )}
      </ScrollView>

      <MediaPickerModal
        visible={showMediaPicker}
        onClose={() => dispatch({ type: CLIENT_DETAIL_ACTIONS.SET_SHOW_MEDIA_PICKER, payload: false })}
        onSelect={handleShareMedia}
        alreadySharedIds={sharedMedia.map((m) => m.upload_id)}
        isSharing={isSharing}
      />

      <ActivityDetailSheet
        item={selectedActivity}
        visible={!!selectedActivity}
        onClose={() => dispatch({ type: CLIENT_DETAIL_ACTIONS.SET_SELECTED_ACTIVITY, payload: null })}
      />

      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => dispatch({ type: CLIENT_DETAIL_ACTIONS.DISMISS_SNACKBAR })}
        duration={3000}
        action={{ label: 'Undo', onPress: handleUndoUnshare }}
        style={styles.snackbar}
      >
        {snackbar.message}
      </Snackbar>
    </SafeAreaView>
  );
};

export default ClientDetailScreen;
