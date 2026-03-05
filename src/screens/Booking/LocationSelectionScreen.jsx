import React, { useCallback } from 'react';
import { View, ScrollView } from 'react-native';
import { Text, TouchableRipple } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenHeader from '../../components/ScreenHeader';
import EmptyState from '../../components/EmptyState';
import { bookingStyles as styles } from '../../styles/booking.styles';
import { getNextBookingScreen } from '../../helpers/booking.helper';
import useAuth from '../../hooks/useAuth';
import { COACH_ROLES } from '../../constants/auth.constants';

const LocationSelectionScreen = ({ route, navigation }) => {
  const { bookingData = {}, serviceLocations = [] } = route.params || {};
  const { user, activeRole } = useAuth();
  const isCoach = COACH_ROLES.includes(activeRole);

  const handleSelectLocation = useCallback(
    (location) => {
      const updatedData = { ...bookingData, location };
      const { screen, params } = getNextBookingScreen(updatedData, isCoach, user);
      navigation.navigate(screen, params);
    },
    [navigation, bookingData, isCoach, user]
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader
        title="Select a Location"
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} testID="location-selection-list">
        {bookingData.service && (
          <Text style={styles.sectionHeader}>
            Where would you like your {bookingData.service.name}?
          </Text>
        )}
        {serviceLocations.length === 0 && (
          <EmptyState
            icon="map-marker-outline"
            title="No Locations Available"
            message="This service doesn't have any assigned locations. Please go back and try another service."
          />
        )}
        {serviceLocations.map((location) => (
          <TouchableRipple
            key={location.id}
            style={styles.serviceCard}
            onPress={() => handleSelectLocation(location)}
            borderless
            testID={`location-card-${location.id}`}
          >
            <View>
              <Text style={styles.serviceName}>{location.name}</Text>
              {location.address && (
                <Text style={styles.serviceDescription} numberOfLines={2}>
                  {location.address}
                </Text>
              )}
            </View>
          </TouchableRipple>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

export default LocationSelectionScreen;
