import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Pressable, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';
import { colors } from '../../theme/colors';
import { agentFeedbackStyles as styles } from '../../styles/agentFeedback.styles';
import { haptic } from '../../helpers/haptic.helper';

const NEGATIVE_REASONS = [
  { value: 'unhelpful', label: 'Not helpful' },
  { value: 'wrong_info', label: 'Wrong info' },
  { value: 'slow', label: 'Too slow' },
  { value: 'confusing', label: 'Confusing' },
];

const AgentFeedbackButtons = ({ onSubmit }) => {
  const [rating, setRating] = useState(null);
  const [showReasons, setShowReasons] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleRate = useCallback((value) => {
    haptic.light();
    setRating(value);
    if (value === 2) {
      onSubmit({ rating: 2 });
      setSubmitted(true);
      setShowReasons(false);
    } else {
      setShowReasons(true);
    }
  }, [onSubmit]);

  const handleReason = useCallback((reason) => {
    onSubmit({ rating: 1, reason });
    setSubmitted(true);
    setShowReasons(false);
  }, [onSubmit]);

  if (submitted && !showReasons) {
    return (
      <View style={styles.container}>
        <Icon
          source={rating === 2 ? 'thumb-up' : 'thumb-down'}
          size={14}
          color={rating === 2 ? colors.success : colors.error}
        />
        <Text style={styles.thanks}>Thanks for the feedback</Text>
      </View>
    );
  }

  return (
    <View>
      <View style={styles.container}>
        <Pressable
          onPress={() => handleRate(2)}
          style={[styles.button, rating === 2 && styles.buttonActive]}
          accessibilityLabel="Helpful"
          accessibilityRole="button"
        >
          <Icon source="thumb-up-outline" size={16} color={rating === 2 ? colors.accent : colors.textSecondary} />
        </Pressable>
        <Pressable
          onPress={() => handleRate(1)}
          style={[styles.button, rating === 1 && styles.buttonActive]}
          accessibilityLabel="Not helpful"
          accessibilityRole="button"
        >
          <Icon source="thumb-down-outline" size={16} color={rating === 1 ? colors.error : colors.textSecondary} />
        </Pressable>
      </View>
      {showReasons ? (
        <View style={styles.reasons}>
          {NEGATIVE_REASONS.map((r) => (
            <Pressable
              key={r.value}
              onPress={() => handleReason(r.value)}
              style={styles.reasonChip}
              accessibilityLabel={r.label}
              accessibilityRole="button"
            >
              <Text style={styles.reasonText}>{r.label}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
};

AgentFeedbackButtons.propTypes = {
  onSubmit: PropTypes.func.isRequired,
};

export default React.memo(AgentFeedbackButtons);
