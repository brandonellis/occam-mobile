import React, { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Text, Chip, Icon } from 'react-native-paper';
import { validatePromoCode } from '../services/promotions.api';
import { colors, spacing } from '../theme';
import logger from '../helpers/logger.helper';

/**
 * Promo Code Input Component for mobile booking flow.
 * Allows users to enter and validate promo codes during checkout.
 *
 * @param {Object} props
 * @param {number} props.serviceId - Service ID for validation
 * @param {number} props.locationId - Location ID for validation
 * @param {number} [props.clientId] - Client ID (optional)
 * @param {number} [props.servicePrice] - Service price (optional)
 * @param {Function} props.onApply - Called with discount preview when valid
 * @param {Function} props.onRemove - Called when promo is removed
 * @param {boolean} [props.disabled] - Disable input
 */
const PromoCodeInput = ({
  serviceId,
  locationId,
  clientId,
  servicePrice,
  onApply,
  onRemove,
  disabled = false,
}) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [appliedPromo, setAppliedPromo] = useState(null);

  const handleApply = useCallback(async () => {
    if (!code.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const params = {
        code: code.trim(),
        service_id: serviceId,
        location_id: locationId,
      };
      if (clientId) params.client_id = clientId;
      if (servicePrice != null) params.service_price = servicePrice;

      const result = await validatePromoCode(params);

      if (result?.success && result?.data) {
        setAppliedPromo(result.data);
        onApply?.(result.data);
      } else {
        setError(result?.message || 'Invalid promo code.');
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.errors?.promotion_code?.[0] ||
        'Invalid promo code.';
      setError(msg);
      logger.warn('Promo code validation failed:', msg);
    } finally {
      setLoading(false);
    }
  }, [code, serviceId, locationId, clientId, servicePrice, onApply]);

  const handleRemove = useCallback(() => {
    setAppliedPromo(null);
    setCode('');
    setError(null);
    onRemove?.();
  }, [onRemove]);

  if (appliedPromo) {
    return (
      <View style={styles.container}>
        <View style={styles.appliedRow}>
          <Icon source="check-circle" size={20} color={colors.success} />
          <Chip
            mode="flat"
            onClose={handleRemove}
            style={styles.appliedChip}
            textStyle={styles.appliedChipText}
          >
            {appliedPromo.code}
          </Chip>
          <Text style={styles.discountText}>{appliedPromo.description}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <TextInput
          mode="outlined"
          placeholder="Promo code"
          value={code}
          onChangeText={(text) => {
            setCode(text.toUpperCase());
            if (error) setError(null);
          }}
          onSubmitEditing={handleApply}
          disabled={disabled || loading}
          error={!!error}
          dense
          left={<TextInput.Icon icon="gift-outline" />}
          style={styles.input}
          autoCapitalize="characters"
        />
        <Button
          mode="outlined"
          onPress={handleApply}
          loading={loading}
          disabled={disabled || !code.trim()}
          compact
          style={styles.applyButton}
        >
          Apply
        </Button>
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.sm,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    fontSize: 14,
    letterSpacing: 1,
  },
  applyButton: {
    marginTop: 6,
  },
  appliedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  appliedChip: {
    backgroundColor: colors.successLight,
  },
  appliedChipText: {
    fontWeight: '600',
    letterSpacing: 1,
  },
  discountText: {
    color: colors.success,
    fontSize: 13,
    fontWeight: '500',
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: 4,
  },
});

export default PromoCodeInput;
