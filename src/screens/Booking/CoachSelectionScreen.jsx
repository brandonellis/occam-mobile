import React, { useEffect, useCallback } from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { Text, ActivityIndicator, TouchableRipple } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenHeader from '../../components/ScreenHeader';
import Avatar from '../../components/Avatar';
import { bookingStyles as styles } from '../../styles/booking.styles';
import { globalStyles } from '../../styles/global.styles';
import { getCoaches } from '../../services/bookings.api';
import { getAllowedCoachesForService } from '../../services/accounts.api';
import { colors } from '../../theme';
import { SCREENS } from '../../constants/navigation.constants';
import { confirmCancelBooking } from '../../helpers/booking.navigation.helper';
import logger from '../../helpers/logger.helper';

const CoachSelectionScreen = ({ route, navigation }) => {
  const { bookingData = {} } = route.params || {};
  const service = bookingData.service;

  const [state, setState] = React.useState({
    coaches: [],
    isLoading: true,
    error: null,
  });

  const loadCoaches = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      const { data } = await getCoaches();
      let coachList = data || [];

      // Filter to coaches that offer this service (if restrict_coaches is enabled)
      if (service?.restrict_coaches && service?.coach_ids?.length) {
        coachList = coachList.filter((c) => service.coach_ids.includes(c.id));
      }

      // Filter coaches by location availability
      const location = bookingData.location;
      const serviceLocationIds = service?.location_ids || [];

      if (location?.id) {
        // Specific location selected — only show coaches at that location
        coachList = coachList.filter((c) => {
          const coachLocIds = c.location_ids || [];
          return coachLocIds.length === 0 || coachLocIds.includes(location.id);
        });
      } else if (serviceLocationIds.length > 0) {
        // No location yet — show coaches at any of the service's locations
        coachList = coachList.filter((c) => {
          const coachLocIds = c.location_ids || [];
          return coachLocIds.length === 0 || coachLocIds.some((id) => serviceLocationIds.includes(id));
        });
      }

      // Feature 1: Filter coaches by client-coach assignment
      const clientId = bookingData.client?.id;
      if (clientId && service?.id) {
        try {
          const assignmentRes = await getAllowedCoachesForService(clientId, service.id);
          const allowedIds = assignmentRes?.allowed_coach_ids || [];
          if (allowedIds.length > 0) {
            coachList = coachList.filter((c) => allowedIds.includes(c.id));
          }
        } catch (assignErr) {
          logger.warn('Failed to fetch coach assignments, showing all coaches:', assignErr.message);
        }
      }

      setState({ coaches: coachList, isLoading: false, error: null });
    } catch (err) {
      logger.warn('Failed to load coaches:', err.message);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: 'Failed to load coaches.',
      }));
    }
  }, [service?.coach_ids, service?.location_ids, bookingData.location]);

  useEffect(() => {
    loadCoaches();
  }, [loadCoaches]);

  const handleSelectCoach = useCallback(
    (coach) => {
      navigation.navigate(SCREENS.TIME_SLOT_SELECTION, {
        bookingData: { ...bookingData, coach },
      });
    },
    [navigation, bookingData]
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader
        title="Select a Coach"
        onBack={() => navigation.goBack()}
        onClose={() => confirmCancelBooking(navigation)}
      />

      {state.isLoading ? (
        <View style={globalStyles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : state.error ? (
        <View style={globalStyles.errorContainer}>
          <Text style={globalStyles.errorText}>{state.error}</Text>
          <TouchableOpacity onPress={loadCoaches} style={globalStyles.retryButton}>
            <Text style={globalStyles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} testID="coach-selection-list">
          <Text style={styles.sectionHeader}>
            Available coaches for {service?.name}
          </Text>
          {state.coaches.map((coach) => (
            <TouchableRipple
              key={coach.id}
              style={styles.coachCard}
              onPress={() => handleSelectCoach(coach)}
              borderless
              testID={`coach-card-${coach.id}`}
            >
              <View style={styles.coachCardRow}>
                <Avatar
                  uri={coach.avatar_url}
                  name={`${coach.first_name} ${coach.last_name}`}
                  size={48}
                />
                <View style={styles.coachInfo}>
                  <Text style={styles.coachName}>
                    {coach.first_name} {coach.last_name}
                  </Text>
                  {coach.specialty && (
                    <Text style={styles.coachSpecialty}>{coach.specialty}</Text>
                  )}
                </View>
              </View>
            </TouchableRipple>
          ))}
          {state.coaches.length === 0 && (
            <Text style={styles.noSlotsText}>
              No coaches available for this service.
            </Text>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default CoachSelectionScreen;
