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
import { getCurrentClientMembership } from '../../services/accounts.api';
import { isClassLike } from '../../helpers/normalizers.helper';
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

  const loadServices = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const [servicesRes, membershipRes] = await Promise.allSettled([
        getServices(),
        clientId && clientHasMembership
          ? getCurrentClientMembership(clientId)
          : Promise.resolve(null),
      ]);

      let serviceList = servicesRes.status === 'fulfilled' ? (servicesRes.value.data || []) : [];

      // Filter by location if selected
      if (bookingData.location?.id) {
        serviceList = serviceList.filter(
          (s) => !s.location_id || s.location_id === bookingData.location.id
        );
      }

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
  }, [bookingData.location?.id, clientId, clientHasMembership]);

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

      // Class/group services skip coach selection — sessions already have coaches assigned
      if (isClassLike(service)) {
        navigation.navigate(SCREENS.TIME_SLOT_SELECTION, {
          bookingData: { ...updatedData, coach: null },
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
          {state.membershipFiltered && (
            <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
              <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                Showing services covered by {state.membershipPlanName}
              </Text>
            </View>
          )}
          {state.services.length === 0 && !state.isLoading && (
            <View style={{ padding: 24, alignItems: 'center' }}>
              <Text style={{ color: colors.textSecondary, fontSize: 14, textAlign: 'center' }}>
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
