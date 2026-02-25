import React, { useEffect, useCallback } from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenHeader from '../../components/ScreenHeader';
import Avatar from '../../components/Avatar';
import { bookingStyles as styles } from '../../styles/booking.styles';
import { globalStyles } from '../../styles/global.styles';
import { getCoaches } from '../../services/bookings.api';
import { colors } from '../../theme';
import { SCREENS } from '../../constants/navigation.constants';

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
      // Filter to active coaches that offer this service (if service has coach_ids)
      let coachList = data || [];
      if (service?.coach_ids?.length) {
        coachList = coachList.filter((c) => service.coach_ids.includes(c.id));
      }
      setState({ coaches: coachList, isLoading: false, error: null });
    } catch (err) {
      console.warn('Failed to load coaches:', err.message);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: 'Failed to load coaches.',
      }));
    }
  }, [service?.coach_ids]);

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
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.sectionHeader}>
            Available coaches for {service?.name}
          </Text>
          {state.coaches.map((coach) => (
            <TouchableOpacity
              key={coach.id}
              style={styles.coachCard}
              onPress={() => handleSelectCoach(coach)}
              activeOpacity={0.7}
            >
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
            </TouchableOpacity>
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
