import React, { useEffect, useCallback, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Switch, Snackbar } from 'react-native-paper';
import ScreenHeader from '../../components/ScreenHeader';
import { ListSkeleton } from '../../components/SkeletonLoader';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from '../../services/notifications.api';
import { notificationPreferencesStyles as styles } from '../../styles/notificationPreferences.styles';
import { colors } from '../../theme';
import logger from '../../helpers/logger.helper';

const EVENT_LABELS = {
  booking_confirmed: 'Booking Confirmed',
  booking_cancelled: 'Booking Cancelled',
  booking_reminder: 'Booking Reminder',
  booking_payment_requested: 'Payment Requested',
  waitlist_available: 'Waitlist Spot Available',
  class_cancelled: 'Class Cancelled',
  membership_welcome: 'Membership Welcome',
  membership_cancelled: 'Membership Cancelled',
  membership_renewal_reminder: 'Renewal Reminder',
  content_shared: 'Content Shared',
  progress_report: 'Progress Report',
};

const CHANNELS = [
  { key: 'in_app', label: 'App' },
  { key: 'push', label: 'Push' },
  { key: 'email', label: 'Email' },
];

const NotificationPreferencesScreen = ({ navigation }) => {
  const [preferences, setPreferences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const fetchPreferences = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getNotificationPreferences();
      setPreferences(result?.data || []);
    } catch (err) {
      logger.warn('Failed to load notification preferences:', err?.message);
      setError('Failed to load preferences');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const handleToggle = async (eventType, channel, value) => {
    const updated = preferences.map((p) =>
      p.event_type === eventType ? { ...p, [channel]: value } : p
    );
    setPreferences(updated);

    setSaving(true);
    try {
      await updateNotificationPreferences(updated);
    } catch (err) {
      logger.warn('Failed to save notification preference:', err?.message);
      setError('Failed to save preference');
      fetchPreferences();
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="Notification Settings" navigation={navigation} />
      {loading ? (
        <ListSkeleton count={8} />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.subtitle}>
            Choose how you want to be notified for each event type.
          </Text>

          {/* Column headers */}
          <View style={styles.headerRow}>
            <Text style={styles.headerLabel}>Event</Text>
            {CHANNELS.map((ch) => (
              <Text key={ch.key} style={styles.headerChannelLabel}>
                {ch.label}
              </Text>
            ))}
          </View>

          {/* Preference rows */}
          {preferences.map((pref) => (
            <View key={pref.event_type} style={styles.row}>
              <Text style={styles.eventLabel}>
                {EVENT_LABELS[pref.event_type] || pref.event_type}
              </Text>
              {CHANNELS.map((ch) => (
                <View key={ch.key} style={styles.switchCell}>
                  <Switch
                    value={pref[ch.key]}
                    onValueChange={(val) =>
                      handleToggle(pref.event_type, ch.key, val)
                    }
                    disabled={saving}
                    color={colors.accent}
                  />
                </View>
              ))}
            </View>
          ))}
        </ScrollView>
      )}

      <Snackbar
        visible={!!error}
        onDismiss={() => setError(null)}
        duration={3000}
        action={{ label: 'Retry', onPress: fetchPreferences }}
      >
        {error}
      </Snackbar>
    </SafeAreaView>
  );
};

export default NotificationPreferencesScreen;
