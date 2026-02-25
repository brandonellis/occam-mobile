import React, { useEffect, useCallback, useState, useRef } from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Searchbar, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenHeader from '../../components/ScreenHeader';
import Avatar from '../../components/Avatar';
import { bookingStyles as styles } from '../../styles/booking.styles';
import { globalStyles } from '../../styles/global.styles';
import { getClients } from '../../services/bookings.api';
import { colors } from '../../theme';
import { SCREENS } from '../../constants/navigation.constants';

const ClientSelectionScreen = ({ route, navigation }) => {
  const { bookingData = {} } = route.params || {};
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const debounceRef = useRef(null);

  // Debounce search input (300ms)
  useEffect(() => {
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  const loadClients = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const params = { per_page: 50 };
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      const response = await getClients(params);
      setClients(response?.data || []);
    } catch {
      setError('Failed to load clients.');
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  const handleSelectClient = useCallback(
    (client) => {
      navigation.navigate(SCREENS.LOCATION_SELECTION, {
        bookingData: { ...bookingData, client },
      });
    },
    [navigation, bookingData]
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader
        title="Select a Client"
        onBack={() => navigation.goBack()}
      />

      <Searchbar
        placeholder="Search clients..."
        value={search}
        onChangeText={setSearch}
        style={{ marginHorizontal: 16, marginVertical: 12, backgroundColor: colors.surface, elevation: 0 }}
      />

      {isLoading ? (
        <View style={globalStyles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={globalStyles.errorContainer}>
          <Text style={globalStyles.errorText}>{error}</Text>
          <TouchableOpacity onPress={loadClients} style={globalStyles.retryButton}>
            <Text style={globalStyles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {clients.map((client) => (
            <TouchableOpacity
              key={client.id}
              style={styles.coachCard}
              onPress={() => handleSelectClient(client)}
              activeOpacity={0.7}
            >
              <Avatar
                uri={client.avatar_url}
                name={`${client.first_name} ${client.last_name}`}
                size={48}
              />
              <View style={styles.coachInfo}>
                <Text style={styles.coachName}>
                  {client.first_name} {client.last_name}
                </Text>
                {client.email && (
                  <Text style={styles.coachSpecialty}>{client.email}</Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
          {clients.length === 0 && !isLoading && (
            <Text style={styles.noSlotsText}>No clients found.</Text>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default ClientSelectionScreen;
