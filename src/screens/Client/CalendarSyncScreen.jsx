import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, Alert } from 'react-native';
import {
  Text,
  Surface,
  Switch,
  Button,
  TextInput,
  ActivityIndicator,
  List,
  Chip,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import * as WebBrowser from 'expo-web-browser';
import ScreenHeader from '../../components/ScreenHeader';
import { globalStyles } from '../../styles/global.styles';
import { calendarSyncStyles as styles } from '../../styles/calendarSync.styles';
import { colors } from '../../theme';
import {
  getCalendarSyncStatus,
  enableCalendarFeed,
  disableCalendarFeed,
  regenerateCalendarFeed,
  getGoogleCalendarRedirectUrl,
  disconnectGoogleCalendar,
  syncAllToGoogleCalendar,
} from '../../services/calendarSync.api';
import logger from '../../helpers/logger.helper';

const CalendarSyncScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [feedEnabled, setFeedEnabled] = useState(false);
  const [feedUrl, setFeedUrl] = useState('');
  const [googleConnected, setGoogleConnected] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleError, setGoogleError] = useState('');
  const [syncing, setSyncing] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      setFetchError(false);
      const result = await getCalendarSyncStatus();
      if (result?.data) {
        setFeedEnabled(result.data.feed?.enabled || false);
        setFeedUrl(result.data.feed?.url || '');
        setGoogleConnected(result.data.google?.connected || false);
        setGoogleEmail(result.data.google?.email || '');
        setGoogleError(result.data.google?.last_error || '');
      }
    } catch (error) {
      logger.warn('Failed to fetch calendar sync status', error);
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleFeedToggle = async (value) => {
    try {
      if (value) {
        const result = await enableCalendarFeed();
        setFeedEnabled(true);
        setFeedUrl(result?.data?.url || '');
      } else {
        await disableCalendarFeed();
        setFeedEnabled(false);
        setFeedUrl('');
      }
    } catch {
      Alert.alert('Error', 'Failed to update calendar feed');
    }
  };

  const handleCopyUrl = async () => {
    if (feedUrl) {
      await Clipboard.setStringAsync(feedUrl);
      Alert.alert('Copied', 'Feed URL copied to clipboard');
    }
  };

  const handleRegenerate = () => {
    Alert.alert(
      'Regenerate Feed URL',
      'This will invalidate your current feed URL. Any calendar apps using the old URL will stop updating. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Regenerate',
          onPress: async () => {
            try {
              const result = await regenerateCalendarFeed();
              setFeedUrl(result?.data?.url || '');
            } catch {
              Alert.alert('Error', 'Failed to regenerate feed URL');
            }
          },
        },
      ]
    );
  };

  const handleGoogleConnect = async () => {
    try {
      const result = await getGoogleCalendarRedirectUrl({
        original_domain: '__mobile_app__',
        return_url: '/calendar-sync/callback',
      });
      if (result?.redirect_url) {
        await WebBrowser.openBrowserAsync(result.redirect_url);
        // Refresh status after browser closes
        fetchStatus();
      }
    } catch {
      Alert.alert('Error', 'Failed to start Google Calendar connection');
    }
  };

  const handleGoogleDisconnect = () => {
    Alert.alert(
      'Disconnect Google Calendar',
      'Bookings will no longer sync to your Google Calendar. Existing synced events will remain.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              await disconnectGoogleCalendar();
              setGoogleConnected(false);
              setGoogleEmail('');
              setGoogleError('');
            } catch {
              Alert.alert('Error', 'Failed to disconnect Google Calendar');
            }
          },
        },
      ]
    );
  };

  const handleSyncAll = async () => {
    try {
      setSyncing(true);
      const result = await syncAllToGoogleCalendar();
      const count = result?.data?.bookings_queued || 0;
      Alert.alert('Sync Started', `${count} booking${count !== 1 ? 's' : ''} queued for sync`);
    } catch {
      Alert.alert('Error', 'Failed to sync bookings');
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={globalStyles.loadingContainer} edges={['top']}>
        <ScreenHeader title="Calendar Sync" onBack={() => navigation.goBack()} />
        <ActivityIndicator size="large" style={styles.loadingIndicator} />
      </SafeAreaView>
    );
  }

  if (fetchError) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScreenHeader title="Calendar Sync" onBack={() => navigation.goBack()} />
        <View style={styles.scrollContent}>
          <Surface style={styles.surface} elevation={1}>
            <Text variant="bodyMedium" style={styles.sectionDescription}>
              Failed to load calendar sync settings.
            </Text>
            <Button mode="outlined" icon="refresh" onPress={fetchStatus}>
              Retry
            </Button>
          </Surface>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="Calendar Sync" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* ICS Feed Section */}
        <Surface style={styles.surface} elevation={1}>
          <List.Item
            title="Calendar Subscription Feed"
            description="Subscribe from Google Calendar, Apple Calendar, Outlook, or any calendar app"
            right={() => (
              <Switch value={feedEnabled} onValueChange={handleFeedToggle} />
            )}
          />

          {feedEnabled && feedUrl ? (
            <View style={styles.feedUrlContainer}>
              <TextInput
                mode="outlined"
                value={feedUrl}
                editable={false}
                dense
                style={styles.feedUrlInput}
              />
              <View style={styles.buttonRow}>
                <Button mode="outlined" icon="content-copy" compact onPress={handleCopyUrl}>
                  Copy URL
                </Button>
                <Button mode="text" compact onPress={handleRegenerate}>
                  Regenerate
                </Button>
              </View>
            </View>
          ) : null}
        </Surface>

        {/* Google Calendar Section */}
        <Surface style={styles.surface} elevation={1}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Google Calendar
          </Text>
          <Text variant="bodySmall" style={styles.sectionDescription}>
            Connect for real-time sync. New bookings, changes, and cancellations are pushed instantly.
          </Text>

          {googleConnected ? (
            <View style={styles.connectedSection}>
              <View style={styles.chipRow}>
                <Chip icon="check-circle" mode="flat" compact>Connected</Chip>
                <Text variant="bodySmall" style={styles.emailText}>{googleEmail}</Text>
              </View>
              {googleError ? (
                <View style={styles.chipRow}>
                  <Chip icon="alert-circle" mode="flat" compact>Sync Error</Chip>
                  <Text variant="bodySmall" style={styles.errorText}>{googleError}</Text>
                </View>
              ) : null}
              <View style={styles.buttonRow}>
                <Button
                  mode="outlined"
                  icon="sync"
                  compact
                  loading={syncing}
                  onPress={handleSyncAll}
                >
                  Sync All
                </Button>
                <Button
                  mode="outlined"
                  icon="link-off"
                  compact
                  onPress={handleGoogleDisconnect}
                  textColor={colors.error}
                >
                  Disconnect
                </Button>
              </View>
            </View>
          ) : (
            <Button mode="contained" icon="google" onPress={handleGoogleConnect}>
              Connect Google Calendar
            </Button>
          )}
        </Surface>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CalendarSyncScreen;
