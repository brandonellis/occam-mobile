import React from 'react';
import { View, TouchableOpacity, Animated } from 'react-native';
import { Text, Icon } from 'react-native-paper';
import { CardField } from '@stripe/stripe-react-native';
import PropTypes from 'prop-types';
import { bookingStyles as styles } from '../../styles/booking.styles';
import { colors } from '../../theme';

const PaymentMethodSection = ({
  isEditMode,
  isMembershipBooking,
  isPackageBooking,
  isPaymentNotRequired,
  membershipLoading,
  ecommerceLoading,
  isCoach,
  paymentsEnabled,
  cardError,
  onCardChange,
  savedMethods,
  paymentMode,
  selectedSavedMethodId,
  onPaymentModeChange,
  onSelectSavedMethod,
  skeletonAnim,
}) => {
  if (isEditMode) return null;
  // Already know no payment needed — skip entirely
  if (isMembershipBooking || isPackageBooking || isPaymentNotRequired) return null;

  // Show skeleton while membership or ecommerce config is loading
  if (membershipLoading || ecommerceLoading) {
    return (
      <View style={styles.cardSection}>
        <Text style={styles.cardSectionTitle}>Payment Method</Text>
        <Animated.View style={[styles.skeletonBlock, { opacity: skeletonAnim }]}>
          <View style={[styles.skeletonBar, { height: 44, borderRadius: 8 }]} />
        </Animated.View>
      </View>
    );
  }

  // Coach flow: only show card section when payments are enabled
  if (isCoach && !paymentsEnabled) return null;

  if (!paymentsEnabled) {
    return (
      <View style={styles.cardSection}>
        <Text style={styles.cardSectionTitle}>Payment Method</Text>
        <View style={styles.paymentDisabledBanner}>
          <Text style={styles.paymentDisabledText}>
            Card payments are not yet available. Your booking will be created and payment can be collected later.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.cardSection}>
      <Text style={styles.cardSectionTitle}>Payment Method</Text>

      {/* Saved card / New card toggle */}
      {savedMethods.length > 0 && (
        <View style={styles.paymentModeToggle}>
          <TouchableOpacity
            style={[styles.paymentModeOption, paymentMode === 'saved' && styles.paymentModeOptionActive]}
            onPress={() => onPaymentModeChange('saved')}
            activeOpacity={0.7}
          >
            <Text style={[styles.paymentModeText, paymentMode === 'saved' && styles.paymentModeTextActive]}>
              Saved Card
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.paymentModeOption, paymentMode === 'card' && styles.paymentModeOptionActive]}
            onPress={() => onPaymentModeChange('card')}
            activeOpacity={0.7}
          >
            <Text style={[styles.paymentModeText, paymentMode === 'card' && styles.paymentModeTextActive]}>
              New Card
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {paymentMode === 'saved' && savedMethods.length > 0 ? (
        <View>
          {savedMethods.map((method) => {
            const card = method.card || {};
            const isSelected = selectedSavedMethodId === method.id;
            return (
              <TouchableOpacity
                key={method.id}
                style={[styles.savedCardItem, isSelected && styles.savedCardItemSelected]}
                onPress={() => onSelectSavedMethod(method.id)}
                activeOpacity={0.7}
              >
                <View style={styles.savedCardInfo}>
                  <Icon
                    source="credit-card-outline"
                    size={22}
                    color={isSelected ? colors.accent : colors.textTertiary}
                  />
                  <View>
                    <Text style={[styles.savedCardBrand, isSelected && styles.savedCardTextSelected]}>
                      {(card.brand || 'Card').toUpperCase()}
                    </Text>
                    <Text style={[styles.savedCardLast4, isSelected && styles.savedCardTextSelected]}>
                      {'•••• '}{card.last4 || '????'}
                      {card.exp_month && card.exp_year && (
                        <Text style={styles.savedCardExpiry}>
                          {'  '}{String(card.exp_month).padStart(2, '0')}/{String(card.exp_year).slice(-2)}
                        </Text>
                      )}
                    </Text>
                  </View>
                </View>
                <View style={[styles.savedCardRadio, isSelected && styles.savedCardRadioSelected]}>
                  {isSelected && <View style={styles.savedCardRadioDot} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : (
        <>
          <CardField
            postalCodeEnabled={false}
            placeholders={{ number: '4242 4242 4242 4242' }}
            cardStyle={{
              backgroundColor: colors.background,
              textColor: colors.textPrimary,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 8,
              fontSize: 16,
              placeholderColor: colors.textTertiary,
            }}
            style={styles.cardField}
            onCardChange={onCardChange}
          />
          {cardError && <Text style={styles.cardError}>{cardError}</Text>}
        </>
      )}
    </View>
  );
};

PaymentMethodSection.propTypes = {
  isEditMode: PropTypes.bool,
  isMembershipBooking: PropTypes.bool,
  isPackageBooking: PropTypes.bool,
  isPaymentNotRequired: PropTypes.bool,
  membershipLoading: PropTypes.bool,
  ecommerceLoading: PropTypes.bool,
  isCoach: PropTypes.bool,
  paymentsEnabled: PropTypes.bool,
  cardError: PropTypes.string,
  onCardChange: PropTypes.func.isRequired,
  savedMethods: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    card: PropTypes.shape({
      brand: PropTypes.string,
      last4: PropTypes.string,
      exp_month: PropTypes.number,
      exp_year: PropTypes.number,
    }),
  })),
  paymentMode: PropTypes.oneOf(['card', 'saved']),
  selectedSavedMethodId: PropTypes.string,
  onPaymentModeChange: PropTypes.func.isRequired,
  onSelectSavedMethod: PropTypes.func.isRequired,
  skeletonAnim: PropTypes.object,
};

export default PaymentMethodSection;
