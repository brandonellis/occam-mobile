import React, { useEffect, useCallback, useState, useMemo, useRef } from 'react';
import { View, ScrollView, TouchableOpacity, FlatList, Animated } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenHeader from '../../components/ScreenHeader';
import { bookingStyles as styles } from '../../styles/booking.styles';

import { getAvailableTimeSlots } from '../../services/availability.service';
import { getAvailabilityMonthlySummary, getResources, getAvailableClassSessionsByCoach } from '../../services/bookings.api';
import { filterResourcesNotFullyBlocked } from '../../helpers/closure.helper';
import { isClassLike } from '../../helpers/normalizers.helper';
import { buildClassSessionGroups } from '../../helpers/classSession.helper';
import { colors, spacing } from '../../theme';
import { SCREENS } from '../../constants/navigation.constants';
import dayjs, { getEffectiveTimezone } from '../../utils/dayjs';
import useAuth from '../../hooks/useAuth';

/**
 * Generate a date range using the company timezone so that "today" and all
 * subsequent dates are correct regardless of the device's local timezone.
 */
const generateDateRange = (tz, days = 14) => {
  const dates = [];
  const today = tz ? dayjs().tz(tz) : dayjs();
  for (let i = 0; i < days; i++) {
    const date = today.add(i, 'day');
    dates.push({
      key: date.format('YYYY-MM-DD'),
      dayName: date.format('ddd'),
      dayNumber: date.date(),
      month: date.format('MMM'),
    });
  }
  return dates;
};

const AVAILABILITY_COLORS = {
  available: colors.success,
  unavailable: colors.error,
  unknown: colors.gray400,
};

const SKELETON_COUNT = 9;

const TimeSlotSkeleton = ({ opacity }) => (
  <View style={styles.timeSlotGrid}>
    {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
      <Animated.View
        key={i}
        style={[styles.timeSlot, styles.skeletonSlot, { opacity }]}
      >
        <View style={styles.skeletonTextBlock} />
      </Animated.View>
    ))}
  </View>
);

