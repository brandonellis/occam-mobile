import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { View } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenHeader from '../../components/ScreenHeader';
import { globalStyles } from '../../styles/global.styles';
import { colors } from '../../theme';
import { getServices } from '../../services/bookings.api';
import { SCREENS } from '../../constants/navigation.constants';
import logger from '../../helpers/logger.helper';

/**
 * Resolves Caddie-generated booking deep links (/book?service_id=X&start_time=Y...)
 * and navigates to the appropriate booking flow step with pre-filled data.
 */
const BookingDeepLinkScreen = ({ navigation, route }) => {
  const params = route.params || {};
  const resolved = useRef(false);

  useEffect(() => {
    if (resolved.current) return;
    resolved.current = true;

    const resolve = async () => {
      try {
        const serviceId = params.service_id ? Number(params.service_id) : null;
        const startTime = params.start_time || null;
        const date = params.date || null;

        if (!serviceId) {
          // No service specified — go to service selection
          navigation.replace(SCREENS.SERVICE_SELECTION, { bookingData: {} });
          return;
        }

        // Load services to find the matching one
        const result = await getServices();
        const services = result?.data || [];
        const service = services.find((s) => s.id === serviceId);

        if (!service) {
          logger.warn('BookingDeepLink: service not found', { serviceId });
          navigation.replace(SCREENS.SERVICE_SELECTION, { bookingData: {} });
          return;
        }

        const bookingData = { service };

        // Pre-fill time slot if start_time is provided
        if (startTime) {
          const endTime = params.end_time || null;
          bookingData.date = date || startTime;
          bookingData.timeSlot = {
            start_time: startTime,
            end_time: endTime,
          };
        }

        // Build rebook hints for service selection to fast-forward through
        const rebookHints = {
          serviceId,
          coachId: params.coach_id ? Number(params.coach_id) : undefined,
          locationId: params.location_id ? Number(params.location_id) : undefined,
        };

        // Navigate to service selection with rebook hints to auto-resolve
        navigation.replace(SCREENS.SERVICE_SELECTION, {
          bookingData,
          rebookHints,
        });
      } catch (err) {
        logger.warn('BookingDeepLink: resolution failed', err.message);
        navigation.replace(SCREENS.SERVICE_SELECTION, { bookingData: {} });
      }
    };

    resolve();
  }, [navigation, params]);

  return (
    <SafeAreaView style={globalStyles.loadingContainer} edges={['top']}>
      <ScreenHeader title="Loading..." onBack={() => navigation.goBack()} />
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text variant="bodyMedium" style={{ color: colors.textSecondary, marginTop: 12 }}>
          Setting up your booking...
        </Text>
      </View>
    </SafeAreaView>
  );
};

BookingDeepLinkScreen.propTypes = {
  navigation: PropTypes.object.isRequired,
  route: PropTypes.object.isRequired,
};

export default BookingDeepLinkScreen;
