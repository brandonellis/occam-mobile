import React from 'react';
import { View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text } from 'react-native-paper';
import PropTypes from 'prop-types';
import { bookingStyles as styles } from '../../styles/booking.styles';
import { colors } from '../../theme';

const ConfirmBottomBar = ({
  canConfirm,
  isSubmitting,
  loadingMessage,
  onConfirm,
  buttonLabel,
}) => {
  return (
    <View style={styles.bottomBar}>
      {loadingMessage ? (
        <View style={styles.loadingBar}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.loadingBarText, { color: colors.textSecondary }]}>{loadingMessage}</Text>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.continueButton, !canConfirm && styles.continueButtonDisabled]}
          onPress={onConfirm}
          disabled={!canConfirm}
          activeOpacity={0.8}
          testID="confirm-booking-button"
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.textInverse} />
          ) : (
            <Text style={styles.continueButtonText}>
              {buttonLabel}
            </Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};

ConfirmBottomBar.propTypes = {
  canConfirm: PropTypes.bool.isRequired,
  isSubmitting: PropTypes.bool,
  loadingMessage: PropTypes.string,
  onConfirm: PropTypes.func.isRequired,
  buttonLabel: PropTypes.string.isRequired,
};

export default ConfirmBottomBar;
