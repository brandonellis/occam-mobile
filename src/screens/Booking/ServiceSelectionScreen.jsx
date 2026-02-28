import React, { useEffect, useCallback, useRef } from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenHeader from '../../components/ScreenHeader';
import { bookingStyles as styles } from '../../styles/booking.styles';
import { globalStyles } from '../../styles/global.styles';
import { formatDuration } from '../../constants/booking.constants';
import { formatCurrency } from '../../helpers/pricing.helper';
import { getServices, getLocations } from '../../services/bookings.api';
import { getCurrentClientMembership } from '../../services/accounts.api';
import { getNextBookingScreen, getServiceLocations } from '../../helpers/booking.helper';
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
    membershipFiltered: false,
    membershipPlanName: null,
  });

  const clientId = bookingData.client?.id;
  const clientHasMembership = !!bookingData.client?.membership?.is_active;
  const locationsRef = useRef([]);

  const loadServices = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const [servicesRes, locationsRes, membershipRes] = await Promise.allSettled([
        getServices(),
        getLocations(),
        clientId && clientHasMembership
          ? getCurrentClientMembership(clientId)
          : Promise.resolve(null),
      ]);

      let serviceList = servicesRes.status === 'fulfilled' ? (servicesRes.value.data || []) : [];
      const locationList = locationsRes.status === 'fulfilled' ? (locationsRes.value.data || []) : [];
      locationsRef.current = locationList;

      // Filter by membership services if client has an active membership
      let membershipFiltered = false;
      let membershipPlanName = null;
      if (membershipRes.status === 'fulfilled' && membershipRes.value?.data) {
        const membership = membershipRes.value.data;
        const planServices = membership.membership_plan?.plan_services || [];

        // Get service IDs that have remaining uses
        const coveredServiceIds = planServices
          .filter((ps) => ps.remaining_quantity === null || ps.remaining_quantity > 0)
          .map((ps) => ps.service_id || ps.service?.id)
          .filter(Boolean);

        if (coveredServiceIds.length > 0) {
          serviceList = serviceList.filter((s) => coveredServiceIds.includes(s.id));
          membershipFiltered = true;
          membershipPlanName = membership.membership_plan?.name || 'Membership';
        }
      }

      setState({
        services: serviceList,
        isLoading: false,
        error: null,
        membershipFiltered,
        membershipPlanName,
      });
    } catch (err) {
      console.warn('Failed to load services:', err.message);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: 'Failed to load services. Please try again.',
      }));
    }
  }, [clientId, clientHasMembership]);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  const { user, activeRole } = useAuth();
  const isCoach = COACH_ROLES.includes(activeRole);

  const handleSelectService = useCallback(
    (service) => {
      const updatedData = { ...bookingData, service, location: null };

      // Resolve location from service's attached locations
      const effectiveLocations = getServiceLocations(service, locationsRef.current);

      if (effectiveLocations.length === 1) {
        // Single location — auto-set and proceed
        updatedData.location = effectiveLocations[0];
        const { screen, params } = getNextBookingScreen(updatedData, isCoach, user);
        navigation.navigate(screen, params);
      } else if (effectiveLocations.length > 1) {
        // Multiple locations — show location picker
        navigation.navigate(SCREENS.LOCATION_SELECTION, {
          bookingData: updatedData,
          serviceLocations: effectiveLocations,
        });
      } else {
        // No locations (shouldn't happen) — proceed anyway
        const { screen, params } = getNextBookingScreen(updatedData, isCoach, user);
        navigation.navigate(screen, params);
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
          {state.membershipFiltered && (
            <View style={styles.membershipHint}>
              <Text style={styles.membershipHintText}>
                Showing services covered by {state.membershipPlanName}
              </Text>
            </View>
          )}
          {state.services.length === 0 && !state.isLoading && (
            <View style={styles.emptyServiceContainer}>
              <Text style={styles.emptyServiceText}>
                {state.membershipFiltered
                  ? 'No services with remaining uses on this membership.'
                  : 'No services available.'}
              </Text>
            </View>
          )}
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
