import React, { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Portal, Modal as PaperModal, TouchableRipple } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import useAuth from '../../hooks/useAuth';
import { getClientActivities, getActivityTags } from '../../services/activity.api';
import ActivityCard from '../../components/ActivityCard';
import ActivityDetailSheet from '../../components/ActivityDetailSheet';
import FilterPill from '../../components/FilterPill';
import ActiveFilterPill from '../../components/ActiveFilterPill';
import ActivitySkeletonCard from '../../components/ActivitySkeletonCard';
import ActivityEmptyState from '../../components/ActivityEmptyState';
import { activityFeedStyles as styles } from '../../styles/activityFeed.styles';
import {
  ACTIVITY_TYPES,
  TYPE_FILTER_OPTIONS,
  DATE_FILTER_OPTIONS,
  ACTIVITY_PAGE_SIZE,
} from '../../constants/activity.constants';
import {
  groupByDate,
  setLastSeenTimestamp,
  getDateBoundsFromPreset,
} from '../../helpers/activity.helper';
import { feedReducer, feedInitialState, FEED_ACTIONS } from '../../reducers/activityFeed.reducer';
import { colors } from '../../theme';

// ── Main Screen ──────────────────────────────────────────
const ClientActivityFeedScreen = () => {
  const { user, company } = useAuth();
  const [state, dispatch] = useReducer(feedReducer, feedInitialState);
  const [selectedItem, setSelectedItem] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [allTags, setAllTags] = useState([]);
  const [typeSheetVisible, setTypeSheetVisible] = useState(false);
  const [dateSheetVisible, setDateSheetVisible] = useState(false);
  const [tagSheetVisible, setTagSheetVisible] = useState(false);

  // Fetch available tags on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const tags = await getActivityTags();
        if (mounted) setAllTags(Array.isArray(tags) ? tags : []);
      } catch {
        if (mounted) setAllTags([]);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const hasActiveFilters = useMemo(() => {
    return state.activeFilter !== ACTIVITY_TYPES.ALL
      || state.dateFilter !== 'all'
      || state.selectedTagIds.length > 0;
  }, [state.activeFilter, state.dateFilter, state.selectedTagIds]);

  const activeDateLabel = useMemo(() => {
    const opt = DATE_FILTER_OPTIONS.find((o) => o.value === state.dateFilter);
    return opt?.label || 'All Time';
  }, [state.dateFilter]);

  const fetchActivities = useCallback(async (targetPage = 1, append = false) => {
    if (!user?.id) return;

    if (append) {
      dispatch({ type: FEED_ACTIONS.FETCH_MORE_START });
    }

    try {
      const params = {
        page: targetPage,
        per_page: ACTIVITY_PAGE_SIZE,
      };
      if (state.activeFilter !== ACTIVITY_TYPES.ALL) {
        params.type = state.activeFilter;
      }
      // Date bounds
      const dateBounds = getDateBoundsFromPreset(state.dateFilter);
      if (dateBounds.start_date) params.start_date = dateBounds.start_date;
      if (dateBounds.end_date) params.end_date = dateBounds.end_date;
      // Tag IDs
      if (state.selectedTagIds.length > 0) {
        params.tag_ids = state.selectedTagIds;
      }

      const response = await getClientActivities(user.id, params);
      const items = Array.isArray(response) ? response : (Array.isArray(response?.data) ? response.data : []);
      const meta = Array.isArray(response) ? null : (response?.meta || null);

      const actionType = append ? FEED_ACTIONS.FETCH_MORE_SUCCESS : FEED_ACTIONS.FETCH_SUCCESS;
      dispatch({
        type: actionType,
        payload: {
          items,
          page: meta?.current_page ?? targetPage,
          lastPage: meta?.last_page ?? (meta?.current_page ?? targetPage),
        },
      });
    } catch (err) {
      dispatch({ type: FEED_ACTIONS.FETCH_ERROR, payload: err?.message || 'Failed to load activity' });
    }
  }, [user?.id, state.activeFilter, state.dateFilter, state.selectedTagIds]);

  // Initial fetch + filter change
  useEffect(() => {
    fetchActivities(1, false);
  }, [fetchActivities]);

  // Mark as seen when screen loads with data
  useEffect(() => {
    if (state.activities.length > 0 && !state.loading) {
      setLastSeenTimestamp();
    }
  }, [state.activities.length, state.loading]);

  const handleRefresh = useCallback(() => {
    dispatch({ type: FEED_ACTIONS.REFRESH_START });
    fetchActivities(1, false);
  }, [fetchActivities]);

  const handleLoadMore = useCallback(() => {
    if (state.loadingMore || state.page >= state.lastPage) return;
    fetchActivities(state.page + 1, true);
  }, [state.loadingMore, state.page, state.lastPage, fetchActivities]);

  const handleDateFilterChange = useCallback((preset) => {
    dispatch({ type: FEED_ACTIONS.SET_DATE_FILTER, payload: preset });
    setDateSheetVisible(false);
  }, []);

  const handleTagToggle = useCallback((tagId) => {
    dispatch({
      type: FEED_ACTIONS.SET_TAG_FILTER,
      payload: state.selectedTagIds.includes(tagId)
        ? state.selectedTagIds.filter((id) => id !== tagId)
        : [...state.selectedTagIds, tagId],
    });
  }, [state.selectedTagIds]);

  const handleClearFilters = useCallback(() => {
    dispatch({ type: FEED_ACTIONS.CLEAR_ALL_FILTERS });
  }, []);

  const handleCardPress = useCallback((item) => {
    setSelectedItem(item);
    setDetailVisible(true);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setDetailVisible(false);
    setSelectedItem(null);
  }, []);

  const groupedData = useMemo(() => {
    if (state.activities.length === 0) return [];
    const groups = groupByDate(state.activities);
    const flatData = [];
    groups.forEach((group) => {
      flatData.push({ type: 'header', label: group.label, key: `header_${group.label}` });
      group.items.forEach((item) => {
        flatData.push({ type: 'item', data: item, key: String(item.id) });
      });
    });
    return flatData;
  }, [state.activities]);

  const renderItem = useCallback(({ item: row }) => {
    if (row.type === 'header') {
      return (
        <View style={styles.dateSeparator}>
          <View style={styles.dateDot} />
          <Text style={styles.dateLabel}>{row.label}</Text>
          <View style={styles.dateLine} />
        </View>
      );
    }
    return <ActivityCard item={row.data} onPress={handleCardPress} company={company} />;
  }, [handleCardPress, company]);

  const keyExtractor = useCallback((row) => row.key, []);

  const ListFooter = useMemo(() => {
    if (state.loadingMore) {
      return (
        <View style={styles.loadMoreContainer}>
          <ActivityIndicator size="small" color={colors.accent} />
        </View>
      );
    }
    if (!state.loading && state.page < state.lastPage) {
      return (
        <View style={styles.loadMoreContainer}>
          <TouchableOpacity style={styles.loadMoreButton} onPress={handleLoadMore} activeOpacity={0.7}>
            <MaterialCommunityIcons name="chevron-down" size={16} color={colors.accent} />
            <Text style={styles.loadMoreText}>Load more</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return null;
  }, [state.loadingMore, state.loading, state.page, state.lastPage, handleLoadMore]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Activity</Text>
      </View>

      {/* ── Unified filter toolbar ── */}
      <View style={styles.filterToolbar}>
        <FilterPill
          icon="view-grid-outline"
          label={state.activeFilter === ACTIVITY_TYPES.ALL ? 'Type' : TYPE_FILTER_OPTIONS.find((o) => o.value === state.activeFilter)?.label || 'Type'}
          isActive={state.activeFilter !== ACTIVITY_TYPES.ALL}
          onPress={() => setTypeSheetVisible(true)}
        />
        <FilterPill
          icon="calendar-outline"
          label={state.dateFilter === 'all' ? 'Date' : activeDateLabel}
          isActive={state.dateFilter !== 'all'}
          onPress={() => setDateSheetVisible(true)}
        />
        {allTags.length > 0 ? (
          <FilterPill
            icon="tag-outline"
            label="Tags"
            isActive={state.selectedTagIds.length > 0}
            count={state.selectedTagIds.length}
            onPress={() => setTagSheetVisible(true)}
          />
        ) : null}
        {hasActiveFilters ? (
          <TouchableOpacity style={styles.clearAllButton} onPress={handleClearFilters} activeOpacity={0.7}>
            <MaterialCommunityIcons name="close-circle" size={16} color={colors.error} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Active filter summary pills */}
      {hasActiveFilters ? (
        <View style={styles.activeFiltersRow}>
          {state.activeFilter !== ACTIVITY_TYPES.ALL ? (
            <ActiveFilterPill
              label={TYPE_FILTER_OPTIONS.find((o) => o.value === state.activeFilter)?.label || state.activeFilter}
              onRemove={() => dispatch({ type: FEED_ACTIONS.SET_TYPE_FILTER, payload: ACTIVITY_TYPES.ALL })}
            />
          ) : null}
          {state.dateFilter !== 'all' ? (
            <ActiveFilterPill
              label={activeDateLabel}
              onRemove={() => dispatch({ type: FEED_ACTIONS.SET_DATE_FILTER, payload: 'all' })}
            />
          ) : null}
          {state.selectedTagIds.map((tagId) => {
            const tag = allTags.find((t) => t.id === tagId);
            if (!tag) return null;
            return (
              <ActiveFilterPill
                key={tagId}
                label={tag.name}
                onRemove={() => handleTagToggle(tagId)}
              />
            );
          })}
        </View>
      ) : null}

      {/* ── Type picker bottom sheet ── */}
      <Portal>
        <PaperModal visible={typeSheetVisible} onDismiss={() => setTypeSheetVisible(false)} contentContainerStyle={styles.dropdownSheet}>
          <View style={styles.dropdownHandle} />
          <Text style={styles.dropdownTitle}>Filter by Type</Text>
          <ScrollView>
            {TYPE_FILTER_OPTIONS.map((option) => {
              const isActive = state.activeFilter === option.value;
              return (
                <TouchableRipple
                  key={option.value}
                  style={[styles.dropdownOption, isActive && styles.dropdownOptionActive]}
                  onPress={() => { dispatch({ type: FEED_ACTIONS.SET_TYPE_FILTER, payload: option.value }); setTypeSheetVisible(false); }}
                  borderless
                >
                  <View style={styles.dropdownOptionRow}>
                    <MaterialCommunityIcons name={option.icon} size={18} color={isActive ? colors.accent : colors.textSecondary} style={styles.dropdownOptionIcon} />
                    <Text style={[styles.dropdownOptionText, isActive && styles.dropdownOptionTextActive]}>
                      {option.label}
                    </Text>
                    {isActive ? <MaterialCommunityIcons name="check-circle" size={20} color={colors.accent} style={styles.dropdownCheckIcon} /> : null}
                  </View>
                </TouchableRipple>
              );
            })}
          </ScrollView>
        </PaperModal>
      </Portal>

      {/* ── Date picker bottom sheet ── */}
      <Portal>
        <PaperModal visible={dateSheetVisible} onDismiss={() => setDateSheetVisible(false)} contentContainerStyle={styles.dropdownSheet}>
          <View style={styles.dropdownHandle} />
          <Text style={styles.dropdownTitle}>Filter by Date</Text>
          <ScrollView>
            {DATE_FILTER_OPTIONS.map((option) => {
              const isActive = state.dateFilter === option.value;
              return (
                <TouchableRipple
                  key={option.value}
                  style={[styles.dropdownOption, isActive && styles.dropdownOptionActive]}
                  onPress={() => handleDateFilterChange(option.value)}
                  borderless
                >
                  <View style={styles.dropdownOptionRow}>
                    <Text style={[styles.dropdownOptionText, isActive && styles.dropdownOptionTextActive]}>
                      {option.label}
                    </Text>
                    {isActive ? <MaterialCommunityIcons name="check-circle" size={20} color={colors.accent} style={styles.dropdownCheckIcon} /> : null}
                  </View>
                </TouchableRipple>
              );
            })}
          </ScrollView>
        </PaperModal>
      </Portal>

      {/* ── Tag picker bottom sheet ── */}
      <Portal>
        <PaperModal visible={tagSheetVisible} onDismiss={() => setTagSheetVisible(false)} contentContainerStyle={styles.dropdownSheet}>
          <View style={styles.dropdownHandle} />
          <Text style={styles.dropdownTitle}>Filter by Tags</Text>
          <ScrollView>
            {allTags.map((tag) => {
              const isActive = state.selectedTagIds.includes(tag.id);
              return (
                <TouchableRipple
                  key={tag.id}
                  style={[styles.dropdownOption, isActive && styles.dropdownOptionActive]}
                  onPress={() => handleTagToggle(tag.id)}
                  borderless
                >
                  <View style={styles.dropdownOptionRow}>
                    <Text style={[styles.dropdownOptionText, isActive && styles.dropdownOptionTextActive]}>
                      {tag.name}
                    </Text>
                    <MaterialCommunityIcons
                      name={isActive ? 'check-circle' : 'circle-outline'}
                      size={20}
                      color={isActive ? colors.accent : colors.gray300}
                    />
                  </View>
                </TouchableRipple>
              );
            })}
          </ScrollView>
          {state.selectedTagIds.length > 0 ? (
            <TouchableOpacity
              style={styles.sheetDoneButton}
              onPress={() => setTagSheetVisible(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.sheetDoneButtonText}>Done</Text>
            </TouchableOpacity>
          ) : null}
        </PaperModal>
      </Portal>

      {/* Content */}
      {state.loading && !state.refreshing ? (
        <View style={styles.listContent}>
          <ActivitySkeletonCard />
          <ActivitySkeletonCard />
          <ActivitySkeletonCard />
        </View>
      ) : state.error && state.activities.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <MaterialCommunityIcons name="alert-circle-outline" size={36} color={colors.error} />
          </View>
          <Text style={styles.emptyTitle}>Something went wrong</Text>
          <Text style={styles.emptySubtitle}>{state.error}</Text>
          <TouchableOpacity
            style={[styles.loadMoreButton, { marginTop: 16 }]}
            onPress={handleRefresh}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="refresh" size={16} color={colors.accent} />
            <Text style={styles.loadMoreText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : groupedData.length === 0 ? (
        <ActivityEmptyState
          filterActive={hasActiveFilters}
          message="Your lesson notes, shared resources, booking history, and progress reports will appear here as your coach adds them."
        />
      ) : (
        <FlatList
          data={groupedData}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={state.refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.accent}
              colors={[colors.accent]}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={ListFooter}
          showsVerticalScrollIndicator={false}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
        />
      )}

      {/* Detail sheet */}
      <ActivityDetailSheet
        item={selectedItem}
        visible={detailVisible}
        onClose={handleCloseDetail}
      />
    </SafeAreaView>
  );
};

export default ClientActivityFeedScreen;
