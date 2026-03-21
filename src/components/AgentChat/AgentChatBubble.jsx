import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Pressable, View } from 'react-native';
import { Button, Divider, Icon, Surface, Text } from 'react-native-paper';
import { agentChatStyles as styles } from '../../styles/agentChat.styles';
import { colors } from '../../theme/colors';
import { formatEligibilityLabel, stripContextBlocks } from '../../helpers/agentChat.helper';
import AvailabilityCard from './AvailabilityCard';
import BookingsCard from './BookingsCard';
import EmailPreviewCard from './EmailPreviewCard';
import FormattedResponseText from './FormattedResponseText';

const ACTION_LABELS = {
  create_booking: 'Create Booking',
  create_recurring_booking: 'Book Recurring Sessions',
  cancel_booking: 'Cancel Booking',
  reschedule_booking: 'Reschedule Booking',
  update_client_notes: 'Update Client Notes',
  update_location_hours: 'Update Location Hours',
  toggle_service: 'Toggle Service',
  create_campaign: 'Create Campaign Draft',
  draft_client_email: 'Draft Client Email',
  send_client_email: 'Send Client Email',
  update_service_pricing: 'Update Pricing',
  update_company_info: 'Update Company Info',
  create_location: 'Create Location',
  update_location: 'Update Location',
  create_service_category: 'Create Category',
  create_service: 'Create Service',
  create_coach: 'Add Coach',
  set_coach_availability: 'Set Availability',
  create_membership_plan: 'Create Plan',
  cancel_membership: 'Cancel Membership',
  pause_membership: 'Pause Membership',
  resume_membership: 'Resume Membership',
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

const formatToolName = (tool) =>
  ACTION_LABELS[tool] || tool.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

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

const renderBookingLinkCard = (bookingLink, onBookingLinkPress) => {
  if (!bookingLink?.booking_url) {
    return null;
  }

  const eligibilityLabel = formatEligibilityLabel(bookingLink.eligibility);

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
      <Button mode="contained" compact style={styles.bookingButton} onPress={() => {
          if (onBookingLinkPress) {
            onBookingLinkPress(bookingLink);
          }
        }}>
        Continue to booking
      </Button>
    </Surface>
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
              color={isMarshal ? colors.aquaLight : colors.accent}
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
          contentStyle={styles.handoffActionContent}
          onPress={() => onHandoffAction(handoff)}
        >
          {handoffActionLabel || 'Open in Marshal'}
        </Button>
      ) : null}
    </View>
  );
};

HandoffCard.propTypes = {
  handoff: PropTypes.shape({
    target: PropTypes.string,
    reason: PropTypes.string,
    title: PropTypes.string,
    summary: PropTypes.string,
    prompt: PropTypes.string,
  }),
  handoffActionLabel: PropTypes.string,
  onHandoffAction: PropTypes.func,
};

const AgentChatBubble = ({ message, agentLabel, onConfirmAction, onDeclineAction, onHandoffAction, handoffActionLabel, onSlotSelect, onBookingLinkPress, onSendEmail, onDiscardEmail }) => {
  // Hide streaming placeholder until first token arrives
  if (message.streaming && !message.text) return null;

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
      <View style={[styles.bubbleContentWrap, !isUser && styles.assistantBubbleContentWrap]}>
        <View style={bubbleStyle}>
          {renderCard(message.card)}
          {renderBookingLinkCard(message.bookingLink, onBookingLinkPress)}
          {message.availability ? (
            <AvailabilityCard availability={message.availability} onSlotSelect={onSlotSelect} />
          ) : null}
          {message.bookings ? (
            <BookingsCard bookings={message.bookings} />
          ) : null}
          {message.type === 'handoff' ? (
            <HandoffCard
              handoff={message.handoff}
              handoffActionLabel={handoffActionLabel}
              onHandoffAction={onHandoffAction}
            />
          ) : null}
          {message.type === 'email_preview' && message.emailPreview ? (
            <EmailPreviewCard
              emailPreview={message.emailPreview}
              onSendEmail={onSendEmail}
              onDiscardEmail={onDiscardEmail}
            />
          ) : null}
          {isUser ? (
            <Text style={styles.userText}>{message.text}</Text>
          ) : message.type === 'handoff' || message.bookings || message.availability ? null : (
            <FormattedResponseText text={stripContextBlocks(message.text)} style={styles.assistantText} />
          )}
          {message.type === 'confirmation' && Array.isArray(message.pendingActions) ? (
            <View style={styles.confirmationList}>
              {message.pendingActions.map((action) => (
                <Surface key={action.action_id} style={styles.confirmationCard} elevation={0}>
                  <Text style={styles.confirmationEyebrow}>Requires your approval</Text>
                  <Text style={styles.confirmationTitle}>{formatToolName(action.tool)}</Text>
                  {action.description ? (
                    <Text style={styles.confirmationDescription}>{action.description}</Text>
                  ) : null}
                  <View style={styles.confirmationActions}>
                    <Button mode="contained" compact onPress={() => onConfirmAction?.(action)}
                      buttonColor={colors.success} textColor={colors.textInverse}
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
    streaming: PropTypes.bool,
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
      service_id: PropTypes.number,
      location: PropTypes.string,
      location_id: PropTypes.number,
      coach: PropTypes.string,
      coach_id: PropTypes.number,
      date: PropTypes.string,
      time: PropTypes.string,
      start_time: PropTypes.string,
      end_time: PropTypes.string,
      duration_minutes: PropTypes.number,
      price: PropTypes.string,
      price_cents: PropTypes.number,
      eligibility: PropTypes.shape({
        source: PropTypes.string,
        remaining: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        package_name: PropTypes.string,
      }),
    }),
    bookings: PropTypes.shape({
      bookings: PropTypes.array,
      total: PropTypes.number,
      timezone: PropTypes.string,
    }),
    emailPreview: PropTypes.shape({
      campaign_id: PropTypes.number,
      subject: PropTypes.string,
      to_name: PropTypes.string,
      to_email: PropTypes.string,
      body_html: PropTypes.string,
      preview_html: PropTypes.string,
      status: PropTypes.string,
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
  onDiscardEmail: PropTypes.func,
  onHandoffAction: PropTypes.func,
  onSendEmail: PropTypes.func,
  onSlotSelect: PropTypes.func,
  onBookingLinkPress: PropTypes.func,
  handoffActionLabel: PropTypes.string,
};

AgentChatBubble.defaultProps = {
  agentLabel: 'A',
  onConfirmAction: undefined,
  onDeclineAction: undefined,
  onDiscardEmail: undefined,
  onHandoffAction: undefined,
  onSendEmail: undefined,
  onSlotSelect: undefined,
  onBookingLinkPress: undefined,
  handoffActionLabel: 'Open in Marshal',
};

export default AgentChatBubble;
