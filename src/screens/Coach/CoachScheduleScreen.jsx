import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import useAuth from '../../hooks/useAuth';
import { SCREENS } from '../../constants/navigation.constants';
import { getBookings, cancelBooking } from '../../services/bookings.api';
import { formatTimeInTz, generateDateRangeInTz, getTodayKey, formatDateKeyLong } from '../../helpers/timezone.helper';
import { scheduleStyles as styles } from '../../styles/schedule.styles';
import { globalStyles } from '../../styles/global.styles';
import EmptyState from '../../components/EmptyState';
import { colors, spacing } from '../../theme';

const CoachScheduleScreen = ({ navigation }) => {
  const { user, company } = useAuth();
  const [dates] = useState(() => generateDateRangeInTz(company));
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = getTodayKey(company);
    return dates.find((d) => d.key === today) || dates[0];
  });
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadSessions = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setIsRefreshing(true);
      else setIsLoading(true);

      const { data } = await getBookings({
        start_date: selectedDate.key,
        end_date: selectedDate.key,
        coach_id: user?.id,
      });
      const sorted = (data || []).sort((a, b) =>
        (a.start_time || '').localeCompare(b.start_time || '')
      );
      setSessions(sorted);
    } catch (err) {
      console.warn('Failed to load sessions:', err?.message || err);
      setSessions([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedDate]);

  // Load on mount + refresh when navigating back (e.g. after creating a booking)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadSessions();
    });
    return unsubscribe;
  }, [navigation, loadSessions]);

  const handleCancelBooking = useCallback((bookingId, serviceName) => {
    Alert.alert(
      'Cancel Booking',
      `Cancel "${serviceName}"? This cannot be undone.`,
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Cancel Booking',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelBooking(bookingId);
              loadSessions(true);
            } catch {
              Alert.alert('Error', 'Failed to cancel booking.');
            }
          },
        },
      ]
    );
  }, [loadSessions]);

  const formattedHeader = formatDateKeyLong(selectedDate.key);

  const renderDateItem = ({ item }) => {
    const isSelected = item.key === selectedDate.key;
    return (
      <TouchableOpacity
        style={[
          styles.dateItem,
          isSelected && styles.dateItemSelected,
          !isSelected && item.isToday && styles.dateItemToday,
        ]}
        onPress={() => setSelectedDate(item)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.dateDayName,
            isSelected && styles.dateDayNameSelected,
          ]}
        >
          {item.dayName}
        </Text>
        <Text
          style={[
            styles.dateDayNumber,
            isSelected && styles.dateDayNumberSelected,
          ]}
        >
          {item.dayNumber}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Schedule</Text>
          <Text style={styles.headerDate}>{formattedHeader}</Text>
        </View>
        <TouchableOpacity
          style={styles.newBookingButton}
          onPress={() => navigation.navigate(SCREENS.CLIENT_SELECTION, { bookingData: {} })}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={18} color={colors.accent} />
          <Text style={styles.newBookingText}>New</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={dates}
        renderItem={renderDateItem}
        keyExtractor={(item) => item.key}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.dateStrip}
        contentContainerStyle={{ paddingHorizontal: spacing.lg }}
      />

      {isLoading ? (
        <View style={globalStyles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            sessions.length === 0 && { flex: 1 },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => loadSessions(true)}
              tintColor={colors.primary}
            />
          }
        >
          {sessions.length === 0 ? (
            <EmptyState
              icon="calendar-outline"
              title="No Sessions"
              message="You have no sessions scheduled for this day."
            />
          ) : (
            sessions.map((session) => {
              const serviceName = session.services?.[0]?.name || session.service?.name || 'Session';
              return (
                <View key={session.id} style={styles.timelineRow}>
                  <View style={styles.timeLabel}>
                    <Text style={styles.timeLabelText}>
                      {formatTimeInTz(session.start_time, company)}
                    </Text>
                  </View>
                  <View style={styles.timelineContent}>
                    <View style={styles.sessionCard}>
                      <View style={styles.sessionCardHeader}>
                        <View style={globalStyles.flex1}>
                          <Text style={styles.sessionService}>{serviceName}</Text>
                          {session.client && (
                            <Text style={styles.sessionClient}>
                              {session.client.first_name} {session.client.last_name}
                            </Text>
                          )}
                          <Text style={styles.sessionTime}>
                            {formatTimeInTz(session.start_time, company)}
                            {session.end_time ? ` — ${formatTimeInTz(session.end_time, company)}` : ''}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.cancelButton}
                          onPress={() => handleCancelBooking(session.id, serviceName)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Ionicons name="close-circle-outline" size={20} color={colors.error} />
                        </TouchableOpacity>
                      </View>
                      {session.location && (
                        <View style={styles.sessionLocation}>
                          <Ionicons name="location-outline" size={13} color={colors.textTertiary} />
                          <Text style={styles.sessionLocationText}>
                            {session.location.name}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default CoachScheduleScreen;