const TimeSlotSelectionScreen = ({ route, navigation }) => {
  const { bookingData = {} } = route.params || {};
  const { service, coach, location } = bookingData;

  const { company, user } = useAuth();
  const isClassService = useMemo(() => isClassLike(service), [service]);

  const [selectedDate, setSelectedDate] = useState(null);
  const [timeSlots, setTimeSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [availabilityMap, setAvailabilityMap] = useState({});
  const [resourcePool, setResourcePool] = useState([]);
  // Class session state
  const [classSlots, setClassSlots] = useState([]);
  const [classGroups, setClassGroups] = useState([]);
  const [classLoading, setClassLoading] = useState(false);

  // Skeleton pulse animation
  const skeletonAnim = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    if (!isLoading && !classLoading) return;
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(skeletonAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(skeletonAnim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [isLoading, classLoading, skeletonAnim]);

  // Build date range in company timezone (rebuilds when company loads)
  const companyTz = useMemo(() => getEffectiveTimezone(company), [company]);
  const dates = useMemo(() => generateDateRange(companyTz), [companyTz]);

  // Select first date on mount (company is already available from auth context)
  useEffect(() => {
    if (dates.length > 0 && !selectedDate) {
      setSelectedDate(dates[0]);
    }
  }, [dates]);

  // Fetch resources when service requires them (for auto-selection, skip for class services)
  useEffect(() => {
    if (isClassService || !service?.requires_resource || !location?.id) {
      setResourcePool([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const resp = await getResources();
        const allResources = resp?.data || resp || [];
        // Filter by active status, location, and service resource type
        const filtered = allResources.filter((r) => {
          if (r.status === 'inactive' || r.status === 'disabled') return false;
          const locMatch = r.location_id === location.id ||
            (Array.isArray(r.location_ids) && r.location_ids.includes(location.id)) ||
            (!r.location_id && !r.location_ids);
          if (!locMatch) return false;
          const serviceTypeIds = service.resource_type_ids ||
            (service.resource_type?.id ? [service.resource_type.id] : (service.resource_type_id ? [service.resource_type_id] : []));
          if (serviceTypeIds.length > 0) {
            const rTypeId = r.resource_type_id || r.type?.id || r.resource_type?.id;
            if (rTypeId && !serviceTypeIds.includes(rTypeId)) return false;
          }
          return true;
        });
        if (!cancelled) setResourcePool(filtered);
      } catch (err) {
        console.warn('Failed to fetch resources:', err.message);
      }
    })();
    return () => { cancelled = true; };
  }, [isClassService, service?.requires_resource, service?.resource_type_ids, service?.resource_type_id, service?.resource_type?.id, location?.id]);

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
      } catch (err) {
        console.warn('Failed to fetch availability summary:', err.message);
      }
      setAvailabilityMap(map);
    };

    fetchSummaries();
  }, [service?.id, location?.id, coach?.id, monthsToFetch]);

  // Apply closure filtering to resource pool for the selected date
  const effectiveResourcePool = useMemo(() => {
    if (!service?.requires_resource || resourcePool.length === 0 || !selectedDate?.key) {
      return resourcePool;
    }
    const selectedDayjs = dayjs.tz(selectedDate.key, 'YYYY-MM-DD', companyTz);
    return filterResourcesNotFullyBlocked(
      resourcePool,
      selectedDayjs,
      service.service_type,
      location,
      companyTz
    );
  }, [resourcePool, selectedDate?.key, service?.requires_resource, service?.service_type, location, companyTz]);

  // Fetch class sessions for class/group services
  const loadClassSessions = useCallback(async (dateItem) => {
    if (!service?.id || !location?.id) return;
    setClassLoading(true);
    try {
      const selectedDayjs = dayjs.tz(dateItem.key, 'YYYY-MM-DD', companyTz);
      // Build UTC day window (Hermes-safe: use valueOf then native Date)
      const dayStartMs = selectedDayjs.valueOf();
      const dayEndMs = dayStartMs + 86400000;
      const params = {
        service_id: service.id,
        location_id: location.id,
        after: new Date(dayStartMs).toISOString(),
        before: new Date(dayEndMs).toISOString(),
        client_id: bookingData?.client?.id || user?.id || undefined,
      };
      const result = await getAvailableClassSessionsByCoach(params);
      const { groups, flat } = buildClassSessionGroups(result, selectedDayjs);
      setClassGroups(groups);
      setClassSlots(flat);
    } catch (err) {
      console.warn('Failed to load class sessions:', err.message);
      setClassSlots([]);
      setClassGroups([]);
    } finally {
      setClassLoading(false);
    }
  }, [service?.id, location?.id, bookingData?.client?.id, user?.id, companyTz]);

  const loadTimeSlots = useCallback(async (dateItem) => {
    try {
      setIsLoading(true);
      // Construct selectedDate in company timezone from the date key string
      const selectedDayjs = dayjs.tz(dateItem.key, 'YYYY-MM-DD', companyTz);
      const slots = await getAvailableTimeSlots({
        service,
        coach,
        selectedResource: bookingData.selectedResource || null,
        location,
        selectedDate: selectedDayjs,
        company,
        resourcePool: effectiveResourcePool,
        durationMinutes: bookingData.duration_minutes || null,
      });

      setTimeSlots(slots);
    } catch (err) {
      console.warn('Failed to load time slots:', err.message);
      setTimeSlots([]);
    } finally {
      setIsLoading(false);
    }
  }, [service, coach, location, bookingData.duration_minutes, bookingData.selectedResource, effectiveResourcePool, company, companyTz]);

  useEffect(() => {
    if (selectedDate && company) {
      setSelectedSlot(null);
      if (isClassService) {
        loadClassSessions(selectedDate);
      } else {
        loadTimeSlots(selectedDate);
      }
    }
  }, [selectedDate, isClassService, loadClassSessions, loadTimeSlots, company]);

  const handleSelectSlot = useCallback((slot) => {
    setSelectedSlot(slot);
  }, []);

  const handleContinue = useCallback(() => {
    if (!selectedSlot) return;

    // For class services, pass selectedClassSession and coach from the session
    if (isClassService) {
      navigation.navigate(SCREENS.BOOKING_CONFIRMATION, {
        bookingData: {
          ...bookingData,
          date: selectedDate.key,
          timeSlot: selectedSlot,
          selectedClassSession: { id: selectedSlot.class_session_id },
          coach: selectedSlot.coach || bookingData.coach || null,
          ...(selectedSlot.resource_id ? { selectedResource: { id: selectedSlot.resource_id } } : {}),
        },
      });
      return;
    }

    // Auto-assign first available resource from the selected time slot
    let selectedResource = null;
    if (service?.requires_resource && selectedSlot?.available_resource_ids?.length > 0) {
      const resourceId = selectedSlot.available_resource_ids[0];
      selectedResource = effectiveResourcePool.find(
        (r) => (r.id || r.resource_id)?.toString() === resourceId?.toString()
      ) || { id: resourceId };
    }

    navigation.navigate(SCREENS.BOOKING_CONFIRMATION, {
      bookingData: {
        ...bookingData,
        date: selectedDate.key,
        timeSlot: selectedSlot,
        ...(selectedResource ? { selectedResource } : {}),
      },
    });
  }, [navigation, bookingData, selectedDate, selectedSlot, service, effectiveResourcePool, isClassService]);

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
        contentContainerStyle={{ paddingHorizontal: spacing.lg }}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionHeader}>
          {selectedDate?.month} {selectedDate?.dayNumber} —{' '}
          {isClassService ? 'Class Sessions' : 'Available Times'}
        </Text>

        {isClassService ? (
          // Class session rendering — grouped by coach
          classLoading ? (
            <TimeSlotSkeleton opacity={skeletonAnim} />
          ) : classSlots.length === 0 ? (
            <Text style={styles.noSlotsText}>
              No class sessions available for this date.
            </Text>
          ) : (
            classGroups.map((group, gIdx) => (
              <View key={gIdx} style={styles.classGroupContainer}>
                {group.coach?.name && (
                  <Text style={styles.classGroupCoachName}>
                    {group.coach.name}
                  </Text>
                )}
                <View style={styles.timeSlotGrid}>
                  {group.slots.map((slot, index) => {
                    const isSelected = selectedSlot?.class_session_id === slot.class_session_id;
                    const isFull = slot.is_full;
                    const isPast = slot.is_past;
                    const isDisabled = isPast;
                    return (
                      <TouchableOpacity
                        key={`${slot.class_session_id}-${index}`}
                        style={[
                          styles.timeSlot,
                          isSelected && styles.timeSlotSelected,
                          isDisabled && styles.classSlotDisabled,
                          isFull && !isDisabled && styles.classSlotFull,
                        ]}
                        onPress={() => !isDisabled && handleSelectSlot(slot)}
                        activeOpacity={isDisabled ? 1 : 0.7}
                        disabled={isDisabled}
                      >
                        <Text
                          style={[
                            styles.timeSlotText,
                            isSelected && styles.timeSlotTextSelected,
                          ]}
                        >
                          {slot.display_time}
                        </Text>
                        {isFull && !isPast && (
                          <Text style={[styles.classSlotSubtext, styles.classSlotFullText]}>
                            Full
                          </Text>
                        )}
                        {slot.available != null && !isFull && !isPast && (
                          <Text style={[styles.classSlotSubtext, styles.classSlotAvailableText]}>
                            {slot.available} spot{slot.available !== 1 ? 's' : ''}
                          </Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))
          )
        ) : (
          // Regular time slot rendering
          isLoading ? (
            <TimeSlotSkeleton opacity={skeletonAnim} />
          ) : timeSlots.length === 0 ? (
            <Text style={styles.noSlotsText}>
              No available time slots for this date.
            </Text>
          ) : (
            <View style={styles.timeSlotGrid}>
              {timeSlots.map((slot) => {
                const isSelected =
                  selectedSlot?.id === slot.id;
                return (
                  <TouchableOpacity
                    key={slot.id}
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
          )
        )}
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.continueButton, !selectedSlot && styles.continueButtonDisabled]}
          onPress={handleContinue}
          disabled={!selectedSlot}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default TimeSlotSelectionScreen;
