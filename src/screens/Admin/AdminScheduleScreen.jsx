import React, { useEffect, useCallback, useMemo, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  LayoutAnimation,
  UIManager,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { IconButton, Portal, Modal, TouchableRipple } from 'react-native-paper';
import PropTypes from 'prop-types';
import useAuth from '../../hooks/useAuth';
import { SCREENS } from '../../constants/navigation.constants';
import { getBookings, getCoaches, getLocations, getServices } from '../../services/bookings.api';
import { formatTimeInTz, formatHourInTz, getTodayKey, formatDateKeyLong } from '../../helpers/timezone.helper';
import { shiftDateKey, buildDateStrip } from '../../helpers/date.helper';
import {
  getSessionCoachNames,
  getSessionResourceNames,
  getSessionServiceName,
  matchesCoach,
  matchesService,
  matchesLocation,
} from '../../helpers/booking.helper';
import { BOOKING_STATUS_CONFIG } from '../../constants/booking.constants';
import { adminScheduleStyles as styles } from '../../styles/adminSchedule.styles';
import { globalStyles } from '../../styles/global.styles';
import EmptyState from '../../components/EmptyState';
import { ScheduleSkeleton } from '../../components/SkeletonLoader';
import { colors, spacing } from '../../theme';
import logger from '../../helpers/logger.helper';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const AdminScheduleScreen = ({ navigation }) => {
  const { company } = useAuth();
  const todayKey = getTodayKey(company);
  const [selectedDateKey, setSelectedDateKey] = useState(todayKey);
  const dateListRef = useRef(null);
  const previousTodayKeyRef = useRef(todayKey);
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [filtersLoading, setFiltersLoading] = useState(true);
  const [filterModal, setFilterModal] = useState(null);
  const [filterOptions, setFilterOptions] = useState({
    coaches: [],
    locations: [],
    services: [],
  });
  const [filters, setFilters] = useState({
    coachId: null,
    locationId: null,
    serviceId: null,
  });

  const isTodaySelected = selectedDateKey === todayKey;

  const loadFilters = useCallback(async () => {
    try {
      setFiltersLoading(true);
      const [coachesRes, locationsRes, servicesRes] = await Promise.allSettled([
        getCoaches(),
        getLocations(),
        getServices(),
      ]);

      setFilterOptions({
        coaches: coachesRes.status === 'fulfilled' ? (coachesRes.value?.data || []) : [],
        locations: locationsRes.status === 'fulfilled' ? (locationsRes.value?.data || []) : [],
        services: servicesRes.status === 'fulfilled' ? (servicesRes.value?.data || []) : [],
      });
    } catch (err) {
      logger.warn('Failed to load admin schedule filters:', err?.message || err);
      setFilterOptions({ coaches: [], locations: [], services: [] });
    } finally {
      setFiltersLoading(false);
    }
  }, []);

  const loadBookings = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const params = {
        start_date: selectedDateKey,
        end_date: selectedDateKey,
        no_paginate: true,
        status: 'all',
      };

      logger.info('[AdminSchedule] loading bookings', {
        selectedDateKey,
        todayKey,
        timezone: company?.timezone || 'UTC',
        params,
      });

      const { data } = await getBookings(params);

      const sorted = [...(data || [])].sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));
      logger.info('[AdminSchedule] loaded bookings', {
        selectedDateKey,
        rawCount: data?.length || 0,
        sample: (data || []).slice(0, 3).map((booking) => ({
          id: booking?.id,
          status: booking?.status,
          start_time: booking?.start_time,
          client_id: booking?.client?.id || booking?.client_id || null,
        })),
      });
      setError(null);
      setBookings(sorted);
    } catch (err) {
      logger.warn('Failed to load admin schedule bookings:', err?.message || err);
      logger.warn('[AdminSchedule] booking request failed', {
        selectedDateKey,
        todayKey,
        timezone: company?.timezone || 'UTC',
        status: err?.response?.status,
        data: err?.response?.data,
      });
      setError('Unable to load the admin schedule. Pull down to retry.');
      setBookings([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [company?.timezone, selectedDateKey, todayKey]);

  useEffect(() => {
    loadFilters();
  }, [loadFilters]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  useEffect(() => {
    setSelectedDateKey((current) => {
      if (!current || current === previousTodayKeyRef.current) {
        return todayKey;
      }
      return current;
    });
    previousTodayKeyRef.current = todayKey;
  }, [todayKey]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadBookings();
    });
    return unsubscribe;
  }, [navigation, loadBookings]);

  const dateStrip = useMemo(() => buildDateStrip(selectedDateKey, todayKey), [selectedDateKey, todayKey]);

  const shiftDate = useCallback((offset) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedDateKey((prev) => shiftDateKey(prev, offset));
  }, []);

  const filteredBookings = useMemo(() => {
    const now = Date.now();
    return bookings.filter((booking) => (
      (!isTodaySelected || (() => {
        if (!booking?.start_time) return false;
        const start = new Date(booking.start_time).getTime();
        return !Number.isNaN(start) && start >= now;
      })())
      && matchesCoach(booking, filters.coachId)
      && matchesLocation(booking, filters.locationId)
      && matchesService(booking, filters.serviceId)
    ));
  }, [bookings, filters, isTodaySelected]);

  const groupedBookings = useMemo(() => {
    return filteredBookings.reduce((groups, booking) => {
      const hourLabel = formatHourInTz(booking.start_time, company) || 'Time TBD';
      const existingGroup = groups[groups.length - 1];

      if (existingGroup && existingGroup.hourLabel === hourLabel) {
        existingGroup.bookings.push(booking);
        return groups;
      }

      groups.push({
        hourLabel,
        bookings: [booking],
      });

      return groups;
    }, []);
  }, [company, filteredBookings]);

  useEffect(() => {
    logger.info('[AdminSchedule] filtered bookings', {
      selectedDateKey,
      rawCount: bookings.length,
      filteredCount: filteredBookings.length,
      groupCount: groupedBookings.length,
      filters,
    });
  }, [bookings.length, filteredBookings.length, groupedBookings.length, filters, selectedDateKey]);

  const hasActiveFilters = Boolean(filters.coachId || filters.locationId || filters.serviceId);
  const hasPastOnlyBookings = isTodaySelected && !hasActiveFilters && bookings.length > 0 && filteredBookings.length === 0;

  const selectedCoach = filterOptions.coaches.find((coach) => coach.id === filters.coachId);
  const selectedLocation = filterOptions.locations.find((location) => location.id === filters.locationId);
  const selectedService = filterOptions.services.find((service) => service.id === filters.serviceId);

  const renderDateItem = ({ item }) => {
    const isSelected = item.key === selectedDateKey;
    return (
      <TouchableOpacity
        style={[
          styles.dateItem,
          isSelected && styles.dateItemSelected,
          !isSelected && item.isToday && styles.dateItemToday,
        ]}
        onPress={() => setSelectedDateKey(item.key)}
        activeOpacity={0.75}
      >
        <Text style={[styles.dateDayName, isSelected && styles.dateDayNameSelected]}>{item.dayName}</Text>
        <Text style={[styles.dateDayNumber, isSelected && styles.dateDayNumberSelected]}>{item.dayNumber}</Text>
      </TouchableOpacity>
    );
  };

  const openFilter = useCallback((type) => {
    setFilterModal(type);
  }, []);

  const closeFilter = useCallback(() => {
    setFilterModal(null);
  }, []);

  const applyFilter = useCallback((type, value) => {
    setFilters((prev) => ({ ...prev, [type]: value }));
    setFilterModal(null);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({ coachId: null, locationId: null, serviceId: null });
  }, []);

  const modalConfig = useMemo(() => {
    if (filterModal === 'coach') {
      return {
        title: 'Filter by Coach',
        key: 'coachId',
        options: filterOptions.coaches.map((coach) => ({
          id: coach.id,
          title: `${coach.first_name || ''} ${coach.last_name || ''}`.trim() || 'Coach',
          subtitle: coach.email || null,
        })),
      };
    }

    if (filterModal === 'location') {
      return {
        title: 'Filter by Location',
        key: 'locationId',
        options: filterOptions.locations.map((location) => ({
          id: location.id,
          title: location.name,
          subtitle: location.address || null,
        })),
      };
    }

    if (filterModal === 'service') {
      return {
        title: 'Filter by Service',
        key: 'serviceId',
        options: filterOptions.services.map((service) => ({
          id: service.id,
          title: service.name,
          subtitle: service.duration_minutes ? `${service.duration_minutes} min` : null,
        })),
      };
    }

    return null;
  }, [filterModal, filterOptions]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <Text style={styles.headerTitle}>Schedule</Text>
          <TouchableOpacity
            testID="admin-new-booking-button"
            style={globalStyles.headerActionButton}
            onPress={() => navigation.navigate(SCREENS.CLIENT_SELECTION, { bookingData: {} })}
            activeOpacity={0.75}
          >
            <MaterialCommunityIcons name="plus" size={18} color={colors.textInverse} />
            <Text style={globalStyles.headerActionText}>New</Text>
          </TouchableOpacity>
          {!isTodaySelected && (
            <TouchableOpacity style={styles.todayResetButton} onPress={() => setSelectedDateKey(todayKey)} activeOpacity={0.75}>
              <Text style={styles.todayResetText}>Today</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.monthLabel}>{formatDateKeyLong(selectedDateKey).split(',').pop().trim()}</Text>
      </View>

      <View style={styles.dateStripRow}>
        <IconButton
          icon="chevron-left"
          size={20}
          iconColor={colors.primary}
          onPress={() => shiftDate(-1)}
          style={styles.navIconButton}
        />
        <FlatList
          ref={dateListRef}
          data={dateStrip}
          renderItem={renderDateItem}
          keyExtractor={(item) => item.key}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.dateStripList}
          initialScrollIndex={3}
          getItemLayout={(_, index) => ({ length: 54, offset: 54 * index, index })}
        />
        <IconButton
          icon="chevron-right"
          size={20}
          iconColor={colors.primary}
          onPress={() => shiftDate(1)}
          style={styles.navIconButton}
        />
      </View>

      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, styles.filterChipHalf, filters.coachId && styles.filterChipActive]}
          onPress={() => openFilter('coach')}
          activeOpacity={0.75}
        >
          <MaterialCommunityIcons
            name="account-outline"
            size={14}
            color={filters.coachId ? colors.accent : colors.textTertiary}
            style={styles.filterChipIcon}
          />
          <Text
            style={[styles.filterChipText, filters.coachId && styles.filterChipTextActive]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {selectedCoach
              ? `${selectedCoach.first_name || ''} ${selectedCoach.last_name || ''}`.trim() || selectedCoach.name || 'Coach'
              : 'All Coaches'}
          </Text>
          <MaterialCommunityIcons name="chevron-down" size={16} color={filters.coachId ? colors.accent : colors.textTertiary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, styles.filterChipHalf, filters.locationId && styles.filterChipActive]}
          onPress={() => openFilter('location')}
          activeOpacity={0.75}
        >
          <MaterialCommunityIcons
            name="map-marker-outline"
            size={14}
            color={filters.locationId ? colors.accent : colors.textTertiary}
            style={styles.filterChipIcon}
          />
          <Text
            style={[styles.filterChipText, filters.locationId && styles.filterChipTextActive]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {selectedLocation ? selectedLocation.name : 'All Locations'}
          </Text>
          <MaterialCommunityIcons name="chevron-down" size={16} color={filters.locationId ? colors.accent : colors.textTertiary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, styles.filterChipFull, filters.serviceId && styles.filterChipActive]}
          onPress={() => openFilter('service')}
          activeOpacity={0.75}
        >
          <MaterialCommunityIcons
            name="golf"
            size={14}
            color={filters.serviceId ? colors.accent : colors.textTertiary}
            style={styles.filterChipIcon}
          />
          <Text
            style={[styles.filterChipText, filters.serviceId && styles.filterChipTextActive]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {selectedService ? selectedService.name : 'All Services'}
          </Text>
          <MaterialCommunityIcons name="chevron-down" size={16} color={filters.serviceId ? colors.accent : colors.textTertiary} />
        </TouchableOpacity>
      </View>

      <View style={styles.contentWrap}>
        {isLoading ? (
          <ScheduleSkeleton />
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={() => loadBookings(true)}
                tintColor={colors.primary}
              />
            }
          >
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>{filteredBookings.length} booking{filteredBookings.length === 1 ? '' : 's'} in view</Text>
              <Text style={styles.summarySubtitle}>{formatDateKeyLong(selectedDateKey)}</Text>
            </View>

            {error ? (
              <View style={styles.emptyWrap}>
                <EmptyState
                  icon="cloud-off-outline"
                  title="Couldn't Load Schedule"
                  message={error}
                  actionLabel="Retry"
                  onAction={() => loadBookings()}
                />
              </View>
            ) : filteredBookings.length === 0 ? (
              <View style={styles.emptyWrap}>
                <EmptyState
                  icon="calendar-outline"
                  title={hasPastOnlyBookings ? 'No Upcoming Bookings' : 'No Bookings'}
                  message={
                    hasActiveFilters
                      ? 'No bookings match the current filters for this day.'
                      : hasPastOnlyBookings
                        ? 'All of today’s bookings are already in the past.'
                        : 'There are no bookings scheduled for this day.'
                  }
                />
              </View>
            ) : (
              groupedBookings.map((group) => (
                <View key={group.hourLabel} style={styles.timelineRow}>
                  <View style={styles.timeLabel}>
                    <Text style={styles.timeLabelText}>{group.hourLabel}</Text>
                  </View>
                  <View style={styles.timelineContent}>
                    {group.bookings.map((booking, index) => {
                      const serviceName = getSessionServiceName(booking);
                      const clientName = booking.client
                        ? `${booking.client.first_name || ''} ${booking.client.last_name || ''}`.trim()
                        : 'No client assigned';
                      const coachNames = getSessionCoachNames(booking);
                      const resourceNames = getSessionResourceNames(booking);
                      const locationName = booking.location?.name || null;
                      const statusConfig = BOOKING_STATUS_CONFIG[booking.status] || BOOKING_STATUS_CONFIG.confirmed;

                      return (
                        <TouchableRipple
                          key={booking.id}
                          style={[
                            styles.sessionCard,
                            index > 0 && styles.sessionCardStackGap,
                            { borderLeftColor: statusConfig.color },
                            booking.status === 'cancelled' && styles.sessionCardCancelled,
                          ]}
                          onPress={() => navigation.navigate(SCREENS.BOOKING_DETAIL, { bookingId: booking.id })}
                          borderless
                        >
                          <View style={styles.sessionCardHeader}>
                            <View style={styles.sessionMain}>
                              <Text style={styles.sessionService}>{serviceName}</Text>
                              <Text style={styles.sessionClient}>{clientName}</Text>
                              <Text style={styles.sessionTime}>
                                {formatTimeInTz(booking.start_time, company)}
                                {booking.end_time ? ` — ${formatTimeInTz(booking.end_time, company)}` : ''}
                              </Text>
                              <View style={styles.sessionMetaRow}>
                                {coachNames ? (
                                  <View style={styles.sessionMetaPill}>
                                    <MaterialCommunityIcons
                                      name="account-outline"
                                      size={12}
                                      color={colors.textTertiary}
                                      style={styles.sessionMetaIcon}
                                    />
                                    <Text style={styles.sessionMetaText}>{coachNames}</Text>
                                  </View>
                                ) : null}
                                {locationName ? (
                                  <View style={styles.sessionMetaPill}>
                                    <MaterialCommunityIcons
                                      name="map-marker-outline"
                                      size={12}
                                      color={colors.textTertiary}
                                      style={styles.sessionMetaIcon}
                                    />
                                    <Text style={styles.sessionMetaText}>{locationName}</Text>
                                  </View>
                                ) : null}
                                {resourceNames ? (
                                  <View style={styles.sessionMetaPill}>
                                    <MaterialCommunityIcons
                                      name="golf"
                                      size={12}
                                      color={colors.textTertiary}
                                      style={styles.sessionMetaIcon}
                                    />
                                    <Text style={styles.sessionMetaText}>{resourceNames}</Text>
                                  </View>
                                ) : null}
                              </View>
                            </View>
                            <View style={styles.sessionActions}>
                              {booking.status !== 'confirmed' ? (
                                <View style={[styles.sessionStatusPill, { backgroundColor: statusConfig.backgroundColor }]}>
                                  <Text style={[styles.sessionStatusText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
                                </View>
                              ) : null}
                              <MaterialCommunityIcons
                                name="chevron-right"
                                size={18}
                                color={colors.textTertiary}
                                style={styles.sessionChevron}
                              />
                            </View>
                          </View>
                        </TouchableRipple>
                      );
                    })}
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        )}
      </View>

      <Portal>
        <Modal visible={Boolean(modalConfig)} onDismiss={closeFilter} contentContainerStyle={styles.modalContent}>
          {modalConfig && (
            <>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{modalConfig.title}</Text>
              </View>
              <ScrollView>
                <TouchableRipple
                  style={[
                    styles.optionRow,
                    !filters[modalConfig.key] && styles.optionRowSelected,
                  ]}
                  onPress={() => applyFilter(modalConfig.key, null)}
                  borderless
                >
                  <View>
                    <Text style={[
                      styles.optionTitle,
                      !filters[modalConfig.key] && styles.optionTitleSelected,
                    ]}>All</Text>
                  </View>
                </TouchableRipple>
                {modalConfig.options.map((option) => (
                  <TouchableRipple
                    key={option.id}
                    style={[
                      styles.optionRow,
                      filters[modalConfig.key] === option.id && styles.optionRowSelected,
                    ]}
                    onPress={() => applyFilter(modalConfig.key, option.id)}
                    borderless
                  >
                    <View>
                      <Text style={[
                        styles.optionTitle,
                        filters[modalConfig.key] === option.id && styles.optionTitleSelected,
                      ]}>{option.title}</Text>
                      {option.subtitle ? (
                        <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
                      ) : null}
                    </View>
                  </TouchableRipple>
                ))}
              </ScrollView>
            </>
          )}
        </Modal>
      </Portal>
    </SafeAreaView>
  );
};

AdminScheduleScreen.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
    addListener: PropTypes.func.isRequired,
  }).isRequired,
};

export default AdminScheduleScreen;
