import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  UIManager,
  Platform,
} from 'react-native';
import { Snackbar, Button, TouchableRipple } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ScreenHeader from '../../components/ScreenHeader';
import { DetailSkeleton } from '../../components/SkeletonLoader';
import Avatar from '../../components/Avatar';
import MediaPickerModal from '../../components/MediaPickerModal';
import ActivityCard from '../../components/ActivityCard';
import ActivityDetailSheet from '../../components/ActivityDetailSheet';
import SharedMediaCard from '../../components/SharedMediaCard';
import { SCREENS } from '../../constants/navigation.constants';
import { clientDetailStyles as styles } from '../../styles/clientDetail.styles';
import { formatTimeInTz, formatDateInTz } from '../../helpers/timezone.helper';
import useAuth from '../../hooks/useAuth';
import useClientDetail from '../../hooks/useClientDetail';
import { colors } from '../../theme';
import { CLIENT_DETAIL_ACTIONS } from '../../reducers/clientDetail.reducer';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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

  const {
    client, modules, upcomingBookings, pastBookings, sharedMedia, snapshots,
    activities, activitiesTotal, isLoading, isRefreshing, showMediaPicker,
    isSharing, isCreatingSnapshot, showAllModules, selectedActivity, snackbar,
    expandedSections, loadedSections, loadingSections,
    dispatch, toggleSection, handleRefresh, handleShareMedia,
    handleCreateSnapshot, handleOpenMarshal, handleUnshare, handleUndoUnshare,
    SECTIONS,
  } = useClientDetail({ clientId, navigation, company });

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
        <DetailSkeleton />
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
        <View style={styles.marshalActionWrap}>
          <Button
            mode="contained-tonal"
            icon="robot-outline"
            onPress={handleOpenMarshal}
            style={styles.marshalButton}
            contentStyle={styles.marshalButtonContent}
            labelStyle={styles.marshalButtonLabel}
          >
            Ask Marshal About This Client
          </Button>
        </View>

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
