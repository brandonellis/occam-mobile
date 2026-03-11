import React, { useEffect, useCallback, useMemo, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  LayoutAnimation,
  UIManager,
  Platform,
} from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { IconButton, Portal, Modal, TouchableRipple } from 'react-native-paper';
import PropTypes from 'prop-types';
import useAuth from '../../hooks/useAuth';
import { SCREENS } from '../../constants/navigation.constants';
import { getBookings, cancelBooking, getCoaches, getLocations, getServices } from '../../services/bookings.api';
import { formatTimeInTz, getTodayKey, formatDateKeyLong } from '../../helpers/timezone.helper';
import { shiftDateKey, buildDateStrip } from '../../helpers/date.helper';
import {
  getSessionCoachNames,
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

const AdminScheduleScreen = ({ navigation }) => {
  const { company } = useAuth();
  const todayKey = getTodayKey(company);
  const [selectedDateKey, setSelectedDateKey] = useState(todayKey);
  const dateListRef = useRef(null);
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
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

      const { data } = await getBookings({
        start_date: selectedDateKey,
        end_date: selectedDateKey,
        per_page: 200,
        status: 'all',
      });

      const sorted = [...(data || [])].sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));
      setBookings(sorted);
    } catch (err) {
      logger.warn('Failed to load admin schedule bookings:', err?.message || err);
      setBookings([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedDateKey]);

  useEffect(() => {
    loadFilters();
  }, [loadFilters]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

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
    return bookings.filter((booking) => (
      matchesCoach(booking, filters.coachId)
      && matchesLocation(booking, filters.locationId)
      && matchesService(booking, filters.serviceId)
    ));
  }, [bookings, filters]);

  const hasActiveFilters = Boolean(filters.coachId || filters.locationId || filters.serviceId);

  const selectedCoach = filterOptions.coaches.find((coach) => coach.id === filters.coachId);
  const selectedLocation = filterOptions.locations.find((location) => location.id === filters.locationId);
  const selectedService = filterOptions.services.find((service) => service.id === filters.serviceId);
  const activeFilterPills = [
    selectedCoach ? { key: 'coach', label: `Coach: ${`${selectedCoach.first_name || ''} ${selectedCoach.last_name || ''}`.trim() || selectedCoach.name}` } : null,
    selectedLocation ? { key: 'location', label: `Location: ${selectedLocation.name}` } : null,
    selectedService ? { key: 'service', label: `Service: ${selectedService.name}` } : null,
  ].filter(Boolean);

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
              loadBookings(true);
            } catch (err) {
              const status = err?.response?.status;
              const serverMsg = err?.response?.data?.message;
              if (status === 403 && serverMsg) {
                Alert.alert('Cannot Cancel', serverMsg);
              } else {
                Alert.alert('Error', 'Failed to cancel booking.');
              }
            }
          },
        },
      ]
    );
  }, [loadBookings]);

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
            <MaterialCommunityIcons name="plus" size={18} color={colors.accent} />
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

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterRow}
      >
        <TouchableOpacity
          style={[styles.filterChip, filters.coachId && styles.filterChipActive]}
          onPress={() => openFilter('coach')}
          activeOpacity={0.75}
        >
          <MaterialCommunityIcons
            name="account-outline"
            size={14}
            color={filters.coachId ? colors.accent : colors.textTertiary}
            style={styles.filterChipIcon}
          />
          <Text style={[styles.filterChipText, filters.coachId && styles.filterChipTextActive]}>
            {selectedCoach
              ? `${selectedCoach.first_name || ''} ${selectedCoach.last_name || ''}`.trim() || selectedCoach.name || 'Coach'
              : 'All Coaches'}
          </Text>
          <MaterialCommunityIcons name="chevron-down" size={16} color={filters.coachId ? colors.accent : colors.textTertiary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filters.locationId && styles.filterChipActive]}
          onPress={() => openFilter('location')}
          activeOpacity={0.75}
        >
          <MaterialCommunityIcons
            name="map-marker-outline"
            size={14}
            color={filters.locationId ? colors.accent : colors.textTertiary}
            style={styles.filterChipIcon}
          />
          <Text style={[styles.filterChipText, filters.locationId && styles.filterChipTextActive]}>
            {selectedLocation ? selectedLocation.name : 'All Locations'}
          </Text>
          <MaterialCommunityIcons name="chevron-down" size={16} color={filters.locationId ? colors.accent : colors.textTertiary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filters.serviceId && styles.filterChipActive]}
          onPress={() => openFilter('service')}
          activeOpacity={0.75}
        >
          <MaterialCommunityIcons
            name="golf"
            size={14}
            color={filters.serviceId ? colors.accent : colors.textTertiary}
            style={styles.filterChipIcon}
          />
          <Text style={[styles.filterChipText, filters.serviceId && styles.filterChipTextActive]}>
            {selectedService ? selectedService.name : 'All Services'}
          </Text>
          <MaterialCommunityIcons name="chevron-down" size={16} color={filters.serviceId ? colors.accent : colors.textTertiary} />
        </TouchableOpacity>
      </ScrollView>

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

            {filteredBookings.length === 0 ? (
              <View style={styles.emptyWrap}>
                <EmptyState
                  icon="calendar-outline"
                  title="No Bookings"
                  message={hasActiveFilters ? 'No bookings match the current filters for this day.' : 'There are no bookings scheduled for this day.'}
                />
              </View>
            ) : (
              filteredBookings.map((booking) => {
                const serviceName = getSessionServiceName(booking);
                const clientName = booking.client
                  ? `${booking.client.first_name || ''} ${booking.client.last_name || ''}`.trim()
                  : 'No client assigned';
                const coachNames = getSessionCoachNames(booking);
                const locationName = booking.location?.name || null;
                const statusConfig = BOOKING_STATUS_CONFIG[booking.status] || BOOKING_STATUS_CONFIG.confirmed;
                const canCancel = booking.status === 'confirmed' || booking.status === 'pending';

                return (
                  <View key={booking.id} style={styles.timelineRow}>
                    <View style={styles.timeLabel}>
                      <Text style={styles.timeLabelText}>{formatTimeInTz(booking.start_time, company)}</Text>
                    </View>
                    <View style={styles.timelineContent}>
                      <TouchableRipple
                        style={[
                          styles.sessionCard,
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
                            </View>
                          </View>
                          <View style={styles.sessionActions}>
                            <View style={[styles.sessionStatusPill, { backgroundColor: statusConfig.backgroundColor }]}>
                              <Text style={[styles.sessionStatusText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
                            </View>
                            {canCancel && (
                              <IconButton
                                icon="close-circle-outline"
                                size={20}
                                iconColor={colors.error}
                                onPress={() => handleCancelBooking(booking.id, serviceName)}
                                style={{ margin: 0 }}
                              />
                            )}
                            <MaterialCommunityIcons
                              name="chevron-right"
                              size={18}
                              color={colors.textTertiary}
                              style={styles.sessionChevron}
                            />
                          </View>
                        </View>
                      </TouchableRipple>
                    </View>
                  </View>
                );
              })
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
