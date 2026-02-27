import React, { useEffect, useCallback, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Image,
  LayoutAnimation,
  UIManager,
  Platform,
} from 'react-native';
import { Snackbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ScreenHeader from '../../components/ScreenHeader';
import Avatar from '../../components/Avatar';
import MediaPickerModal from '../../components/MediaPickerModal';
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
import { clientDetailStyles as styles } from '../../styles/clientDetail.styles';
import { globalStyles } from '../../styles/global.styles';
import { formatTimeInTz, formatDateInTz } from '../../helpers/timezone.helper';
import useAuth from '../../hooks/useAuth';
import { colors } from '../../theme';
import { resolveMediaUrl } from '../../helpers/media.helper';
import AuthImage from '../../components/AuthImage';

const getDocIcon = (mime) => {
  if (mime.startsWith('application/pdf')) return 'document-text';
  if (mime.includes('spreadsheet') || mime.includes('excel')) return 'grid';
  if (mime.includes('presentation') || mime.includes('powerpoint')) return 'easel';
  return 'document';
};

const SharedMediaCard = ({ item, navigation, onUnshare }) => {
  const mime = item.mime_type || '';
  const isVideo = mime.startsWith('video/');
  const isImage = mime.startsWith('image/');
  const mediaUrl = resolveMediaUrl(item.url);
  const thumbUrl = resolveMediaUrl(item.thumbnail_url);

  const handleVideoPress = () => {
    if (mediaUrl) {
      navigation.navigate(SCREENS.VIDEO_PLAYER, {
        videoUrl: mediaUrl,
        videoTitle: item.filename || 'Video',
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
                <Ionicons name="play-circle" size={48} color="rgba(255,255,255,0.9)" />
              </View>
            </View>
          ) : (
            <View style={styles.sharedMediaVideoPlaceholder}>
              <Ionicons name="videocam" size={28} color={colors.textTertiary} />
              <View style={styles.sharedMediaPlayOverlay}>
                <Ionicons name="play-circle" size={48} color="rgba(255,255,255,0.7)" />
              </View>
            </View>
          )}
        </TouchableOpacity>
      )}

      {!isImage && !isVideo && (
        <View style={styles.sharedMediaDocPlaceholder}>
          <Ionicons name={getDocIcon(mime)} size={28} color={colors.textTertiary} />
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
              <TouchableOpacity
                onPress={handleVideoPress}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="play-circle-outline" size={20} color={colors.accent} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate(SCREENS.VIDEO_ANNOTATION, {
                    uploadId: item.upload_id,
                    videoUrl: mediaUrl,
                    videoTitle: item.filename || 'Video',
                  })
                }
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="brush-outline" size={18} color={colors.accent} />
              </TouchableOpacity>
            </>
          )}
          <TouchableOpacity
            onPress={() => onUnshare(item.id)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close-circle-outline" size={20} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const ClientDetailScreen = ({ route, navigation }) => {
  const { company } = useAuth();
  const { clientId } = route.params;
  const [client, setClient] = useState(null);
  const [modules, setModules] = useState([]);
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [pastBookings, setPastBookings] = useState([]);
  const [sharedMedia, setSharedMedia] = useState([]);
  const [snapshots, setSnapshots] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isCreatingSnapshot, setIsCreatingSnapshot] = useState(false);
  const [showAllModules, setShowAllModules] = useState(false);
  const [snackbar, setSnackbar] = useState({ visible: false, message: '', undoData: null });
  const undoTimerRef = useRef(null);

  const loadData = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setIsRefreshing(true);
      else setIsLoading(true);

      const [clientRes, curriculumRes, bookingsRes, sharedRes, snapshotsRes] = await Promise.allSettled([
        getClient(clientId),
        getClientPerformanceCurriculum(clientId),
        getBookings({ client_id: clientId, per_page: 25, status: 'all' }),
        getClientSharedMedia(clientId),
        getClientPerformanceSnapshots(clientId),
      ]);

      if (clientRes.status === 'fulfilled') {
        setClient(clientRes.value.data);
      }
      if (curriculumRes.status === 'fulfilled') {
        const data = curriculumRes.value.data;
        setModules(data?.modules || data || []);
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
        setUpcomingBookings(upcoming.slice(0, 5));
        setPastBookings(past.slice(0, 5));
      }
      if (sharedRes.status === 'fulfilled') {
        setSharedMedia(sharedRes.value.data || []);
      }
      if (snapshotsRes.status === 'fulfilled') {
        setSnapshots(snapshotsRes.value.data || []);
      }
    } catch (err) {
      console.warn('Failed to load client data:', err.message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [clientId]);

  // Load on mount + refresh when returning from curriculum editor or other screens
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });
    return unsubscribe;
  }, [navigation, loadData]);

  const handleShareMedia = useCallback(async ({ upload_id, notes }) => {
    setIsSharing(true);
    try {
      await shareMediaWithClient(clientId, { upload_id, notes });
      setShowMediaPicker(false);
      loadData(true);
    } catch (err) {
      const msg = err.response?.status === 409
        ? 'This resource is already shared with this client.'
        : err.response?.data?.message || 'Failed to share resource.';
      Alert.alert('Error', msg);
    } finally {
      setIsSharing(false);
    }
  }, [clientId, loadData]);

  const handleCreateSnapshot = useCallback(() => {
    Alert.alert(
      'Share Progress Report',
      'This will capture a snapshot of the client\'s current curriculum progress and assessment scores, then share it with the client.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Share',
          onPress: async () => {
            setIsCreatingSnapshot(true);
            try {
              await createPerformanceSnapshot(clientId);
              Alert.alert('Success', 'Progress report shared with client.');
              loadData(true);
            } catch (err) {
              Alert.alert(
                'Error',
                err.response?.data?.message || 'Failed to create progress report.'
              );
            } finally {
              setIsCreatingSnapshot(false);
            }
          },
        },
      ]
    );
  }, [clientId, loadData]);

  const handleUnshare = useCallback((sharedMediaId) => {
    // Find the item being removed so we can restore on undo
    const removedItem = sharedMedia.find((m) => m.id === sharedMediaId);
    if (!removedItem) return;

    // Optimistic removal with smooth animation
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSharedMedia((prev) => prev.filter((m) => m.id !== sharedMediaId));

    // Clear any pending undo timer from a previous removal
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);

    // Show undo snackbar
    setSnackbar({
      visible: true,
      message: 'Resource removed',
      undoData: { sharedMediaId, removedItem },
    });

    // Fire the API delete after a short delay to allow undo
    undoTimerRef.current = setTimeout(async () => {
      try {
        await unshareMediaFromClient(clientId, sharedMediaId);
      } catch (err) {
        console.warn('Failed to unshare media:', err.message);
        // Restore the item on failure
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setSharedMedia((prev) => [...prev, removedItem].sort((a, b) => b.id - a.id));
        setSnackbar({ visible: false, message: '', undoData: null });
        Alert.alert('Error', 'Failed to remove shared resource.');
      }
    }, 3500);
  }, [clientId, sharedMedia]);

  const handleUndoUnshare = useCallback(() => {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    const { undoData } = snackbar;
    if (undoData?.removedItem) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setSharedMedia((prev) =>
        [...prev, undoData.removedItem].sort((a, b) => b.id - a.id)
      );
    }
    setSnackbar({ visible: false, message: '', undoData: null });
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
        <ScreenHeader title="Client" onBack={() => navigation.goBack()} />
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
      <ScreenHeader title={fullName} onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadData(true)}
            tintColor={colors.primary}
          />
        }
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
            <Text style={styles.statValue}>{modules.length}</Text>
            <Text style={styles.statLabel}>Modules</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{upcomingBookings.length}</Text>
            <Text style={styles.statLabel}>Upcoming</Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          {!!client?.membership?.is_active && (
            <TouchableOpacity
              style={styles.actionButton}
              activeOpacity={0.7}
              onPress={() => navigation.navigate(SCREENS.LOCATION_SELECTION, { bookingData: { client } })}
            >
              <Ionicons name="add-circle-outline" size={18} color={colors.accent} />
              <Text style={styles.actionButtonText}>Book Session</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.actionButton}
            activeOpacity={0.7}
            onPress={() => setShowMediaPicker(true)}
          >
            <Ionicons name="share-outline" size={18} color={colors.info} />
            <Text style={styles.actionButtonText}>Share Resource</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Curriculum</Text>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate(SCREENS.CURRICULUM_EDITOR, {
                  clientId,
                  clientName: fullName,
                })
              }
              activeOpacity={0.7}
            >
              <Text style={styles.shareProgressText}>
                {modules.length > 0 ? 'Edit' : 'Add'}
              </Text>
            </TouchableOpacity>
          </View>
          {modules.length === 0 ? (
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
                  <TouchableOpacity
                    key={mod.id}
                    style={styles.moduleItem}
                    onPress={() =>
                      navigation.navigate(SCREENS.CURRICULUM_EDITOR, {
                        clientId,
                        clientName: fullName,
                      })
                    }
                    activeOpacity={0.7}
                  >
                    <Text style={styles.moduleName}>{mod.title || mod.name}</Text>
                    <Text style={styles.moduleProgress}>
                      {completed} / {lessons.length} lessons
                    </Text>
                  </TouchableOpacity>
                );
              })}
              {modules.length > 3 && (
                <TouchableOpacity
                  style={styles.showMoreButton}
                  onPress={() => setShowAllModules((prev) => !prev)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.showMoreText}>
                    {showAllModules ? 'Show Less' : `Show ${modules.length - 3} More`}
                  </Text>
                  <Ionicons
                    name={showAllModules ? 'chevron-up' : 'chevron-down'}
                    size={14}
                    color={colors.accent}
                  />
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        {sharedMedia.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Shared Resources</Text>
            {sharedMedia.slice(0, 2).map((item) => (
              <SharedMediaCard
                key={item.id}
                item={item}
                navigation={navigation}
                onUnshare={handleUnshare}
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
                <Ionicons name="chevron-forward" size={14} color={colors.accent} />
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Progress Reports</Text>
            <TouchableOpacity
              style={styles.shareProgressButton}
              onPress={handleCreateSnapshot}
              disabled={isCreatingSnapshot}
              activeOpacity={0.7}
            >
              {isCreatingSnapshot ? (
                <ActivityIndicator size="small" color={colors.accent} />
              ) : (
                <>
                  <Ionicons name="share-outline" size={14} color={colors.accent} />
                  <Text style={styles.shareProgressText}>Share Progress</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
          {snapshots.length === 0 ? (
            <View style={styles.emptyMini}>
              <Text style={styles.emptyMiniText}>
                No progress reports yet. Tap "Share Progress" to capture a snapshot of curriculum and assessment data to share with the client.
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
                <Ionicons name="document-text-outline" size={18} color={colors.accent} />
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
                <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
              </TouchableOpacity>
            ))
          )}
        </View>

        {upcomingBookings.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Upcoming Bookings</Text>
            {upcomingBookings.map((booking) => renderBookingItem(booking))}
          </View>
        )}

        {pastBookings.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Bookings</Text>
            {pastBookings.map((booking) => renderBookingItem(booking))}
          </View>
        )}
      </ScrollView>

      <MediaPickerModal
        visible={showMediaPicker}
        onClose={() => setShowMediaPicker(false)}
        onSelect={handleShareMedia}
        alreadySharedIds={sharedMedia.map((m) => m.upload_id)}
        isSharing={isSharing}
      />

      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar({ visible: false, message: '', undoData: null })}
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
