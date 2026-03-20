import React from 'react';
import { View } from 'react-native';
import { bookingStyles as styles } from '../styles/booking.styles';

const BookingStepIndicator = ({ currentStep, totalSteps }) => {
  if (!totalSteps || totalSteps <= 1) return null;

  return (
    <View style={styles.stepIndicator}>
      {Array.from({ length: totalSteps }, (_, i) => {
        const step = i + 1;
        const isActive = step === currentStep;
        const isCompleted = step < currentStep;

        return (
          <View
            key={step}
            style={[
              styles.stepDot,
              isActive && styles.stepDotActive,
              isCompleted && styles.stepDotCompleted,
            ]}
          />
        );
      })}
    </View>
  );
};

export default BookingStepIndicator;
