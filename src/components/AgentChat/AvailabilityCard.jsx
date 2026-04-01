import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Pressable, ScrollView, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { agentChatStyles as styles } from '../../styles/agentChat.styles';
import { formatEligibilityLabel } from '../../helpers/agentChat.helper';

const MAX_VISIBLE_SLOTS = 6;

const formatSlotTime = (slot) => {
  if (slot.time_range) return slot.time_range;
  if (!slot.start_time) return '';
  try {
    const date = new Date(slot.start_time);
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  } catch {
    return slot.start_time;
  }
};

const formatDayLabel = (dateStr) => {
  try {
    const date = new Date(dateStr + 'T12:00:00');
    const weekday = date.toLocaleDateString([], { weekday: 'short' });
    const day = date.getDate();
    return { weekday, day: String(day) };
  } catch {
    return { weekday: dateStr, day: '' };
  }
};

const AvailabilityCard = ({ availability, onSlotSelect }) => {
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const [selectedSlotTime, setSelectedSlotTime] = useState(null);

  const days = useMemo(() => {
    if (availability.days?.length) {
      return availability.days.map((d) => ({
        date: d.date,
        slots: d.slots || [],
      }));
    }
    if (availability.slots?.length) {
      return [{ date: null, slots: availability.slots }];
    }
    return [];
  }, [availability]);

  if (!days.length) return null;

  const activeDay = days[activeDayIndex] || days[0];
  const visibleSlots = showAll ? activeDay.slots : activeDay.slots.slice(0, MAX_VISIBLE_SLOTS);
  const hasMore = activeDay.slots.length > MAX_VISIBLE_SLOTS && !showAll;
  const serviceName = availability.service?.name;
  const locationName = availability.location?.name;
  const eligibilityLabel = formatEligibilityLabel(availability.booking_eligibility);

  const handleSlotPress = (slot) => {
    if (!onSlotSelect) return;
    setSelectedSlotTime(slot.start_time);

    const coachNames = (slot.available_coaches || []).join(', ');
    const dateLabel = activeDay.date
      ? new Date(activeDay.date + 'T12:00:00').toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
      : '';
    const timeLabel = formatSlotTime(slot);
    const prompt = `I\u2019d like to book the ${timeLabel}${dateLabel ? ` on ${dateLabel}` : ''}${coachNames ? ` with ${coachNames}` : ''} slot`;

    onSlotSelect(prompt, {
      start_time: slot.start_time,
      end_time: slot.end_time,
      date: activeDay.date || slot.date,
      service_id: availability.service?.id,
      service_name: serviceName,
      location_id: availability.location?.id,
      location_name: locationName,
      coach_ids: slot.available_coach_ids || [],
      coach_names: slot.available_coaches || [],
      resource_ids: slot.available_resource_ids || [],
    });
  };

  return (
    <View style={styles.availabilityCard}>
      <View style={styles.availabilityHeader}>
        {serviceName ? <Text style={styles.availabilityService}>{serviceName}</Text> : null}
        {locationName ? <Text style={styles.availabilityLocation}>{locationName}</Text> : null}
      </View>
      {eligibilityLabel ? (
        <Text style={styles.availabilityEligibility}>{eligibilityLabel}</Text>
      ) : null}

      {days.length > 1 ? (
        <View style={styles.availabilityDayTabs}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.availabilityDayTabScroll}
          >
            {days.map((day, index) => {
              const isActive = index === activeDayIndex;
              const { weekday, day: dayNum } = formatDayLabel(day.date);
              return (
                <Pressable
                  key={day.date || index}
                  style={[styles.availabilityDayTab, isActive && styles.availabilityDayTabActive]}
                  onPress={() => { setActiveDayIndex(index); setShowAll(false); setSelectedSlotTime(null); }}
                  accessibilityLabel={`${weekday} ${dayNum}, ${day.slots.length} slot${day.slots.length !== 1 ? 's' : ''}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                >
                  <Text style={[styles.availabilityDayTabText, isActive && styles.availabilityDayTabTextActive]}>
                    {weekday} {dayNum}
                  </Text>
                  <Text style={[styles.availabilityDayTabCount, isActive && styles.availabilityDayTabCountActive]}>
                    {day.slots.length} slot{day.slots.length !== 1 ? 's' : ''}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : null}

      <View style={styles.availabilitySlotGrid}>
        {visibleSlots.map((slot, index) => {
          const timeLabel = formatSlotTime(slot);
          const coachName = (slot.available_coaches || [])[0] || null;
          const isSelected = !!selectedSlotTime && slot.start_time === selectedSlotTime;
          return (
            <Pressable
              key={`${slot.start_time}-${index}`}
              style={({ pressed }) => [
                styles.availabilitySlot,
                (pressed || isSelected) && styles.availabilitySlotPressed,
              ]}
              onPress={() => handleSlotPress(slot)}
              accessibilityLabel={`${timeLabel}${coachName ? ` with ${coachName}` : ''}`}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
            >
              <Text style={styles.availabilitySlotTime}>{timeLabel}</Text>
              {coachName ? <Text style={styles.availabilitySlotCoach}>{coachName}</Text> : null}
            </Pressable>
          );
        })}
      </View>

      {hasMore ? (
        <Button
          mode="text"
          compact
          style={styles.availabilityShowMore}
          onPress={() => setShowAll(true)}
        >
          Show {activeDay.slots.length - MAX_VISIBLE_SLOTS} more
        </Button>
      ) : null}

      <Text style={styles.availabilityFooter}>Tap a time to start booking</Text>
    </View>
  );
};

AvailabilityCard.propTypes = {
  availability: PropTypes.shape({
    service: PropTypes.shape({ id: PropTypes.number, name: PropTypes.string }),
    location: PropTypes.shape({ id: PropTypes.number, name: PropTypes.string }),
    booking_eligibility: PropTypes.shape({
      source: PropTypes.string,
      remaining: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      package_name: PropTypes.string,
    }),
    slots: PropTypes.array,
    days: PropTypes.arrayOf(PropTypes.shape({
      date: PropTypes.string,
      slots: PropTypes.array,
    })),
  }).isRequired,
  onSlotSelect: PropTypes.func,
};

AvailabilityCard.defaultProps = {
  onSlotSelect: undefined,
};

export default AvailabilityCard;
