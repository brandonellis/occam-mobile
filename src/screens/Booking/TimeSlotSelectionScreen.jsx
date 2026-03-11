import React, { useEffect, useCallback, useState, useMemo, useRef } from 'react';
import { View, ScrollView, TouchableOpacity, FlatList, Animated, Alert } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenHeader from '../../components/ScreenHeader';
import { bookingStyles as styles } from '../../styles/booking.styles';

import { getAvailableTimeSlots } from '../../services/availability.service';
import { getAvailabilityMonthlySummary, getResources, getAvailableClassSessionsByCoach, joinClassSessionWaitlist, leaveClassSessionWaitlist } from '../../services/bookings.api';
import { filterResourcesNotFullyBlocked } from '../../helpers/closure.helper';
import { isClassLike } from '../../helpers/normalizers.helper';
import { buildClassSessionGroups } from '../../helpers/classSession.helper';
import { colors, spacing } from '../../theme';
import { SCREENS } from '../../constants/navigation.constants';
import { confirmCancelBooking } from '../../helpers/booking.navigation.helper';
import { COACH_ROLES } from '../../constants/auth.constants';
import dayjs, { getEffectiveTimezone } from '../../utils/dayjs';
import { generateDateRangeInTz, getFutureDateKey } from '../../helpers/timezone.helper';
import useAuth from '../../hooks/useAuth';
import logger from '../../helpers/logger.helper';

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

  const { company, user, activeRole } = useAuth();
  const isCoach = COACH_ROLES.includes(activeRole);
  const isClassService = useMemo(() => isClassLike(service), [service]);
  const companyTz = useMemo(() => getEffectiveTimezone(company), [company]);
  const initialDateKey = useMemo(() => {
    if (!bookingData?.date) return null;
    if (typeof bookingData.date === 'string' && bookingData.date.includes('T')) {
      return dayjs(bookingData.date).tz(companyTz).format('YYYY-MM-DD');
    }
    return bookingData.date;
  }, [bookingData?.date, companyTz]);

  const [selectedDate, setSelectedDate] = useState(null);
  const [timeSlots, setTimeSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [availabilityMap, setAvailabilityMap] = useState({});
  const [resourcePool, setResourcePool] = useState([]);
  const [resourcePoolReady, setResourcePoolReady] = useState(!service?.requires_resource);
  // Class session state
  const [classSlots, setClassSlots] = useState([]);
  const [classGroups, setClassGroups] = useState([]);
  const [classLoading, setClassLoading] = useState(false);
  const [waitlistLoading, setWaitlistLoading] = useState(null);

  // Track whether slots have already been fetched for the current date
  const hasFetchedSlots = useRef(false);

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
  const allDates = useMemo(() => generateDateRangeInTz(company), [company]);

  // Filter dates by advance booking limit (if service has one)
  const dates = useMemo(() => {
    if (!service?.advance_booking_limit_days) return allDates;
    const maxKey = getFutureDateKey(company, service.advance_booking_limit_days);
    return allDates.filter((d) => d.key <= maxKey);
  }, [allDates, service?.advance_booking_limit_days, company]);

  // Select first date on mount (company is already available from auth context)
  useEffect(() => {
    if (dates.length > 0 && !selectedDate) {
      const initialDate = initialDateKey
        ? dates.find((dateItem) => dateItem.key === initialDateKey)
        : null;
      setSelectedDate(initialDate || dates[0]);
    }
  }, [dates, initialDateKey, selectedDate]);

  // Fetch resources when service requires them (for auto-selection, skip for class services)
  useEffect(() => {
    if (isClassService || !service?.requires_resource || !location?.id) {
      setResourcePool([]);
      setResourcePoolReady(true);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const resp = await getResources();
        const allResources = resp?.data || resp || [];
        // Filter by active status, service resource type, and location (soft match).
        // Location filtering is relaxed: prefer resources at the booking location,
        // but fall back to all type-matched resources if none match the location.
        // This mirrors the web client behaviour where the backend validates the
        // final booking and doesn't strictly enforce resource–location pairing.
        const serviceTypeIds = service.resource_type_ids ||
          (service.resource_type?.id ? [service.resource_type.id] : (service.resource_type_id ? [service.resource_type_id] : []));

        const typeMatched = allResources.filter((r) => {
          if (r.status === 'inactive' || r.status === 'disabled') return false;
          if (serviceTypeIds.length > 0) {
            const rTypeId = r.resource_type_id || r.type?.id || r.resource_type?.id;
            if (rTypeId && !serviceTypeIds.includes(rTypeId)) return false;
          }
          return true;
        });

        // Prefer resources at the booking location
        const atLocation = typeMatched.filter((r) => {
          if (r.location_id === location.id) return true;
          if (Array.isArray(r.location_ids) && r.location_ids.includes(location.id)) return true;
          if (!r.location_id && !r.location_ids) return true;
          return false;
        });

        const filtered = atLocation.length > 0 ? atLocation : typeMatched;
        if (!cancelled) {
          setResourcePool(filtered);
          setResourcePoolReady(true);
        }
      } catch (err) {
        logger.warn('Failed to fetch resources:', err.message);
        if (!cancelled) setResourcePoolReady(true);
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

  // Fetch availability indicators for date coloring.
  // For class/group services: fetch actual class sessions across the visible date range
  // so green dots only appear on days with real sessions.
  // For 1:1 services: use the monthly summary endpoint as before.
  useEffect(() => {
    if (!service?.id || !location?.id) return;

    const fetchSummaries = async () => {
      const map = {};
      try {
        if (isClassService && dates.length > 0) {
          // Build UTC window spanning all visible dates
          const firstDayjs = dayjs.tz(dates[0].key, 'YYYY-MM-DD', companyTz);
          const lastDayjs = dayjs.tz(dates[dates.length - 1].key, 'YYYY-MM-DD', companyTz);
          const after = new Date(firstDayjs.valueOf()).toISOString();
          const before = new Date(lastDayjs.valueOf() + 86400000).toISOString();

          const result = await getAvailableClassSessionsByCoach({
            service_id: service.id,
            location_id: location.id,
            after,
            before,
            client_id: bookingData?.client?.id || user?.id || undefined,
          });

          // result is typically { data: { coachId: [...sessions] } } or similar
          const coachGroups = result?.data || result || {};
          const sessionDates = new Set();
          Object.values(coachGroups).forEach((sessions) => {
            (Array.isArray(sessions) ? sessions : []).forEach((s) => {
              if (s.start_time) {
                const dateKey = dayjs(s.start_time).tz(companyTz).format('YYYY-MM-DD');
                sessionDates.add(dateKey);
              }
            });
          });

          // Mark each visible date: true only if actual sessions exist
          dates.forEach((d) => {
            map[d.key] = sessionDates.has(d.key);
          });
        } else {
          // 1:1 services: use monthly summary
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
        }
      } catch (err) {
        logger.warn('Failed to fetch availability summary:', err.message);
      }
      setAvailabilityMap(map);
    };

    fetchSummaries();
  }, [service?.id, location?.id, coach?.id, isClassService, dates, monthsToFetch, companyTz, bookingData?.client?.id, user?.id]);

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
      const { groups, flat } = buildClassSessionGroups(result, dateItem.key, company);
      setClassGroups(groups);
      setClassSlots(flat);
    } catch (err) {
      logger.warn('Failed to load class sessions:', err.message);
      setClassSlots([]);
      setClassGroups([]);
    } finally {
      setClassLoading(false);
    }
  }, [service?.id, location?.id, bookingData?.client?.id, user?.id, companyTz]);

  const loadTimeSlots = useCallback(async (dateItem, { showSkeleton = true } = {}) => {
    try {
      if (showSkeleton) setIsLoading(true);
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
        excludeBookingId: bookingData.editMode ? bookingData.bookingId : null,
        clientId: bookingData.client?.id || null,
      });

      setTimeSlots(slots);
    } catch (err) {
      logger.warn('Failed to load time slots:', err.message);
      setTimeSlots([]);
    } finally {
      setIsLoading(false);
    }
  }, [service, coach, location, bookingData.duration_minutes, bookingData.selectedResource, bookingData.editMode, bookingData.bookingId, bookingData.client?.id, effectiveResourcePool, company, companyTz]);

  // Reset hasFetchedSlots when date changes so the fetch effect shows skeleton
  useEffect(() => {
    hasFetchedSlots.current = false;
  }, [selectedDate]);

  // Fetch slots when date changes (show skeleton) or when resource pool updates (silent refetch)
  // Wait for resourcePoolReady before first fetch so slots include available_resource_ids.
  useEffect(() => {
    if (!selectedDate || !company || !resourcePoolReady) return;

    if (!hasFetchedSlots.current) {
      // Fresh date selection — show skeleton
      setSelectedSlot(null);
      hasFetchedSlots.current = true;
      if (isClassService) {
        loadClassSessions(selectedDate);
      } else {
        loadTimeSlots(selectedDate, { showSkeleton: true });
      }
    } else if (!isClassService) {
      // Resource pool changed — silent refetch without skeleton
      loadTimeSlots(selectedDate, { showSkeleton: false });
    }
  }, [selectedDate, isClassService, loadClassSessions, loadTimeSlots, company, resourcePoolReady]);

  useEffect(() => {
    if (!bookingData?.editMode || isClassService || !bookingData?.timeSlot?.start_time || selectedSlot || timeSlots.length === 0) {
      return;
    }

    const matchingSlot = timeSlots.find((slot) => (
      slot?.start_time === bookingData.timeSlot.start_time
      && slot?.end_time === bookingData.timeSlot.end_time
    ));

    if (matchingSlot) {
      setSelectedSlot(matchingSlot);
    }
  }, [bookingData?.editMode, bookingData?.timeSlot, isClassService, selectedSlot, timeSlots]);

  const handleSelectSlot = useCallback((slot) => {
    setSelectedSlot(slot);
  }, []);

  const handleWaitlistAction = useCallback(async (slot) => {
    if (!slot?.class_session_id || waitlistLoading) return;
    const sessionId = slot.class_session_id;
    const clientId = isCoach ? bookingData?.client?.id : user?.id;

    setWaitlistLoading(sessionId);
    try {
      if (slot.on_waitlist) {
        await leaveClassSessionWaitlist(sessionId, isCoach ? clientId : undefined);
      } else {
        await joinClassSessionWaitlist(sessionId, isCoach ? clientId : undefined);
      }
      // Refresh class sessions to get updated waitlist state
      if (selectedDate) {
        await loadClassSessions(selectedDate);
      }
      // Clear stale selection — slot data changed after waitlist action
      setSelectedSlot(null);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Waitlist action failed.';
      logger.warn('Waitlist action failed:', msg);
      Alert.alert('Waitlist', msg);
    } finally {
      setWaitlistLoading(null);
    }
  }, [waitlistLoading, isCoach, bookingData?.client?.id, user?.id, selectedDate, loadClassSessions]);

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

    // Look up the latest version of the selected slot from timeSlots (may have
    // been silently refetched with available_resource_ids after resourcePool loaded).
    const currentSlot = timeSlots.find((s) => s.id === selectedSlot.id) || selectedSlot;

    // Auto-assign first available resource from the selected time slot
    let selectedResource = null;
    if (service?.requires_resource && currentSlot?.available_resource_ids?.length > 0) {
      const preferredResourceId = bookingData?.editMode && bookingData?.selectedResource?.id
        && currentSlot.available_resource_ids.includes(bookingData.selectedResource.id)
        ? bookingData.selectedResource.id
        : currentSlot.available_resource_ids[0];
      const resourceId = preferredResourceId;
      selectedResource = effectiveResourcePool.find(
        (r) => (r.id || r.resource_id)?.toString() === resourceId?.toString()
      ) || { id: resourceId };
    }

    navigation.navigate(SCREENS.BOOKING_CONFIRMATION, {
      bookingData: {
        ...bookingData,
        date: selectedDate.key,
        timeSlot: currentSlot,
        ...(selectedResource ? { selectedResource } : {}),
      },
    });
  }, [navigation, bookingData, selectedDate, selectedSlot, timeSlots, service, effectiveResourcePool, isClassService]);

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
        testID={`date-item-${item.key}`}
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
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScreenHeader
        title="Select Date & Time"
        onBack={() => navigation.goBack()}
        onClose={() => confirmCancelBooking(navigation)}
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
                    const isAttending = slot.already_attending;
                    const isOnWaitlist = slot.on_waitlist;
                    const waitlistCount = slot.waitlist_count ?? 0;
                    const waitlistAvailable = isFull && !isOnWaitlist && waitlistCount < 10;
                    const isWaitlistBusy = waitlistLoading === slot.class_session_id;

                    // Disable: past, already attending, or fully capped (no waitlist space)
                    const isDisabled = isPast || isAttending || (isFull && !waitlistAvailable && !isOnWaitlist);

                    // Compute a single status label (mutually exclusive)
                    let statusLabel = null;
                    let statusStyle = null;
                    if (isAttending && !isPast) {
                      statusLabel = 'Booked';
                      statusStyle = styles.classSlotAttendingText;
                    } else if (isOnWaitlist && !isPast) {
                      statusLabel = isWaitlistBusy ? 'Leaving...' : 'On Waitlist';
                      statusStyle = styles.classSlotWaitlistText;
                    } else if (isFull && !isPast && waitlistAvailable) {
                      statusLabel = isWaitlistBusy ? 'Joining...' : 'Join Waitlist';
                      statusStyle = styles.classSlotFullText;
                    } else if (isFull && !isPast) {
                      statusLabel = 'Full';
                      statusStyle = styles.classSlotFullText;
                    } else if (slot.available != null && !isPast) {
                      statusLabel = `${slot.available} spot${slot.available !== 1 ? 's' : ''}`;
                      statusStyle = styles.classSlotAvailableText;
                    }

                    const handleSlotPress = () => {
                      if (isDisabled) return;
                      if (isFull || isOnWaitlist) {
                        handleWaitlistAction(slot);
                        return;
                      }
                      handleSelectSlot(slot);
                    };

                    return (
                      <TouchableOpacity
                        key={`${slot.class_session_id}-${index}`}
                        style={[
                          styles.timeSlot,
                          isSelected && styles.timeSlotSelected,
                          isDisabled && styles.classSlotDisabled,
                          isFull && !isDisabled && !isOnWaitlist && styles.classSlotFull,
                          isOnWaitlist && !isDisabled && styles.classSlotWaitlist,
                          isAttending && styles.classSlotAttending,
                        ]}
                        onPress={handleSlotPress}
                        activeOpacity={isDisabled ? 1 : 0.7}
                        disabled={isDisabled || isWaitlistBusy}
                        testID={`class-slot-${slot.class_session_id}`}
                      >
                        <Text
                          style={[
                            styles.timeSlotText,
                            isSelected && styles.timeSlotTextSelected,
                          ]}
                        >
                          {slot.display_time}
                        </Text>
                        {statusLabel && (
                          <Text style={[styles.classSlotSubtext, statusStyle]}>
                            {statusLabel}
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
                    testID={`time-slot-${slot.id}`}
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
          testID="continue-button"
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default TimeSlotSelectionScreen;
