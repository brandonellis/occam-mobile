import React, { useEffect, useCallback, useRef } from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { Text, ActivityIndicator, TouchableRipple } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenHeader from '../../components/ScreenHeader';
import { bookingStyles as styles } from '../../styles/booking.styles';
import { globalStyles } from '../../styles/global.styles';
import { formatDuration } from '../../constants/booking.constants';
import { formatCurrency } from '../../helpers/pricing.helper';
import { getServices, getLocations } from '../../services/bookings.api';
import { getCurrentClientMembership, getMyMembership } from '../../services/accounts.api';
import { isMembershipActive, buildMembershipAllotments } from '../../helpers/membership.helper';
import { resolveLocationAndRoute } from '../../helpers/booking.helper';
import { confirmCancelBooking } from '../../helpers/booking.navigation.helper';
import { isClassLike } from '../../helpers/normalizers.helper';
import useAuth from '../../hooks/useAuth';
import { colors } from '../../theme';
import { SCREENS } from '../../constants/navigation.constants';
import { COACH_ROLES } from '../../constants/auth.constants';
import logger from '../../helpers/logger.helper';

const ServiceSelectionScreen = ({ route, navigation }) => {
  const { bookingData = {}, rebookHints } = route.params || {};
  const [state, setState] = React.useState({
    services: [],
    isLoading: true,
    error: null,
    membershipFiltered: false,
    membershipPlanName: null,
    membershipAllotments: null,
  });

  const { user, activeRole } = useAuth();
  const isCoach = COACH_ROLES.includes(activeRole);

  // For coach flow, clientId comes from bookingData.client (pre-selected).
  // For client flow, the logged-in user IS the client — use their ID for
  // membership checks so members_only services are shown correctly.
  const clientId = bookingData.client?.id || (!isCoach ? user?.id : null);
  const clientHasMembership = bookingData.client?.membership?.is_active;
  const locationsRef = useRef([]);
  const didAutoSelect = useRef(false);
  const [rebooking, setRebooking] = React.useState(!!rebookHints?.serviceId);

  const loadServices = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      // Membership check:
      //  - Coach flow: use getCurrentClientMembership (staff endpoint) if client has membership
      //  - Client flow: use getMyMembership (client-accessible endpoint)
      const membershipPromise = isCoach
        ? (clientId && clientHasMembership ? getCurrentClientMembership(clientId) : Promise.resolve(null))
        : (clientId ? getMyMembership() : Promise.resolve(null));

      const [servicesRes, locationsRes, membershipRes] = await Promise.allSettled([
        getServices(),
        getLocations(),
        membershipPromise,
      ]);

      let serviceList = servicesRes.status === 'fulfilled' ? (servicesRes.value.data || []) : [];
      const locationList = locationsRes.status === 'fulfilled' ? (locationsRes.value.data || []) : [];
      locationsRef.current = locationList;

      // Determine if client has any active membership (for booking_visibility filtering)
      let hasActiveMembership = false;
      let membershipFiltered = false;
      let membershipPlanName = null;
      let membershipAllotments = null;
      if (membershipRes.status === 'fulfilled' && membershipRes.value?.data) {
        const membership = membershipRes.value.data;
        hasActiveMembership = isMembershipActive(membership);

        // Build per-service allotment map for pricing display (both flows)
        if (hasActiveMembership) {
          membershipAllotments = buildMembershipAllotments(membership);
        }

        // Coach flow: narrow to services covered by the client's membership plan
        // Client flow: show ALL services (matches web ExternalServiceSelection behavior)
        if (isCoach && hasActiveMembership) {
          const planServices = membership.membership_plan?.plan_services || [];
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
      }

      // Hide members_only services for non-member clients
      if (!hasActiveMembership) {
        serviceList = serviceList.filter((s) => s.booking_visibility !== 'members_only');
      }

      // Hide services with online booking disabled (coaches/staff can still book internally)
      if (!isCoach) {
        serviceList = serviceList.filter((s) => s.online_booking_enabled !== false);
      }

      // Filter to only bookable services (must require coach, resource, or be class-like)
      // Matches web's ServiceSelection.jsx — services without any of these produce zero time slots
      serviceList = serviceList.filter((s) => !!(s?.requires_coach || s?.requires_resource || isClassLike(s)));

      setState({
        services: serviceList,
        isLoading: false,
        error: null,
        membershipFiltered,
        membershipPlanName,
        membershipAllotments,
      });
    } catch (err) {
      logger.warn('Failed to load services:', err.message);
      setRebooking(false);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: 'Failed to load services. Please try again.',
      }));
    }
  }, [clientId, clientHasMembership, isCoach]);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  // Rebook auto-select: when services finish loading and rebookHints are present,
  // find the matching service and fast-forward through the flow.
  useEffect(() => {
    if (!rebookHints?.serviceId || state.isLoading || state.error || didAutoSelect.current) return;
    const matchedService = state.services.find((s) => s.id === rebookHints.serviceId);
    if (!matchedService) {
      // Service no longer available — fall through to normal list
      setRebooking(false);
      return;
    }

    didAutoSelect.current = true;

    // Build bookingData with the pre-selected service + optional coach hint
    const baseData = { ...bookingData, service: matchedService };
    if (rebookHints.coachId) baseData.rebookCoachId = rebookHints.coachId;

    const result = resolveLocationAndRoute({
      bookingData: baseData,
      allLocations: locationsRef.current,
      isCoach,
      user,
      preferredLocationId: rebookHints.locationId,
    });

    if (result.resolved) {
      navigation.replace(result.screen, result.params);
    } else {
      navigation.replace(SCREENS.LOCATION_SELECTION, {
        bookingData: result.bookingData,
        serviceLocations: result.serviceLocations,
      });
    }
  }, [rebookHints, state.isLoading, state.error, state.services, bookingData, isCoach, user, navigation]);

  const handleSelectService = useCallback(
    (service) => {
      const result = resolveLocationAndRoute({
        bookingData: { ...bookingData, service },
        allLocations: locationsRef.current,
        isCoach,
        user,
      });

      if (result.resolved) {
        navigation.navigate(result.screen, result.params);
      } else {
        navigation.navigate(SCREENS.LOCATION_SELECTION, {
          bookingData: result.bookingData,
          serviceLocations: result.serviceLocations,
        });
      }
    },
    [navigation, bookingData, isCoach, user]
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {!rebooking && (
        <ScreenHeader
          title="Select a Service"
          onBack={() => navigation.goBack()}
          onClose={() => confirmCancelBooking(navigation)}
        />
      )}

      {(state.isLoading || rebooking) ? (
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
        <ScrollView contentContainerStyle={styles.scrollContent} testID="service-selection-list">
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
          {state.services.map((service) => {
            const allotment = state.membershipAllotments?.[service.id];
            const hasRemainingAllotment = allotment && (allotment.remaining === null || allotment.remaining > 0);
            return (
              <TouchableRipple
                key={service.id}
                style={styles.serviceCard}
                onPress={() => handleSelectService(service)}
                borderless
                testID={`service-card-${service.id}`}
              >
                <View>
                  <Text style={styles.serviceName}>{service.name}</Text>
                  {service.description && (
                    <Text style={styles.serviceDescription} numberOfLines={2}>
                      {service.description}
                    </Text>
                  )}
                  <View style={styles.serviceFooter}>
                    {hasRemainingAllotment ? (
                      <View style={styles.servicePriceGroup}>
                        <Text style={styles.servicePriceOriginal}>
                          {service.is_variable_duration ? 'From ' : ''}
                          {formatCurrency(parseFloat(service.price) || 0)}
                        </Text>
                        <Text style={styles.servicePriceIncluded}>Included</Text>
                      </View>
                    ) : (
                      <Text style={styles.servicePrice}>
                        {service.is_variable_duration ? 'From ' : ''}
                        {formatCurrency(parseFloat(service.price) || 0)}
                      </Text>
                    )}
                    <Text style={styles.serviceDuration}>
                      {formatDuration(service.duration_minutes)}
                    </Text>
                  </View>
                </View>
              </TouchableRipple>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default ServiceSelectionScreen;
