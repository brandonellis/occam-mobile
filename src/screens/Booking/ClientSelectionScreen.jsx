import React, { useEffect, useCallback, useState, useRef, useMemo } from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Searchbar, TouchableRipple, TextInput, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import ScreenHeader from '../../components/ScreenHeader';
import { ListSkeleton } from '../../components/SkeletonLoader';
import Avatar from '../../components/Avatar';
import { bookingStyles as styles } from '../../styles/booking.styles';
import { globalStyles } from '../../styles/global.styles';
import { getClients, createClient } from '../../services/accounts.api';
import { colors } from '../../theme';
import { SCREENS } from '../../constants/navigation.constants';
import { confirmCancelBooking } from '../../helpers/booking.navigation.helper';
import logger from '../../helpers/logger.helper';

const ClientSelectionScreen = ({ route, navigation }) => {
  const { bookingData = {} } = route.params || {};
  const isEditMode = Boolean(bookingData.editMode);
  const allowNewClient = !isEditMode;
  const initialSelectedClient = bookingData.client?.id ? bookingData.client : null;
  const initialClientMode = isEditMode ? 'existing' : (bookingData.client && !bookingData.client.id ? 'new' : 'existing');
  const initialNewClient = {
    first_name: bookingData.client?.id ? '' : (bookingData.client?.first_name || ''),
    last_name: bookingData.client?.id ? '' : (bookingData.client?.last_name || ''),
    email: bookingData.client?.id ? '' : (bookingData.client?.email || ''),
    phone: bookingData.client?.details?.phone || bookingData.client?.phone || '',
  };

  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(initialSelectedClient);
  const [clientMode, setClientMode] = useState(initialClientMode);
  const [newClient, setNewClient] = useState(initialNewClient);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [listError, setListError] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  const loadClients = useCallback(async () => {
    if (clientMode !== 'existing') {
      setIsLoading(false);
      setListError(null);
      return;
    }

    try {
      setIsLoading(true);
      setListError(null);
      const params = { per_page: 50 };
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      const response = await getClients(params);
      const clientList = response?.data || [];
      setClients(clientList);
      if (selectedClient?.id) {
        const refreshedSelectedClient = clientList.find((client) => client.id === selectedClient.id);
        if (refreshedSelectedClient) {
          setSelectedClient(refreshedSelectedClient);
        }
      }
    } catch (err) {
      logger.warn('Failed to load clients:', err?.message || err);
      setListError('Failed to load clients.');
    } finally {
      setIsLoading(false);
    }
  }, [clientMode, debouncedSearch, selectedClient?.id]);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  const handleContinueToServices = useCallback(
    (client) => {
      navigation.navigate(SCREENS.SERVICE_SELECTION, {
        bookingData: { ...bookingData, client },
      });
    },
    [bookingData, navigation]
  );

  const updateNewClient = useCallback((field, value) => {
    setNewClient((prev) => ({ ...prev, [field]: value }));
    setSubmitError(null);
  }, []);

  const canCreateClient = useMemo(() => {
    return Boolean(
      newClient.first_name.trim()
      && newClient.last_name.trim()
      && newClient.email.trim()
    );
  }, [newClient]);

  const handleSubmit = useCallback(async () => {
    if (clientMode === 'existing') {
      if (!selectedClient?.id) {
        setSubmitError('Please select an existing client.');
        return;
      }
      handleContinueToServices(selectedClient);
      return;
    }

    if (!allowNewClient) {
      setSubmitError('Bookings can only be reassigned to an existing client when editing.');
      return;
    }

    if (!canCreateClient) {
      setSubmitError('First name, last name, and email are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const payload = {
        first_name: newClient.first_name.trim(),
        last_name: newClient.last_name.trim(),
        email: newClient.email.trim(),
      };

      if (newClient.phone.trim()) {
        payload.details = { phone: newClient.phone.trim() };
      }

      const result = await createClient(payload);
      const createdClient = result?.data || result;

      if (!createdClient?.id) {
        throw new Error('Invalid client creation response');
      }

      handleContinueToServices(createdClient);
    } catch (err) {
      logger.warn('Failed to create client:', err?.message || err);
      const validationErrors = err?.response?.data?.errors;
      const firstError = validationErrors
        ? Object.values(validationErrors).flat().find(Boolean)
        : null;
      setSubmitError(firstError || err?.response?.data?.message || 'Failed to create client.');
    } finally {
      setIsSubmitting(false);
    }
  }, [allowNewClient, canCreateClient, clientMode, handleContinueToServices, newClient, selectedClient]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader
        title={isEditMode ? 'Update Booking' : 'Select a Client'}
        onBack={() => navigation.goBack()}
        onClose={() => confirmCancelBooking(navigation)}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} testID="client-selection-list">
        <Text style={styles.sectionHeader}>Who is this booking for?</Text>

        <View style={styles.clientTypeRow}>
          <TouchableRipple
            style={[styles.clientTypeCard, clientMode === 'existing' && styles.clientTypeCardActive]}
            onPress={() => {
              setClientMode('existing');
              setSubmitError(null);
            }}
            borderless
          >
            <View style={styles.clientTypeCardContent}>
              <View style={styles.clientTypeIconWrap}>
                <MaterialCommunityIcons name="account-outline" size={20} color={colors.accent} />
              </View>
              <Text style={styles.clientTypeTitle}>Existing Client</Text>
              <Text style={styles.clientTypeDescription}>Select from your client list</Text>
            </View>
          </TouchableRipple>

          {allowNewClient && (
            <TouchableRipple
              style={[styles.clientTypeCard, clientMode === 'new' && styles.clientTypeCardActive]}
              onPress={() => {
                setClientMode('new');
                setSubmitError(null);
              }}
              borderless
            >
              <View style={styles.clientTypeCardContent}>
                <View style={styles.clientTypeIconWrap}>
                  <MaterialCommunityIcons name="account-plus-outline" size={20} color={colors.accent} />
                </View>
                <Text style={styles.clientTypeTitle}>New Client</Text>
                <Text style={styles.clientTypeDescription}>Create a client and book for them</Text>
              </View>
            </TouchableRipple>
          )}
        </View>

        {submitError ? (
          <View style={styles.clientInlineError}>
            <Text style={styles.clientInlineErrorText}>{submitError}</Text>
          </View>
        ) : null}

        {clientMode === 'existing' ? (
          <>
            <Searchbar
              placeholder="Search clients..."
              value={search}
              onChangeText={setSearch}
              style={styles.clientSearchbar}
            />

            {isLoading ? (
              <ListSkeleton count={5} />
            ) : listError ? (
              <View style={globalStyles.errorContainer}>
                <Text style={globalStyles.errorText}>{listError}</Text>
                <TouchableOpacity onPress={loadClients} style={globalStyles.retryButton}>
                  <Text style={globalStyles.retryText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {clients.map((client) => (
                  <TouchableRipple
                    key={client.id}
                    style={[
                      styles.coachCard,
                      selectedClient?.id === client.id && styles.coachCardSelected,
                    ]}
                    onPress={() => {
                      setSelectedClient(client);
                      setSubmitError(null);
                    }}
                    borderless
                    testID={`client-card-${client.id}`}
                  >
                    <View style={styles.coachCardRow}>
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
                    </View>
                  </TouchableRipple>
                ))}
                {clients.length === 0 && !isLoading && (
                  <Text style={styles.noSlotsText}>No clients found.</Text>
                )}
              </>
            )}
          </>
        ) : (
          <View style={styles.clientFormCard}>
            <TextInput
              mode="outlined"
              label="First Name *"
              value={newClient.first_name}
              onChangeText={(value) => updateNewClient('first_name', value)}
              style={styles.clientFormField}
              autoCapitalize="words"
            />
            <TextInput
              mode="outlined"
              label="Last Name *"
              value={newClient.last_name}
              onChangeText={(value) => updateNewClient('last_name', value)}
              style={styles.clientFormField}
              autoCapitalize="words"
            />
            <TextInput
              mode="outlined"
              label="Email *"
              value={newClient.email}
              onChangeText={(value) => updateNewClient('email', value)}
              style={styles.clientFormField}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TextInput
              mode="outlined"
              label="Phone"
              value={newClient.phone}
              onChangeText={(value) => updateNewClient('phone', value)}
              style={styles.clientFormFieldLast}
              keyboardType="phone-pad"
            />
          </View>
        )}
      </ScrollView>

      <View style={styles.bottomBar}>
        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={isSubmitting}
          disabled={isSubmitting || (clientMode === 'existing' ? !selectedClient?.id : !canCreateClient)}
          style={styles.clientContinueButton}
          contentStyle={styles.clientContinueButtonContent}
          labelStyle={styles.clientContinueButtonLabel}
        >
          {clientMode === 'existing' ? 'Continue to Services' : 'Create Client & Continue'}
        </Button>
      </View>
    </SafeAreaView>
  );
};

ClientSelectionScreen.propTypes = {
  route: PropTypes.shape({
    params: PropTypes.shape({
      bookingData: PropTypes.object,
    }),
  }),
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
    goBack: PropTypes.func.isRequired,
  }).isRequired,
};

export default ClientSelectionScreen;
