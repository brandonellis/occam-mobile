import React, { useEffect, useCallback, useState, useRef } from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenHeader from '../../components/ScreenHeader';
import { bookingStyles as styles } from '../../styles/booking.styles';
import { globalStyles } from '../../styles/global.styles';
import { getLocations } from '../../services/bookings.api';
import { colors } from '../../theme';
import { SCREENS } from '../../constants/navigation.constants';

const LocationSelectionScreen = ({ route, navigation }) => {
  const { bookingData = {} } = route.params || {};
  const bookingDataRef = useRef(bookingData);
  bookingDataRef.current = bookingData;

  const [locations, setLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadLocations = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { data } = await getLocations();
      const locationList = data || [];

      // If only one location, auto-select and skip
      if (locationList.length === 1) {
        navigation.replace(SCREENS.SERVICE_SELECTION, {
          bookingData: { ...bookingDataRef.current, location: locationList[0] },
        });
        return;
      }

      setLocations(locationList);
    } catch (err) {
      console.warn('Failed to load locations:', err.message);
      setError('Failed to load locations.');
    } finally {
      setIsLoading(false);
    }
  }, [navigation]);

  useEffect(() => {
    loadLocations();
  }, [loadLocations]);

  const handleSelectLocation = useCallback(
    (location) => {
      navigation.navigate(SCREENS.SERVICE_SELECTION, {
        bookingData: { ...bookingData, location },
      });
    },
    [navigation, bookingData]
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader
        title="Select a Location"
        onBack={() => navigation.goBack()}
      />

      {isLoading ? (
        <View style={globalStyles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={globalStyles.errorContainer}>
          <Text style={globalStyles.errorText}>{error}</Text>
          <TouchableOpacity onPress={loadLocations} style={globalStyles.retryButton}>
            <Text style={globalStyles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {locations.map((location) => (
            <TouchableOpacity
              key={location.id}
              style={styles.serviceCard}
              onPress={() => handleSelectLocation(location)}
              activeOpacity={0.7}
            >
              <Text style={styles.serviceName}>{location.name}</Text>
              {location.address && (
                <Text style={styles.serviceDescription} numberOfLines={2}>
                  {location.address}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default LocationSelectionScreen;
