import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Avatar from '../../components/Avatar';
import EmptyState from '../../components/EmptyState';
import { SCREENS } from '../../constants/navigation.constants';
import { getClients } from '../../services/accounts.api';
import { colors, typography, spacing, borderRadius, shadows } from '../../theme';
import { StyleSheet } from 'react-native';

const CoachClientsScreen = ({ navigation }) => {
  const [clients, setClients] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadClients = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setIsRefreshing(true);
      else setIsLoading(true);

      const { data } = await getClients();
      const list = data || [];
      setClients(list);
      setFiltered(list);
    } catch {
      setClients([]);
      setFiltered([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(clients);
      return;
    }
    const q = search.toLowerCase();
    setFiltered(
      clients.filter((c) => {
        const name = `${c.first_name || ''} ${c.last_name || ''}`.toLowerCase();
        const email = (c.email || '').toLowerCase();
        return name.includes(q) || email.includes(q);
      })
    );
  }, [search, clients]);

  const renderClient = ({ item }) => {
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
        <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Clients</Text>
        <Text style={styles.headerCount}>
          {clients.length} total
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={colors.textTertiary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search clients..."
          placeholderTextColor={colors.textTertiary}
          value={search}
          onChangeText={setSearch}
          autoCorrect={false}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          renderItem={renderClient}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={[
            styles.listContent,
            filtered.length === 0 && { flex: 1 },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => loadClients(true)}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="people-outline"
              title={search ? 'No Results' : 'No Clients Yet'}
              message={
                search
                  ? `No clients match "${search}".`
                  : 'Your clients will appear here once they book sessions.'
              }
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  headerTitle: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  headerCount: {
    ...typography.body,
    color: colors.textTertiary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 44,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    paddingVertical: spacing.sm,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxxl,
  },
  clientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  clientInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  clientName: {
    ...typography.label,
    color: colors.textPrimary,
    fontSize: 15,
  },
  clientEmail: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 1,
  },
});

export default CoachClientsScreen;
