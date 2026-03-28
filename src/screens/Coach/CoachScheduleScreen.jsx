import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { IconButton } from 'react-native-paper';
import useAuth from '../../hooks/useAuth';
import { SCREENS } from '../../constants/navigation.constants';
import { cancelBooking } from '../../services/bookings.api';
import { formatTimeInTz, generateDateRangeInTz, getTodayKey, formatDateKeyLong } from '../../helpers/timezone.helper';
import { scheduleStyles as styles } from '../../styles/schedule.styles';
import { globalStyles } from '../../styles/global.styles';
import { ScheduleSkeleton } from '../../components/SkeletonLoader';
import EmptyState from '../../components/EmptyState';
import { colors, spacing } from '../../theme';
import useBookingsQuery from '../../hooks/useBookingsQuery';
import useRefetchOnFocus from '../../hooks/useRefetchOnFocus';

const CoachScheduleScreen = ({ navigation }) => {
  const { user, company } = useAuth();
  const [dates] = useState(() => generateDateRangeInTz(company));
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = getTodayKey(company);
    return dates.find((d) => d.key === today) || dates[0];
  });

  const bookingParams = useMemo(() => ({
    start_date: selectedDate.key,
    end_date: selectedDate.key,
    coach_id: user?.id,
  }), [selectedDate.key, user?.id]);

  const { data: rawSessions, isLoading, refetch, isRefetching: isRefreshing, error } = useBookingsQuery(bookingParams);
  useRefetchOnFocus(refetch);

  const sessions = useMemo(() => {
    const list = rawSessions || [];
    return [...list].sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));
  }, [rawSessions]);

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
              refetch();
            } catch {
              Alert.alert('Error', 'Failed to cancel booking.');
            }
          },
        },
      ]
    );
  }, [refetch]);

  const formattedHeader = formatDateKeyLong(selectedDate.key);

  const dateKeyExtractor = useCallback((item) => item.key, []);

  const renderDateItem = useCallback(({ item }) => {
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
  }, [selectedDate]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Schedule</Text>
        <TouchableOpacity
          testID="new-booking-button"
          style={globalStyles.headerActionButton}
          onPress={() => navigation.navigate(SCREENS.CLIENT_SELECTION, { bookingData: {} })}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="plus" size={18} color={colors.textInverse} />
          <Text style={globalStyles.headerActionText}>New</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={dates}
        renderItem={renderDateItem}
        keyExtractor={dateKeyExtractor}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.dateStrip}
        contentContainerStyle={{ paddingHorizontal: spacing.lg }}
      />

      {isLoading ? (
        <ScheduleSkeleton />
      ) : error ? (
        <EmptyState
          icon="cloud-off-outline"
          title="Couldn't Load Schedule"
          message="Unable to load your sessions. Pull down to retry."
          actionLabel="Retry"
          onAction={refetch}
        />
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            sessions.length === 0 && { flex: 1 },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={refetch}
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
                        <IconButton
                          icon="close-circle-outline"
                          size={20}
                          iconColor={colors.error}
                          onPress={() => handleCancelBooking(session.id, serviceName)}
                          style={{ margin: 0 }}
                        />
                      </View>
                      {session.location && (
                        <View style={styles.sessionLocation}>
                          <MaterialCommunityIcons name="map-marker-outline" size={13} color={colors.textTertiary} />
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
