import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ScreenHeader from '../../components/ScreenHeader';
import EmptyState from '../../components/EmptyState';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../../services/notifications.api';
import { notificationsStyles as styles } from '../../styles/notifications.styles';
import { globalStyles } from '../../styles/global.styles';
import { colors } from '../../theme';

const ICON_MAP = {
  booking: 'calendar',
  video: 'videocam',
  membership: 'card',
  progress: 'trending-up',
  message: 'chatbubble',
  default: 'notifications',
};

const NotificationsScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadNotifications = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setIsRefreshing(true);
      else setIsLoading(true);

      const { data } = await getNotifications();
      setNotifications(data || []);
    } catch {
      setNotifications([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkRead = useCallback(async (notification) => {
    if (notification.read_at) return;
    try {
      await markNotificationRead(notification.id);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id ? { ...n, read_at: new Date().toISOString() } : n
        )
      );
    } catch (err) {
      console.warn('Failed to mark notification as read:', err.message);
    }
  }, []);

  const handleMarkAllRead = useCallback(async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
      );
    } catch (err) {
      console.warn('Failed to mark all notifications as read:', err.message);
    }
  }, []);

  const getTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const hasUnread = notifications.some((n) => !n.read_at);

  const renderNotification = ({ item }) => {
    const isUnread = !item.read_at;
    const iconName = ICON_MAP[item.data?.type] || ICON_MAP.default;

    return (
      <TouchableOpacity
        style={[
          styles.notificationItem,
          isUnread && styles.notificationUnread,
        ]}
        onPress={() => handleMarkRead(item)}
        activeOpacity={0.7}
      >
        <View style={styles.notificationRow}>
          <View style={styles.iconContainer}>
            <Ionicons name={iconName} size={18} color={colors.primary} />
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
      </TouchableOpacity>
    );
  };

  const rightAction = hasUnread ? (
    <TouchableOpacity style={styles.markAllButton} onPress={handleMarkAllRead}>
      <Text style={styles.markAllText}>Read All</Text>
    </TouchableOpacity>
  ) : undefined;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader
        title="Notifications"
        onBack={() => navigation.goBack()}
        rightAction={rightAction}
      />

      {isLoading ? (
        <View style={globalStyles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={[
            styles.listContent,
            notifications.length === 0 && { flex: 1 },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => loadNotifications(true)}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="notifications-off-outline"
              title="No Notifications"
              message="You're all caught up."
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

export default NotificationsScreen;
