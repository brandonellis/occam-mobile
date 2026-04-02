import React from 'react';
import { View, ScrollView } from 'react-native';
import { Text, Button, Portal, Modal, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { colors } from '../../theme';
import { bookingStyles as styles } from '../../styles/booking.styles';

/**
 * Modal showing per-booking results after recurring booking creation.
 * Displays created bookings (green) and failed bookings (red with reason).
 */
const RecurringResultModal = ({ visible, onDismiss, result }) => {
  if (!result) return null;

  const created = result.created_bookings || [];
  const failed = result.failed_bookings || [];
  const createdCount = result.created_count || created.length;
  const failedCount = result.failed_count || failed.length;

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={modalStyles.container}
      >
        <Text variant="titleMedium" style={modalStyles.title}>
          Recurring Booking Results
        </Text>
        <Text variant="bodySmall" style={modalStyles.subtitle}>
          {createdCount} booked, {failedCount} skipped
        </Text>

        <Divider style={modalStyles.divider} />

        <ScrollView style={modalStyles.scrollArea}>
          {/* Created bookings */}
          {created.length > 0 && (
            <View style={modalStyles.section}>
              <Text variant="labelSmall" style={modalStyles.sectionLabel}>BOOKED</Text>
              {created.map((item, index) => (
                <View key={item.booking_id || index} style={modalStyles.resultRow}>
                  <MaterialCommunityIcons name="check-circle" size={18} color={colors.success} />
                  <View style={modalStyles.resultInfo}>
                    <Text variant="bodyMedium" style={modalStyles.resultDate}>{item.date}</Text>
                    <Text variant="bodySmall" style={modalStyles.resultTime}>{item.time}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Failed bookings */}
          {failed.length > 0 && (
            <View style={modalStyles.section}>
              <Text variant="labelSmall" style={modalStyles.sectionLabel}>SKIPPED</Text>
              {failed.map((item, index) => (
                <View key={`failed-${index}`} style={modalStyles.resultRow}>
                  <MaterialCommunityIcons name="close-circle" size={18} color={colors.error} />
                  <View style={modalStyles.resultInfo}>
                    <Text variant="bodyMedium" style={modalStyles.resultDate}>{item.date}</Text>
                    <Text variant="bodySmall" style={modalStyles.resultTime}>{item.time}</Text>
                    {item.reason && (
                      <Text variant="bodySmall" style={modalStyles.resultReason}>{item.reason}</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        <Button mode="contained" onPress={onDismiss} style={modalStyles.doneButton}>
          Done
        </Button>
      </Modal>
    </Portal>
  );
};

const modalStyles = {
  container: {
    backgroundColor: colors.white,
    marginHorizontal: 24,
    borderRadius: 16,
    padding: 20,
    maxHeight: '70%',
  },
  title: {
    color: colors.textPrimary,
    fontWeight: '600',
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  divider: {
    marginVertical: 12,
  },
  scrollArea: {
    maxHeight: 300,
  },
  section: {
    marginBottom: 16,
  },
  sectionLabel: {
    color: colors.textTertiary,
    marginBottom: 8,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 6,
    gap: 10,
  },
  resultInfo: {
    flex: 1,
  },
  resultDate: {
    color: colors.textPrimary,
    fontWeight: '500',
  },
  resultTime: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  resultReason: {
    color: colors.error,
    fontSize: 12,
    marginTop: 2,
  },
  doneButton: {
    marginTop: 12,
  },
};

RecurringResultModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  onDismiss: PropTypes.func.isRequired,
  result: PropTypes.shape({
    created_count: PropTypes.number,
    failed_count: PropTypes.number,
    created_bookings: PropTypes.array,
    failed_bookings: PropTypes.array,
  }),
};

export default RecurringResultModal;
