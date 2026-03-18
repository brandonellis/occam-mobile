import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Linking, Pressable, ScrollView, View } from 'react-native';
import { Button, Divider, Icon, Surface, Text } from 'react-native-paper';
import { agentChatStyles as styles } from '../../styles/agentChat.styles';

const ACTION_LABELS = {
  create_booking: 'Create Booking',
  cancel_booking: 'Cancel Booking',
  reschedule_booking: 'Reschedule Booking',
  update_client_notes: 'Update Client Notes',
  update_location_hours: 'Update Location Hours',
  toggle_service: 'Toggle Service',
  create_campaign: 'Create Campaign Draft',
  update_company_info: 'Update Company Info',
  create_location: 'Create Location',
  update_location: 'Update Location',
  create_service_category: 'Create Category',
  create_service: 'Create Service',
  create_coach: 'Add Coach',
  set_coach_availability: 'Set Availability',
  create_membership_plan: 'Create Plan',
  create_resource: 'Create Resource',
  close_resource: 'Close Resource',
  create_client: 'Add Client',
  update_client: 'Update Client',
  update_service: 'Update Service',
  import_csv_data: 'Import CSV Data',
  add_curriculum_module: 'Add Curriculum Module',
  toggle_lesson: 'Toggle Lesson',
  apply_curriculum_package: 'Apply Curriculum Package',
  create_assessment: 'Record Assessment',
  share_progress_report: 'Share Progress Report',
  assign_membership: 'Assign Membership',
  create_tag: 'Create Tag',
  assign_tag: 'Assign Tag',
  enroll_client_in_class: 'Enroll Client In Class',
};

