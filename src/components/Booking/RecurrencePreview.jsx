import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getAvailableTimeSlots } from '../../services/availability.service';
import { formatDateInTz, formatTimeInTz } from '../../helpers/timezone.helper';
import { haptic } from '../../helpers/haptic.helper';
import { bookingStyles as styles } from '../../styles/booking.styles';
import { colors } from '../../theme';
import dayjs from 'dayjs';

const FREQUENCY_DAYS = { weekly: 7, biweekly: 14, monthly: 28 };

const buildSeries = (startTime, endTime, occurrences, frequency) => {
  if (!startTime || !endTime) return [];
  const baseStart = dayjs(startTime);
  const baseEnd = dayjs(endTime);
  const total = Math.max(1, Math.min(26, Number(occurrences) || 1));
  const daysBetween = FREQUENCY_DAYS[frequency] || 7;
  const items = [];
  for (let i = 0; i < total; i++) {
    items.push({
      index: i + 1,
      start: baseStart.add(daysBetween * i, 'day'),
      end: baseEnd.add(daysBetween * i, 'day'),
    });
  }
  return items;
};

const statusIcon = (status) => {
  switch (status) {
    case 'ok':
      return <MaterialCommunityIcons name="check-circle" size={18} color={colors.success} accessibilityLabel="Available" />;
    case 'fail':
      return <MaterialCommunityIcons name="close-circle" size={18} color={colors.error} accessibilityLabel="Not available" />;
    case 'warn':
      return <MaterialCommunityIcons name="alert-circle" size={18} color={colors.warningDark || colors.warning} accessibilityLabel="Could not verify" />;
    default:
      return null;
  }
};

const RecurrencePreview = ({
  timeSlot,
  recurrenceFrequency,
  recurrenceOccurrences,
  service,
  coach,
  location,
  selectedResource,
  company,
  onPreviewComplete,
}) => {
  const [previewItems, setPreviewItems] = useState([]);
  const [checking, setChecking] = useState(false);
  const [checked, setChecked] = useState(false);
  const [progress, setProgress] = useState(0);
  const abortRef = useRef(null);
  const prevKeyRef = useRef('');

  const configKey = `${timeSlot?.start_time}-${recurrenceFrequency}-${recurrenceOccurrences}`;
  useEffect(() => {
    if (configKey !== prevKeyRef.current) {
      prevKeyRef.current = configKey;
      setChecked(false);
      setPreviewItems([]);
      setProgress(0);
      onPreviewComplete?.(false);
    }
  }, [configKey, onPreviewComplete]);

  const checkAvailability = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setChecking(true);
    setChecked(false);
    setProgress(0);
    setPreviewItems([]);

    const series = buildSeries(
      timeSlot?.start_time,
      timeSlot?.end_time,
      recurrenceOccurrences,
      recurrenceFrequency,
    );

    const results = [];
    for (const item of series) {
      if (controller.signal.aborted) return;
      let status = 'ok';
      let reason = '';
      try {
        const slots = await getAvailableTimeSlots({
          service,
          coach,
          selectedResource,
          location,
          selectedDate: item.start,
          company,
          signal: controller.signal,
        });
        const match = slots.find(
          (s) => s.start_time && dayjs(s.start_time).isSame(item.start, 'minute'),
        );
        if (!match) {
          status = 'fail';
          reason = 'Time not available';
        }
      } catch {
        if (controller.signal.aborted) return;
        status = 'warn';
        reason = 'Could not verify';
      }
      results.push({ ...item, status, reason });
      // Progressive update — show results as they come in
      setPreviewItems([...results]);
      setProgress(results.length);
    }

    if (!controller.signal.aborted) {
      setChecking(false);
      setChecked(true);
      onPreviewComplete?.(true);
      // Haptic feedback on completion
      const hasFailed = results.some((i) => i.status === 'fail');
      hasFailed ? haptic.warning() : haptic.success();
    }
  }, [timeSlot, recurrenceFrequency, recurrenceOccurrences, service, coach, location, selectedResource, company, onPreviewComplete]);

  useEffect(() => {
    return () => { if (abortRef.current) abortRef.current.abort(); };
  }, []);

  const availableCount = previewItems.filter((i) => i.status === 'ok').length;
  const totalCount = Number(recurrenceOccurrences) || 0;

  return (
    <View style={styles.confirmSection}>
      {!checked && !checking && (
        <Button
          mode="outlined"
          onPress={checkAvailability}
          icon="calendar-check"
          style={styles.recurrenceCheckButton}
          labelStyle={styles.recurrenceCheckButtonLabel}
        >
          Check Availability
        </Button>
      )}

      {checking && !checked && (
        <>
          <Button
            mode="outlined"
            loading
            disabled
            icon="calendar-check"
            style={styles.recurrenceCheckButton}
            labelStyle={styles.recurrenceCheckButtonLabel}
          >
            Checking {progress}/{totalCount}...
          </Button>
        </>
      )}

      {previewItems.length > 0 && (
        <>
          {checked && (
            <View style={styles.recurrencePreviewHeader}>
              <Text style={styles.confirmLabel}>
                SERIES PREVIEW — {availableCount}/{previewItems.length} AVAILABLE
              </Text>
              <Button
                mode="text"
                onPress={checkAvailability}
                labelStyle={{ fontSize: 12, color: colors.accent }}
                contentStyle={{ minHeight: 44 }}
              >
                Recheck
              </Button>
            </View>
          )}
          {previewItems.map((item) => (
            <View
              key={item.index}
              style={[
                styles.recurrencePreviewItem,
                item.index >= previewItems.length && styles.recurrencePreviewItemLast,
              ]}
            >
              <View style={styles.recurrencePreviewItemRow}>
                {statusIcon(item.status)}
                <View>
                  <Text style={styles.recurrencePreviewDate}>
                    {formatDateInTz(item.start.toISOString(), company)}
                  </Text>
                  <Text style={styles.recurrencePreviewTime}>
                    {formatTimeInTz(item.start.toISOString(), company)}
                    {' – '}
                    {formatTimeInTz(item.end.toISOString(), company)}
                  </Text>
                </View>
              </View>
              {item.status === 'fail' && (
                <Text style={[styles.recurrencePreviewReason, { color: colors.error }]}>{item.reason}</Text>
              )}
              {item.status === 'warn' && (
                <Text style={[styles.recurrencePreviewReason, { color: colors.warningDark || colors.warning }]}>{item.reason}</Text>
              )}
            </View>
          ))}
        </>
      )}
    </View>
  );
};

export default RecurrencePreview;
