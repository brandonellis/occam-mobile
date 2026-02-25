import React, { useEffect, useCallback } from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenHeader from '../../components/ScreenHeader';
import { bookingStyles as styles } from '../../styles/booking.styles';
import { globalStyles } from '../../styles/global.styles';
import { formatDuration } from '../../constants/booking.constants';
import { formatCurrency } from '../../helpers/pricing.helper';
import { getServices } from '../../services/bookings.api';
import useAuth from '../../hooks/useAuth';
import { colors } from '../../theme';
import { SCREENS } from '../../constants/navigation.constants';
import { COACH_ROLES } from '../../constants/auth.constants';

const ServiceSelectionScreen = ({ route, navigation }) => {
  const { bookingData = {} } = route.params || {};
  const [state, setState] = React.useState({
    services: [],
    isLoading: true,
    error: null,
  });

  const loadServices = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      const { data } = await getServices();
      // Filter services by location if location is selected
      let serviceList = data || [];
      if (bookingData.location?.id) {
        serviceList = serviceList.filter(
          (s) => !s.location_id || s.location_id === bookingData.location.id
        );
      }
      setState({ services: serviceList, isLoading: false, error: null });
    } catch (err) {
      console.warn('Failed to load services:', err.message);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: 'Failed to load services. Please try again.',
      }));
    }
  }, [bookingData.location?.id]);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  const { user, activeRole } = useAuth();
  const isCoach = COACH_ROLES.includes(activeRole);

  const handleSelectService = useCallback(
    (service) => {
      const updatedData = { ...bookingData, service };

      // Variable-duration services go to duration selection first
      if (service.is_variable_duration && service.allowed_durations?.length > 0) {
        navigation.navigate(SCREENS.DURATION_SELECTION, {
          bookingData: updatedData,
        });
        return;
      }

      if (service.requires_coach) {
        if (isCoach) {
          navigation.navigate(SCREENS.TIME_SLOT_SELECTION, {
            bookingData: { ...updatedData, coach: user },
          });
        } else {
          navigation.navigate(SCREENS.COACH_SELECTION, {
            bookingData: updatedData,
          });
        }
      } else {
        navigation.navigate(SCREENS.TIME_SLOT_SELECTION, {
          bookingData: { ...updatedData, coach: null },
        });
      }
    },
    [navigation, bookingData, isCoach, user]
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader
        title="Select a Service"
        onBack={() => navigation.goBack()}
      />

      {state.isLoading ? (
        <View style={globalStyles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : state.error ? (
        <View style={globalStyles.errorContainer}>
          <Text style={globalStyles.errorText}>{state.error}</Text>
          <TouchableOpacity onPress={loadServices} style={globalStyles.retryButton}>
            <Text style={globalStyles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {state.services.map((service) => (
            <TouchableOpacity
              key={service.id}
              style={styles.serviceCard}
              onPress={() => handleSelectService(service)}
              activeOpacity={0.7}
            >
              <Text style={styles.serviceName}>{service.name}</Text>
              {service.description && (
                <Text style={styles.serviceDescription} numberOfLines={2}>
                  {service.description}
                </Text>
              )}
              <View style={styles.serviceFooter}>
                <Text style={styles.servicePrice}>
                  {service.is_variable_duration ? 'From ' : ''}
                  {formatCurrency(parseFloat(service.price) || 0)}
                </Text>
                <Text style={styles.serviceDuration}>
                  {formatDuration(service.duration_minutes)}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default ServiceSelectionScreen;