const renderCard = (card) => {
  if (!card) {
    return null;
  }

  if (card.type === 'stats') {
    return (
      <Surface style={styles.responseCard} elevation={0}>
        {card.title ? <Text style={styles.responseCardTitle}>{card.title}</Text> : null}
        <View style={styles.responseStatsRow}>
          {(card.stats || []).map((stat, index) => (
            <View key={`${stat.label}-${index}`} style={styles.responseStatItem}>
              <Text style={styles.responseStatValue}>{stat.value}</Text>
              <Text style={styles.responseStatLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </Surface>
    );
  }

  if (card.type === 'profile') {
    return (
      <Surface style={styles.responseCard} elevation={0}>
        {card.title ? <Text style={styles.responseCardTitle}>{card.title}</Text> : null}
        <View style={styles.responseFields}>
          {Object.entries(card.fields || {}).map(([label, value]) => (
            <View key={label} style={styles.responseField}>
              <Text style={styles.responseFieldLabel}>{label}</Text>
              <Text style={styles.responseFieldValue}>{value}</Text>
            </View>
          ))}
        </View>
      </Surface>
    );
  }

  if (card.type === 'list') {
    return (
      <Surface style={styles.responseCard} elevation={0}>
        {card.title ? <Text style={styles.responseCardTitle}>{card.title}</Text> : null}
        <View style={styles.responseTable}>
          {(card.row_headers || []).length > 0 ? (
            <View style={styles.responseTableRow}>
              {(card.row_headers || []).map((header) => (
                <Text key={header} style={styles.responseTableHeader}>{header}</Text>
              ))}
            </View>
          ) : null}
          {(card.rows || []).map((row, rowIndex) => (
            <View key={`row-${rowIndex}`} style={styles.responseTableRow}>
              {row.map((value, valueIndex) => (
                <Text key={`value-${valueIndex}`} style={styles.responseTableCell}>{value}</Text>
              ))}
            </View>
          ))}
        </View>
      </Surface>
    );
  }

  return null;
};

const renderBookingLinkCard = (bookingLink) => {
  if (!bookingLink?.booking_url) {
    return null;
  }

  let eligibilityLabel = null;
  if (bookingLink.eligibility?.source === 'membership') {
    eligibilityLabel = `Covered by membership${bookingLink.eligibility?.remaining !== undefined && bookingLink.eligibility?.remaining !== null ? ` • ${bookingLink.eligibility.remaining} remaining` : ''}`;
  } else if (bookingLink.eligibility?.source === 'package') {
    eligibilityLabel = `${bookingLink.eligibility?.package_name || 'Package booking'}${bookingLink.eligibility?.remaining !== undefined && bookingLink.eligibility?.remaining !== null ? ` • ${bookingLink.eligibility.remaining} remaining` : ''}`;
  } else if (bookingLink.eligibility?.source === 'one_off') {
    eligibilityLabel = 'This booking requires payment';
  }

  return (
    <Surface style={styles.bookingCard} elevation={0}>
      <Text style={styles.bookingCardTitle}>Ready to book</Text>
      <View style={styles.bookingPills}>
        {[bookingLink.service, bookingLink.date, bookingLink.time, bookingLink.location, bookingLink.coach, bookingLink.price]
          .filter(Boolean)
          .map((value) => (
            <View key={value} style={styles.bookingPill}>
              <Text style={styles.bookingPillText}>{value}</Text>
            </View>
          ))}
      </View>
      {eligibilityLabel ? (
        <Text style={styles.bookingEligibility}>{eligibilityLabel}</Text>
      ) : null}
      <Button mode="contained" compact style={styles.bookingButton} onPress={() => Linking.openURL(bookingLink.booking_url)}>
        Continue to booking
      </Button>
    </Surface>
  );
};

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

const formatEligibilityLabel = (eligibility) => {
  if (!eligibility) return null;
  const remaining = eligibility.remaining !== undefined && eligibility.remaining !== null
    ? ` \u2022 ${eligibility.remaining} remaining`
    : '';
  if (eligibility.source === 'membership') return `Covered by membership${remaining}`;
  if (eligibility.source === 'package') return `${eligibility.package_name || 'Package booking'}${remaining}`;
  if (eligibility.source === 'one_off') return 'Payment required';
  return null;
};

const AvailabilityCard = ({ availability, onSlotSelect }) => {
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [showAll, setShowAll] = useState(false);

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
                  onPress={() => { setActiveDayIndex(index); setShowAll(false); }}
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
          return (
            <Pressable
              key={`${slot.start_time}-${index}`}
              style={({ pressed }) => [
                styles.availabilitySlot,
                pressed && styles.availabilitySlotPressed,
              ]}
              onPress={() => handleSlotPress(slot)}
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

const HandoffCard = ({ handoff, handoffActionLabel, onHandoffAction }) => {
  const [showDetails, setShowDetails] = useState(false);

  if (!handoff) {
    return null;
  }

  const isMarshal = handoff.target === 'marshal';
  const cardBg = isMarshal ? styles.handoffCardGradientBg : styles.handoffCardLightBg;

  return (
    <View style={[styles.handoffCard, cardBg]}>
      <Text style={[styles.handoffEyebrow, !isMarshal && styles.handoffEyebrowLight]}>
        {isMarshal ? 'Marshal handoff' : 'Agent handoff'}
      </Text>
      <Text style={[styles.handoffTitle, !isMarshal && styles.handoffTitleLight]}>
        {handoff.title || 'Staff follow-up recommended'}
      </Text>
      {handoff.summary ? (
        <Text style={[styles.handoffSummary, !isMarshal && styles.handoffSummaryLight]}>
          {handoff.summary}
        </Text>
      ) : null}
      {handoff.prompt ? (
        <>
          <Pressable
            onPress={() => setShowDetails((prev) => !prev)}
            style={styles.handoffDetailToggle}
          >
            <Icon
              source={showDetails ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={isMarshal ? '#8EE7E9' : '#4CACD5'}
            />
            <Text style={[styles.handoffDetailToggleText, !isMarshal && styles.handoffDetailToggleTextLight]}>
              {showDetails ? 'Hide details' : 'View details'}
            </Text>
          </Pressable>
          {showDetails ? (
            <View style={[styles.handoffPromptWrap, !isMarshal && styles.handoffPromptWrapLight]}>
              <Text style={[styles.handoffPromptLabel, !isMarshal && styles.handoffPromptLabelLight]}>
                Prepared prompt
              </Text>
              <Text style={[styles.handoffPrompt, !isMarshal && styles.handoffPromptLight]}>
                {handoff.prompt}
              </Text>
            </View>
          ) : null}
        </>
      ) : null}
      {onHandoffAction ? (
        <Button
          mode={isMarshal ? 'contained' : 'contained-tonal'}
          compact
          style={styles.handoffAction}
          icon="arrow-right"
          contentStyle={{ flexDirection: 'row-reverse' }}
          onPress={() => onHandoffAction(handoff)}
        >
          {handoffActionLabel || 'Open in Marshal'}
        </Button>
      ) : null}
    </View>
  );
};

const AgentChatBubble = ({ message, agentLabel, onConfirmAction, onDeclineAction, onHandoffAction, handoffActionLabel, onSlotSelect }) => {
  const isUser = message.sender === 'user';
  const isActionResult = message.type === 'action_result';
  const bubbleStyle = [
    styles.messageBubble,
    isUser ? styles.userBubble : styles.assistantBubble,
    isActionResult ? (message.success ? styles.successBubble : styles.errorBubble) : null,
  ];

  const avatarInitial = isUser ? 'U' : (agentLabel || 'A').charAt(0);

  return (
    <View style={[styles.messageRow, isUser ? styles.userRow : styles.assistantRow]}>
      {!isUser ? (
        <View style={[styles.avatarWrap, styles.assistantAvatar]}>
          <Text style={styles.avatarText}>{avatarInitial}</Text>
        </View>
      ) : null}
      <View style={{ flex: 0, maxWidth: '80%' }}>
        <View style={bubbleStyle}>
          {renderCard(message.card)}
          {renderBookingLinkCard(message.bookingLink)}
          {message.availability ? (
            <AvailabilityCard availability={message.availability} onSlotSelect={onSlotSelect} />
          ) : null}
          {message.type === 'handoff' ? (
            <HandoffCard
              handoff={message.handoff}
              handoffActionLabel={handoffActionLabel}
              onHandoffAction={onHandoffAction}
            />
          ) : null}
          <Text style={isUser ? styles.userText : styles.assistantText}>{message.text}</Text>
          {message.type === 'confirmation' && Array.isArray(message.pendingActions) ? (
            <View style={styles.confirmationList}>
              {message.pendingActions.map((action) => (
                <Surface key={action.action_id} style={styles.confirmationCard} elevation={0}>
                  <Text style={styles.confirmationEyebrow}>Requires your approval</Text>
                  <Text style={styles.confirmationTitle}>{ACTION_LABELS[action.tool] || action.tool}</Text>
                  {action.description ? (
                    <Text style={styles.confirmationDescription}>{action.description}</Text>
                  ) : null}
                  <View style={styles.confirmationActions}>
                    <Button mode="contained" compact onPress={() => onConfirmAction?.(action)}
                      buttonColor="#34C759" textColor="#FFFFFF"
                    >
                      Confirm
                    </Button>
                    <Button mode="text" compact onPress={() => onDeclineAction?.()}>
                      Cancel
                    </Button>
                  </View>
                </Surface>
              ))}
            </View>
          ) : null}
          {isActionResult && message.nextStep ? (
            <>
              <Divider style={styles.actionDivider} />
              <Text style={styles.actionNextStep}>{message.nextStep}</Text>
            </>
          ) : null}
        </View>
        {message.timestamp ? (
          <Text style={[styles.messageTimestamp, isUser && styles.timestampRight]}>
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        ) : null}
      </View>
      {isUser ? (
        <View style={[styles.avatarWrap, styles.userAvatar]}>
          <Text style={styles.userAvatarText}>{avatarInitial}</Text>
        </View>
      ) : null}
    </View>
  );
};

AgentChatBubble.propTypes = {
  message: PropTypes.shape({
    sender: PropTypes.oneOf(['assistant', 'user']).isRequired,
    text: PropTypes.string.isRequired,
    type: PropTypes.string,
    success: PropTypes.bool,
    nextStep: PropTypes.string,
    timestamp: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    card: PropTypes.shape({
      type: PropTypes.oneOf(['stats', 'list', 'profile']),
      title: PropTypes.string,
      stats: PropTypes.arrayOf(PropTypes.shape({
        label: PropTypes.string,
        value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      })),
      row_headers: PropTypes.arrayOf(PropTypes.string),
      rows: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number]))),
      fields: PropTypes.objectOf(PropTypes.string),
    }),
    handoff: PropTypes.shape({
      target: PropTypes.string,
      reason: PropTypes.string,
      title: PropTypes.string,
      summary: PropTypes.string,
      prompt: PropTypes.string,
      origin_agent: PropTypes.string,
      requires_staff_follow_up: PropTypes.bool,
      requires_human_approval: PropTypes.bool,
    }),
    bookingLink: PropTypes.shape({
      booking_url: PropTypes.string,
      service: PropTypes.string,
      location: PropTypes.string,
      coach: PropTypes.string,
      date: PropTypes.string,
      time: PropTypes.string,
      price: PropTypes.string,
      eligibility: PropTypes.shape({
        source: PropTypes.string,
        remaining: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        package_name: PropTypes.string,
      }),
    }),
    pendingActions: PropTypes.arrayOf(PropTypes.shape({
      action_id: PropTypes.string.isRequired,
      tool: PropTypes.string.isRequired,
      args: PropTypes.object,
      description: PropTypes.string,
    })),
  }).isRequired,
  agentLabel: PropTypes.string,
  onConfirmAction: PropTypes.func,
  onDeclineAction: PropTypes.func,
  onHandoffAction: PropTypes.func,
  onSlotSelect: PropTypes.func,
  handoffActionLabel: PropTypes.string,
};

AgentChatBubble.defaultProps = {
  agentLabel: 'A',
  onConfirmAction: undefined,
  onDeclineAction: undefined,
  onHandoffAction: undefined,
  onSlotSelect: undefined,
  handoffActionLabel: 'Open in Marshal',
};

export default AgentChatBubble;
