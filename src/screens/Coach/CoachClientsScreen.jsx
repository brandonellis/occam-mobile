import React, { useEffect, useCallback, useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { IconButton } from 'react-native-paper';
import Avatar from '../../components/Avatar';
import EmptyState from '../../components/EmptyState';
import { SCREENS } from '../../constants/navigation.constants';
import { getClients } from '../../services/accounts.api';
import { colors } from '../../theme';
import { coachClientsStyles as styles } from '../../styles/coachClients.styles';
import { ListSkeleton } from '../../components/SkeletonLoader';
import logger from '../../helpers/logger.helper';

const PER_PAGE = 50;
const SEARCH_DEBOUNCE_MS = 350;

const CoachClientsScreen = ({ navigation }) => {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef(null);
  const activeSearchRef = useRef('');

  const fetchClients = useCallback(async ({ page = 1, searchTerm = '', append = false, refresh = false }) => {
    try {
      if (refresh) setIsRefreshing(true);
      else if (append) setIsLoadingMore(true);
      else if (searchTerm) setIsSearching(true);
      else setIsLoading(true);

      const params = { per_page: PER_PAGE, page };
      if (searchTerm) params.search = searchTerm;

      const res = await getClients(params);
      const list = res?.data || [];
      const meta = res?.meta || {};

      if (append) {
        setClients((prev) => {
          const ids = new Set(prev.map((c) => c.id));
          const unique = list.filter((c) => !ids.has(c.id));
          return [...prev, ...unique];
        });
      } else {
        setClients(list);
      }

      setTotalCount(meta.total ?? list.length);
      setCurrentPage(meta.current_page ?? page);
      setLastPage(meta.last_page ?? page);
    } catch (err) {
      logger.warn('Failed to load clients:', err?.message || err);
      if (!append) {
        setClients([]);
        setTotalCount(0);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
      setIsSearching(false);
    }
  }, []);

  // Fetch once on mount — pull-to-refresh handles subsequent refreshes
  const hasLoaded = useRef(false);
  useEffect(() => {
    if (!hasLoaded.current) {
      hasLoaded.current = true;
      fetchClients({ page: 1, searchTerm: '' });
    }
  }, [fetchClients]);

  // Clean up debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // Debounced server-side search
  const handleSearchChange = useCallback((text) => {
    setSearch(text);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      const term = text.trim();
      activeSearchRef.current = term;
      setIsSearching(true);
      fetchClients({ page: 1, searchTerm: term });
    }, SEARCH_DEBOUNCE_MS);
  }, [fetchClients]);

  const handleClearSearch = useCallback(() => {
    setSearch('');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    activeSearchRef.current = '';
    setIsSearching(true);
    fetchClients({ page: 1, searchTerm: '' });
  }, [fetchClients]);

  const handleRefresh = useCallback(() => {
    fetchClients({ page: 1, searchTerm: activeSearchRef.current, refresh: true });
  }, [fetchClients]);

  const handleLoadMore = useCallback(() => {
    if (isLoadingMore || currentPage >= lastPage) return;
    fetchClients({ page: currentPage + 1, searchTerm: activeSearchRef.current, append: true });
  }, [isLoadingMore, currentPage, lastPage, fetchClients]);

  const renderClient = useCallback(({ item }) => {
    const fullName = `${item.first_name || ''} ${item.last_name || ''}`.trim();
    return (
      <TouchableOpacity
        style={styles.clientCard}
        onPress={() =>
          navigation.navigate(SCREENS.CLIENT_DETAIL, { clientId: item.id })
        }
        activeOpacity={0.7}
      >
        <Avatar
          uri={item.avatar_url}
          name={fullName}
          size={44}
        />
        <View style={styles.clientInfo}>
          <Text style={styles.clientName}>{fullName || 'Client'}</Text>
          <Text style={styles.clientEmail}>{item.email}</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textTertiary} />
      </TouchableOpacity>
    );
  }, [navigation]);

  const ListFooter = useCallback(() => {
    if (isLoadingMore) {
      return (
        <View style={{ paddingVertical: 16, alignItems: 'center' }}>
          <ActivityIndicator size="small" color={colors.accent} />
        </View>
      );
    }
    return null;
  }, [isLoadingMore]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Clients</Text>
        <Text style={styles.headerCount}>
          {totalCount} total
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <MaterialCommunityIcons name="magnify" size={18} color={colors.textTertiary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search clients..."
          placeholderTextColor={colors.textTertiary}
          value={search}
          onChangeText={handleSearchChange}
          autoCorrect={false}
        />
        {isSearching ? (
          <ActivityIndicator size="small" color={colors.accent} />
        ) : search.length > 0 ? (
          <IconButton
            icon="close-circle"
            size={18}
            iconColor={colors.textTertiary}
            onPress={handleClearSearch}
            style={{ margin: 0 }}
          />
        ) : null}
      </View>

      {isLoading ? (
        <ListSkeleton count={6} />
      ) : (
        <FlatList
          data={clients}
          renderItem={renderClient}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={[
            styles.listContent,
            clients.length === 0 && { flex: 1 },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={ListFooter}
          ListEmptyComponent={
            <EmptyState
              icon="account-group-outline"
              title={search ? 'No Results' : 'No Clients Yet'}
              message={
                search
                  ? `No clients match "${search}". Try a different name or email.`
                  : 'Once clients book sessions with you, they\'ll show up here automatically.'
              }
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

export default CoachClientsScreen;
