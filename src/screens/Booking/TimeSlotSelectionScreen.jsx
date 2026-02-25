import React, { useEffect, useCallback, useState, useMemo } from 'react';
import { View, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { Text, ActivityIndicator, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenHeader from '../../components/ScreenHeader';
import { bookingStyles as styles } from '../../styles/booking.styles';
import { globalStyles } from '../../styles/global.styles';
import { getAvailableTimeSlots } from '../../services/availability.service';
import { getAvailabilityMonthlySummary } from '../../services/bookings.api';
import { colors } from '../../theme';
import { SCREENS } from '../../constants/navigation.constants';

const generateDateRange = (days = 14) => {
  const dates = [];
  const today = new Date();
  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push({
      key: date.toISOString().split('T')[0],
      dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNumber: date.getDate(),
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      full: date,
    });
  }
  return dates;
};

const AVAILABILITY_COLORS = {
  available: colors.success,
  unavailable: colors.error,
  unknown: colors.gray400,
};

const TimeSlotSelectionScreen = ({ route, navigation }) => {
  const { bookingData = {} } = route.params || {};
  const { service, coach, location } = bookingData;

  const [dates] = useState(() => generateDateRange());
  const [selectedDate, setSelectedDate] = useState(dates[0]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [availabilityMap, setAvailabilityMap] = useState({});

  // Determine which months we need to fetch summaries for
  const monthsToFetch = useMemo(() => {
    const months = new Set();
    dates.forEach((d) => months.add(d.key.substring(0, 7)));
    return Array.from(months);
  }, [dates]);

  // Fetch monthly availability summary for date coloring
  useEffect(() => {
    if (!service?.id || !location?.id) return;

    const fetchSummaries = async () => {
      const map = {};
      try {
        const promises = monthsToFetch.map((month) =>
          getAvailabilityMonthlySummary({
            service_id: service.id,
            location_id: location.id,
            month,
            ...(coach?.id ? { coach_ids: [coach.id] } : {}),
            ...(bookingData.duration_minutes ? { duration_minutes: bookingData.duration_minutes } : {}),
          })
        );
        const results = await Promise.all(promises);
        results.forEach((result) => {
          const data = result?.data || result || {};
          Object.entries(data).forEach(([dateKey, info]) => {
            map[dateKey] = info?.hasAvailability ?? false;
          });
        });
      } catch {
        // Non-fatal — dates will show as unknown
      }
      setAvailabilityMap(map);
    };

    fetchSummaries();
  }, [service?.id, location?.id, coach?.id, monthsToFetch]);

  const loadTimeSlots = useCallback(async (dateKey) => {
    try {
      setIsLoading(true);
      const slots = await getAvailableTimeSlots({
        service,
        coach,
        location,
        dateStr: dateKey,
        durationMinutes: bookingData.duration_minutes || null,
      });
      setTimeSlots(slots);
    } catch {
      setTimeSlots([]);
    } finally {
      setIsLoading(false);
    }
  }, [service, coach, location, bookingData.duration_minutes]);

  useEffect(() => {
    if (selectedDate) {
      setSelectedSlot(null);
      loadTimeSlots(selectedDate.key);
    }
  }, [selectedDate, loadTimeSlots]);

  const handleSelectSlot = useCallback((slot) => {
    setSelectedSlot(slot);
  }, []);

  const handleContinue = useCallback(() => {
    if (!selectedSlot) return;
    navigation.navigate(SCREENS.BOOKING_CONFIRMATION, {
      bookingData: {
        ...bookingData,
        date: selectedDate.key,
        timeSlot: selectedSlot,
      },
    });
  }, [navigation, bookingData, selectedDate, selectedSlot]);

  const getDateIndicatorColor = useCallback(
    (dateKey) => {
      if (!(dateKey in availabilityMap)) return AVAILABILITY_COLORS.unknown;
      return availabilityMap[dateKey]
        ? AVAILABILITY_COLORS.available
        : AVAILABILITY_COLORS.unavailable;
    },
    [availabilityMap]
  );

  const renderDateItem = ({ item }) => {
    const isSelected = item.key === selectedDate?.key;
    const indicatorColor = getDateIndicatorColor(item.key);
    return (
      <TouchableOpacity
        style={[styles.dateItem, isSelected && styles.dateItemSelected]}
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
        <View
          style={[
            styles.dateAvailabilityDot,
            { backgroundColor: indicatorColor },
          ]}
        />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader
        title="Select Date & Time"
        onBack={() => navigation.goBack()}
      />

      <FlatList
        data={dates}
        renderItem={renderDateItem}
        keyExtractor={(item) => item.key}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.dateSelector}
        contentContainerStyle={{ paddingHorizontal: 16, alignItems: 'center' }}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionHeader}>
          {selectedDate?.month} {selectedDate?.dayNumber} — Available Times
        </Text>

        {isLoading ? (
          <View style={globalStyles.loadingContainerInline}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : timeSlots.length === 0 ? (
          <Text style={styles.noSlotsText}>
            No available time slots for this date.
          </Text>
        ) : (
          <View style={styles.timeSlotGrid}>
            {timeSlots.map((slot, index) => {
              const isSelected =
                selectedSlot?.start_time === slot.start_time;
              return (
                <TouchableOpacity
                  key={`${slot.start_time}-${index}`}
                  style={[
                    styles.timeSlot,
                    isSelected && styles.timeSlotSelected,
                  ]}
                  onPress={() => handleSelectSlot(slot)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.timeSlotText,
                      isSelected && styles.timeSlotTextSelected,
                    ]}
                  >
                    {slot.display_time}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      <View style={styles.bottomBar}>
        <Button
          mode="contained"
          onPress={handleContinue}
          disabled={!selectedSlot}
          style={styles.continueButton}
          labelStyle={styles.continueButtonText}
        >
          Continue
        </Button>
      </View>
    </SafeAreaView>
  );
};

export default TimeSlotSelectionScreen;
