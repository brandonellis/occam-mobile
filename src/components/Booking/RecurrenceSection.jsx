import React, { useState } from 'react';
import { View } from 'react-native';
import { Text, TextInput, Switch, Menu } from 'react-native-paper';
import { bookingStyles as styles } from '../../styles/booking.styles';
import { colors } from '../../theme';

const FREQUENCY_OPTIONS = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Every 2 Weeks' },
  { value: 'monthly', label: 'Monthly (4 Weeks)' },
];

const RecurrenceSection = ({
  recurrenceEnabled,
  onRecurrenceToggle,
  recurrenceFrequency,
  onFrequencyChange,
  recurrenceOccurrences,
  onOccurrencesChange,
}) => {
  const [frequencyMenuVisible, setFrequencyMenuVisible] = useState(false);

  return (
    <View style={styles.confirmSection}>
      <View style={styles.recurrenceHeader}>
        <Text style={styles.confirmLabel}>REPEAT BOOKING</Text>
        <Switch
          value={recurrenceEnabled}
          onValueChange={onRecurrenceToggle}
          color={colors.accent}
        />
      </View>
      {recurrenceEnabled && (
        <View style={styles.recurrenceFields}>
          <View>
            <Text style={[styles.confirmLabel, styles.recurrenceLabelSpaced]}>FREQUENCY</Text>
            <Menu
              visible={frequencyMenuVisible}
              onDismiss={() => setFrequencyMenuVisible(false)}
              anchor={
                <TextInput
                  mode="outlined"
                  value={FREQUENCY_OPTIONS.find((o) => o.value === recurrenceFrequency)?.label || ''}
                  onFocus={() => setFrequencyMenuVisible(true)}
                  showSoftInputOnFocus={false}
                  right={<TextInput.Icon icon="chevron-down" onPress={() => setFrequencyMenuVisible(true)} />}
                  dense
                />
              }
            >
              {FREQUENCY_OPTIONS.map((opt) => (
                <Menu.Item
                  key={opt.value}
                  title={opt.label}
                  onPress={() => {
                    onFrequencyChange(opt.value);
                    setFrequencyMenuVisible(false);
                  }}
                />
              ))}
            </Menu>
          </View>
          <View>
            <Text style={[styles.confirmLabel, styles.recurrenceLabelSpaced]}>OCCURRENCES</Text>
            <TextInput
              mode="outlined"
              keyboardType="number-pad"
              value={String(recurrenceOccurrences)}
              onChangeText={(v) => {
                const num = parseInt(v, 10);
                if (!isNaN(num)) onOccurrencesChange(Math.max(2, Math.min(26, num)));
                else if (v === '') onOccurrencesChange(2);
              }}
              dense
            />
            <Text style={styles.recurrenceHint}>
              Total sessions including this one (2–26)
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

export default RecurrenceSection;
