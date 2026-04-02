import React from 'react';
import { View } from 'react-native';
import { Text, ActivityIndicator, Button } from 'react-native-paper';
import PropTypes from 'prop-types';
import { bookingStyles as styles } from '../../styles/booking.styles';
import { colors } from '../../theme';

const ConfirmBottomBar = ({
  canConfirm,
  isSubmitting,
  loadingMessage,
  onConfirm,
  buttonLabel,
  onSendPaymentLink,
  showPaymentLinkButton,
}) => {
  return (
    <View style={styles.bottomBar}>
      {loadingMessage ? (
        <View style={styles.loadingBar}>
          <ActivityIndicator animating={true} size="small" color={colors.primary} />
          <Text style={[styles.loadingBarText, { color: colors.textSecondary }]}>{loadingMessage}</Text>
        </View>
      ) : (
        <>
          <Button
            mode="contained"
            style={[styles.continueButton, !canConfirm && styles.continueButtonDisabled]}
            onPress={onConfirm}
            disabled={!canConfirm}
            loading={isSubmitting}
            testID="confirm-booking-button"
            labelStyle={styles.continueButtonText}
          >
            {buttonLabel}
          </Button>
          {showPaymentLinkButton && (
            <Button
              mode="outlined"
              style={{ marginTop: 8 }}
              onPress={onSendPaymentLink}
              disabled={!canConfirm}
              loading={isSubmitting}
              icon="email-send-outline"
              testID="send-payment-link-button"
            >
              Send Payment Link
            </Button>
          )}
        </>
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
  onSendPaymentLink: PropTypes.func,
  showPaymentLinkButton: PropTypes.bool,
};

export default ConfirmBottomBar;
