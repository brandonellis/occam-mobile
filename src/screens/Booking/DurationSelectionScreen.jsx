import React, { useCallback, useState } from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenHeader from '../../components/ScreenHeader';
import { bookingStyles as styles } from '../../styles/booking.styles';
import { formatDuration } from '../../constants/booking.constants';
import { calculateEffectivePrice, formatCurrency } from '../../helpers/pricing.helper';
import { SCREENS } from '../../constants/navigation.constants';
import useAuth from '../../hooks/useAuth';
import { COACH_ROLES } from '../../constants/auth.constants';

const DurationSelectionScreen = ({ route, navigation }) => {
  const { bookingData = {} } = route.params || {};
  const { service } = bookingData;
  const { user, activeRole } = useAuth();
  const isCoach = COACH_ROLES.includes(activeRole);

  const [selectedDuration, setSelectedDuration] = useState(null);

  const allowedDurations = service?.allowed_durations || [];

  const handleContinue = useCallback(() => {
    if (!selectedDuration) return;

    const updatedBookingData = {
      ...bookingData,
      duration_minutes: selectedDuration,
    };

    // Same routing logic as ServiceSelectionScreen: coach auto-sets self, client picks coach
    if (service?.requires_coach) {
      if (isCoach) {
        navigation.navigate(SCREENS.TIME_SLOT_SELECTION, {
          bookingData: { ...updatedBookingData, coach: user },
        });
      } else {
        navigation.navigate(SCREENS.COACH_SELECTION, {
          bookingData: updatedBookingData,
        });
      }
    } else {
      navigation.navigate(SCREENS.TIME_SLOT_SELECTION, {
        bookingData: { ...updatedBookingData, coach: null },
      });
    }
  }, [selectedDuration, bookingData, service, navigation, isCoach, user]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader
        title="Select Duration"
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionHeader}>
          Choose a duration for {service?.name}
        </Text>

        {allowedDurations.map((minutes) => {
          const isSelected = selectedDuration === minutes;
          const price = calculateEffectivePrice(service, minutes);

          return (
            <TouchableOpacity
              key={minutes}
              style={[
                styles.durationCard,
                isSelected && styles.durationCardSelected,
              ]}
              onPress={() => setSelectedDuration(minutes)}
              activeOpacity={0.7}
            >
              <Text style={styles.durationLabel}>
                {formatDuration(minutes)}
              </Text>
              <Text style={styles.durationPrice}>
                {formatCurrency(price)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.continueButton, !selectedDuration && styles.continueButtonDisabled]}
          onPress={handleContinue}
          disabled={!selectedDuration}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default DurationSelectionScreen;
