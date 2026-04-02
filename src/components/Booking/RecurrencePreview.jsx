import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getAvailableTimeSlots } from '../../services/availability.service';
import { formatDateInTz, formatTimeInTz } from '../../helpers/timezone.helper';
import { bookingStyles as styles } from '../../styles/booking.styles';
import { colors, spacing } from '../../theme';
import dayjs from 'dayjs';

const FREQUENCY_DAYS = { weekly: 7, biweekly: 14, monthly: 28 };

/**
 * Build a recurring series of booking time windows.
 */
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

/**
 * Shows a preview of recurring booking dates with availability status.
 * Checks each date against the availability API.
 */
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
  const abortRef = useRef(null);
  const prevKeyRef = useRef('');

  // Reset when recurrence config changes
  const configKey = `${timeSlot?.start_time}-${recurrenceFrequency}-${recurrenceOccurrences}`;
  useEffect(() => {
    if (configKey !== prevKeyRef.current) {
      prevKeyRef.current = configKey;
      setChecked(false);
      setPreviewItems([]);
      onPreviewComplete?.(false);
    }
  }, [configKey, onPreviewComplete]);

  const checkAvailability = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setChecking(true);
    setChecked(false);

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
    }

    if (!controller.signal.aborted) {
      setPreviewItems(results);
      setChecking(false);
      setChecked(true);
      onPreviewComplete?.(true);
    }
  }, [timeSlot, recurrenceFrequency, recurrenceOccurrences, service, coach, location, selectedResource, company, onPreviewComplete]);

  useEffect(() => {
    return () => { if (abortRef.current) abortRef.current.abort(); };
  }, []);

  const availableCount = previewItems.filter((i) => i.status === 'ok').length;
  const totalCount = previewItems.length;

  const statusIcon = (status) => {
    switch (status) {
      case 'ok': return <MaterialCommunityIcons name="check-circle" size={18} color={colors.success} />;
      case 'fail': return <MaterialCommunityIcons name="close-circle" size={18} color={colors.error} />;
      case 'warn': return <MaterialCommunityIcons name="alert-circle" size={18} color={colors.warning} />;
      default: return null;
    }
  };

  return (
    <View style={styles.confirmSection}>
      {!checked && (
        <Button
          mode="outlined"
          onPress={checkAvailability}
          loading={checking}
          disabled={checking}
          icon="calendar-check"
          style={{ borderColor: colors.accent, borderRadius: 10 }}
          labelStyle={{ color: colors.accent, fontWeight: '600' }}
        >
          {checking ? 'Checking availability...' : 'Check Availability'}
        </Button>
      )}

      {checked && totalCount > 0 && (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm }}>
            <Text style={styles.confirmLabel}>
              SERIES PREVIEW — {availableCount}/{totalCount} AVAILABLE
            </Text>
            <Button
              mode="text"
              compact
              onPress={checkAvailability}
              labelStyle={{ fontSize: 12, color: colors.accent }}
            >
              Recheck
            </Button>
          </View>
          {previewItems.map((item) => (
            <View
              key={item.index}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 8,
                borderBottomWidth: item.index < totalCount ? 1 : 0,
                borderBottomColor: colors.borderLight,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                {statusIcon(item.status)}
                <View>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: colors.textPrimary }}>
                    {formatDateInTz(item.start.toISOString(), company)}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                    {formatTimeInTz(item.start.toISOString(), company)}
                    {' – '}
                    {formatTimeInTz(item.end.toISOString(), company)}
                  </Text>
                </View>
              </View>
              {item.status === 'fail' && (
                <Text style={{ fontSize: 11, color: colors.error }}>{item.reason}</Text>
              )}
              {item.status === 'warn' && (
                <Text style={{ fontSize: 11, color: colors.warning }}>{item.reason}</Text>
              )}
            </View>
          ))}
        </>
      )}
    </View>
  );
};

export default RecurrencePreview;
