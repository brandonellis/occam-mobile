import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, TouchableRipple } from 'react-native-paper';
import ScreenHeader from '../../components/ScreenHeader';
import EmptyState from '../../components/EmptyState';
import { SCREENS } from '../../constants/navigation.constants';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../../services/notifications.api';
import { getTimeAgo } from '../../helpers/date.helper';
import { notificationsStyles as styles } from '../../styles/notifications.styles';
import { ListSkeleton } from '../../components/SkeletonLoader';
import { colors } from '../../theme';
import useUnreadNotifications from '../../hooks/useUnreadNotifications';
import logger from '../../helpers/logger.helper';

const ICON_MAP = {
  booking: 'calendar',
  video: 'video',
  membership: 'credit-card-outline',
  progress: 'trending-up',
  message: 'chat',
  default: 'bell',
};

const PER_PAGE = 25;

const NotificationItem = React.memo(({ item, onPress }) => {
  const isUnread = !item.read_at;
  const iconName = ICON_MAP[item.data?.type] || ICON_MAP.default;

  return (
    <TouchableRipple
      style={[
        styles.notificationItem,
        isUnread && styles.notificationUnread,
      ]}
      onPress={() => onPress(item)}
      borderless
    >
      <View style={styles.notificationRow}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons name={iconName} size={18} color={colors.primary} />
        </View>
        <View style={styles.notificationContent}>
          <Text style={styles.notificationTitle}>
            {item.data?.title || 'Notification'}
          </Text>
          {item.data?.body && (
            <Text style={styles.notificationBody} numberOfLines={2}>
              {item.data.body}
            </Text>
          )}
          <Text style={styles.notificationTime}>
            {getTimeAgo(item.created_at)}
          </Text>
        </View>
        {isUnread && <View style={styles.unreadDot} />}
      </View>
    </TouchableRipple>
  );
});

const NotificationsScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [error, setError] = useState(null);
  const { refresh: refreshBadge } = useUnreadNotifications();

  const loadNotifications = useCallback(async ({ showRefresh = false, page = 1, append = false } = {}) => {
    try {
      if (showRefresh) setIsRefreshing(true);
      else if (append) setIsLoadingMore(true);
      else setIsLoading(true);

      const result = await getNotifications({ page, per_page: PER_PAGE });
      const data = result?.data || [];
      const pagination = result?.pagination;

      setNotifications((prev) => append ? [...prev, ...data] : data);
      if (pagination) {
        setCurrentPage(pagination.current_page);
        setLastPage(pagination.last_page);
      }
      setError(null);
    } catch (err) {
      if (!append) setNotifications([]);
      setError('Unable to load notifications. Pull down to retry.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
    }
  }, []);

  const handleLoadMore = useCallback(() => {
    if (isLoadingMore || currentPage >= lastPage) return;
    loadNotifications({ page: currentPage + 1, append: true });
  }, [isLoadingMore, currentPage, lastPage, loadNotifications]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkRead = useCallback(async (notification) => {
    if (!notification.read_at) {
      try {
        await markNotificationRead(notification.id);
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, read_at: new Date().toISOString() } : n
          )
        );
        refreshBadge({ force: true });
      } catch (err) {
        logger.warn('Failed to mark notification as read:', err.message);
      }
    }

    // Navigate based on notification data
    const data = notification.data;
    if (data?.booking_id) {
      navigation.navigate(SCREENS.BOOKING_DETAIL, { bookingId: data.booking_id });
    }
  }, [navigation, refreshBadge]);

  const handleMarkAllRead = useCallback(async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
      );
      refreshBadge({ force: true });
    } catch (err) {
      logger.warn('Failed to mark all notifications as read:', err.message);
    }
  }, [refreshBadge]);

  const hasUnread = notifications.some((n) => !n.read_at);

  const renderNotification = useCallback(({ item }) => (
    <NotificationItem item={item} onPress={handleMarkRead} />
  ), [handleMarkRead]);

  const keyExtractor = useCallback((item) => String(item.id), []);

  const rightAction = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      {hasUnread && (
        <TouchableOpacity style={styles.markAllButton} onPress={handleMarkAllRead}>
          <Text style={styles.markAllText}>Read All</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity
        style={{ padding: 4, minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
        onPress={() => navigation.navigate(SCREENS.NOTIFICATION_PREFERENCES)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <MaterialCommunityIcons name="cog-outline" size={22} color={colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader
        title="Notifications"
        onBack={() => navigation.goBack()}
        rightAction={rightAction}
      />

      {isLoading ? (
        <ListSkeleton count={5} />
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={keyExtractor}
          contentContainerStyle={[
            styles.listContent,
            notifications.length === 0 && { flex: 1 },
          ]}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => loadNotifications({ showRefresh: true })}
              tintColor={colors.primary}
            />
          }
          ListFooterComponent={
            isLoadingMore ? (
              <View style={{ paddingVertical: 16, alignItems: 'center' }}>
                <Text variant="bodySmall" style={{ color: colors.textSecondary }}>Loading more...</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            error ? (
              <EmptyState
                icon="alert-circle-outline"
                title="Something Went Wrong"
                message={error}
              />
            ) : (
              <EmptyState
                icon="bell-off-outline"
                title="No Notifications"
                message="You're all caught up."
              />
            )
          }
        />
      )}
    </SafeAreaView>
  );
};

export default NotificationsScreen;
