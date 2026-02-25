import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Image,
} from 'react-native';
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
import { formatTime } from '../../constants/booking.constants';
import { colors } from '../../theme';

const ClientDetailScreen = ({ route, navigation }) => {
  const { clientId } = route.params;
  const [client, setClient] = useState(null);
  const [modules, setModules] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [sharedMedia, setSharedMedia] = useState([]);
  const [snapshots, setSnapshots] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isCreatingSnapshot, setIsCreatingSnapshot] = useState(false);

  const loadData = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setIsRefreshing(true);
      else setIsLoading(true);

      const [clientRes, curriculumRes, bookingsRes, sharedRes, snapshotsRes] = await Promise.allSettled([
        getClient(clientId),
        getClientPerformanceCurriculum(clientId),
        getBookings({ client_id: clientId, limit: 5 }),
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
        setRecentBookings(bookingsRes.value.data || []);
      }
      if (sharedRes.status === 'fulfilled') {
        setSharedMedia(sharedRes.value.data || []);
      }
      if (snapshotsRes.status === 'fulfilled') {
        setSnapshots(snapshotsRes.value.data || []);
      }
    } catch {
      // Partial data is fine
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

  const handleCreateSnapshot = useCallback(async () => {
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
  }, [clientId, loadData]);

  const handleUnshare = useCallback(async (sharedMediaId) => {
    Alert.alert('Remove Resource', 'Unshare this resource from the client?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await unshareMediaFromClient(clientId, sharedMediaId);
            loadData(true);
          } catch {
            Alert.alert('Error', 'Failed to remove shared resource.');
          }
        },
      },
    ]);
  }, [clientId, loadData]);

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
          {client?.membership && (
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
            <Text style={styles.statValue}>{recentBookings.length}</Text>
            <Text style={styles.statLabel}>Bookings</Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionButton}
            activeOpacity={0.7}
            onPress={() => navigation.navigate(SCREENS.LOCATION_SELECTION, { bookingData: { client } })}
          >
            <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
            <Text style={styles.actionButtonText}>Book Session</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            activeOpacity={0.7}
            onPress={() => setShowMediaPicker(true)}
          >
            <Ionicons name="share-outline" size={18} color={colors.primary} />
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
            modules.slice(0, 3).map((mod) => {
              const lessons = mod.lessons || [];
              const completed = lessons.filter(
                (l) => l.completed_at || l.is_completed
              ).length;
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
                  <Text style={styles.moduleName}>{mod.name}</Text>
                  <Text style={styles.moduleProgress}>
                    {completed} / {lessons.length} lessons
                  </Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {sharedMedia.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Shared Resources</Text>
            {sharedMedia.map((item) => (
              <View key={item.id} style={styles.sharedItem}>
                <View style={styles.sharedItemContent}>
                  {item.upload?.thumb_url || (item.upload?.url && item.upload?.mime_type?.startsWith('image/')) ? (
                    <Image
                      source={{ uri: item.upload.thumb_url || item.upload.url }}
                      style={styles.sharedItemThumb}
                    />
                  ) : (
                    <View style={styles.sharedItemThumbPlaceholder}>
                      <Ionicons
                        name={item.upload?.mime_type?.startsWith('video/') ? 'videocam' : 'document'}
                        size={18}
                        color={colors.textTertiary}
                      />
                    </View>
                  )}
                  <View style={styles.sharedItemInfo}>
                    <Text style={styles.sharedItemName} numberOfLines={1}>
                      {item.upload?.original_filename || 'Resource'}
                    </Text>
                    {item.notes && (
                      <Text style={styles.sharedItemNotes} numberOfLines={1}>
                        {item.notes}
                      </Text>
                    )}
                  </View>
                </View>
                <View style={styles.sharedMediaActions}>
                  {item.upload?.mime_type?.startsWith('video/') && (
                    <TouchableOpacity
                      onPress={() =>
                        navigation.navigate(SCREENS.VIDEO_ANNOTATION, {
                          uploadId: item.upload.id,
                          videoUrl: item.upload.url,
                          videoTitle: item.upload.original_filename || 'Video',
                        })
                      }
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="brush-outline" size={18} color={colors.accent} />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    onPress={() => handleUnshare(item.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="close-circle-outline" size={20} color={colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
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
                No progress reports yet. Tap "Share Progress" to create one.
              </Text>
            </View>
          ) : (
            snapshots.slice(0, 5).map((snap) => (
              <View key={snap.id} style={styles.snapshotItem}>
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
              </View>
            ))
          )}
        </View>

        {recentBookings.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Bookings</Text>
            {recentBookings.map((booking) => (
              <View key={booking.id} style={styles.bookingItem}>
                <Text style={styles.bookingService}>
                  {booking.service?.name || 'Session'}
                </Text>
                <Text style={styles.bookingDate}>
                  {booking.date &&
                    new Date(booking.date + 'T00:00:00').toLocaleDateString(
                      'en-US',
                      { month: 'short', day: 'numeric' }
                    )}{' '}
                  {booking.start_time ? `at ${formatTime(booking.start_time)}` : ''}
                </Text>
              </View>
            ))}
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
    </SafeAreaView>
  );
};

export default ClientDetailScreen;
