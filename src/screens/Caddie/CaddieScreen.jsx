import React, { useCallback, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Surface, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AgentChatInput from '../../components/AgentChat/AgentChatInput';
import AgentChatMessages from '../../components/AgentChat/AgentChatMessages';
import useCaddie from '../../hooks/useCaddie';
import useAuth from '../../hooks/useAuth';
import { ADMIN_SHELL_ROLES, COACH_ROLES, ROLES } from '../../constants/auth.constants';
import { SCREENS } from '../../constants/navigation.constants';
import { navigate } from '../../helpers/navigation.helper';
import { buildMarshalIntentFromHandoff } from '../../helpers/marshalIntent.helper';
import { caddieStyles as styles } from '../../styles/caddie.styles';
import { colors } from '../../theme';
import { logger } from '../../helpers/logger.helper';

const CaddieScreen = () => {
  const { user, activeRole, isDualRole, switchRole } = useAuth();
  const [handoffError, setHandoffError] = useState(null);
  const {
    error,
    input,
    isLoading,
    messages,
    resetConversation,
    selectSuggestion,
    sendCurrentMessage,
    sendMessage,
    setInput,
    suggestions,
  } = useCaddie();

  const roleNames = Array.isArray(user?.roles)
    ? user.roles.map((role) => (typeof role === 'string' ? role : role?.name)).filter(Boolean)
    : [];
  const hasAdminShellRole = roleNames.some((roleName) => ADMIN_SHELL_ROLES.includes(roleName));
  const hasStaffCapability = roleNames.some((roleName) => COACH_ROLES.includes(roleName));
  const marshalTargetRole = hasAdminShellRole ? ROLES.ADMIN : hasStaffCapability ? ROLES.COACH : null;
  const canLaunchMarshal = Boolean(isDualRole && marshalTargetRole);
  const combinedError = handoffError || error;

  const openMarshalWithIntent = useCallback((intent) => {
    const parentScreen = marshalTargetRole === ROLES.ADMIN ? SCREENS.ADMIN_TABS : SCREENS.COACH_TABS;

    if (!parentScreen) {
      return;
    }

    navigate(parentScreen, {
      screen: SCREENS.MARSHAL,
      params: {
        marshalIntent: intent,
      },
    });
  }, [marshalTargetRole]);

  const handleHandoffAction = useCallback(async (handoff) => {
    if (!canLaunchMarshal || !handoff?.prompt) {
      return;
    }

    setHandoffError(null);

    const intent = buildMarshalIntentFromHandoff(handoff, {
      id: `caddie-${handoff.reason || 'handoff'}-${Date.now()}`,
    });

    try {
      if (activeRole !== marshalTargetRole) {
        await switchRole(marshalTargetRole);
        setTimeout(() => openMarshalWithIntent(intent), 50);
        return;
      }

      openMarshalWithIntent(intent);
    } catch (handoffActionError) {
      logger.warn("CaddieScreen: Marshal handoff failed", handoffActionError?.message || handoffActionError);
      setHandoffError("We couldn't open Marshal right now. Please try again.");
    }
  }, [activeRole, canLaunchMarshal, marshalTargetRole, openMarshalWithIntent, switchRole]);

  const handleChangeText = useCallback((value) => {
    if (handoffError) {
      setHandoffError(null);
    }
    setInput(value);
  }, [handoffError, setInput]);

  const handleResetConversation = useCallback(() => {
    setHandoffError(null);
    resetConversation();
  }, [resetConversation]);

  const handleSlotSelect = useCallback((prompt, slotContext) => {
    sendMessage(prompt, { slotContext });
  }, [sendMessage]);

  const handleBookingLinkPress = useCallback((bookingLink) => {
    if (!bookingLink) return;

    // Parse IDs from the booking_link (first-class fields or URL params)
    const serviceId = bookingLink.service_id || null;
    const locationId = bookingLink.location_id || null;
    const coachId = bookingLink.coach_id || null;

    if (!serviceId || !locationId) {
      logger.warn('CaddieScreen: booking link missing required IDs');
      return;
    }

    const priceCents = bookingLink.price_cents || null;

    const bookingData = {
      service: {
        id: serviceId,
        name: bookingLink.service || 'Service',
        duration_minutes: bookingLink.duration_minutes || 60,
        price: priceCents != null ? priceCents / 100 : null,
        price_cents: priceCents,
      },
      location: {
        id: locationId,
        name: bookingLink.location || 'Location',
      },
      coach: coachId ? {
        id: coachId,
        first_name: bookingLink.coach || 'Coach',
        last_name: '',
      } : null,
      timeSlot: {
        start_time: bookingLink.start_time,
        end_time: bookingLink.end_time || null,
      },
      date: bookingLink.date,
    };

    navigate(SCREENS.BOOKING_CONFIRMATION, { bookingData });
  }, []);

  const scrollRef = useRef(null);

  const handleFocusInput = useCallback(() => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd?.({ animated: true });
    }, 300);
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          <Surface style={styles.heroCard} elevation={1}>
            <MaterialCommunityIcons name="golf" size={32} color={colors.aquaLight} style={styles.heroIcon} />
            <Text style={styles.heroEyebrow}>Client booking concierge</Text>
            <Text style={styles.heroTitle}>Caddie</Text>
            <Text style={styles.heroBody}>
              Ask for availability, upcoming bookings, memberships, or the best next step for your practice schedule.
            </Text>
          </Surface>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Conversation</Text>
            <Text style={styles.sectionBody}>
              Start with something simple like "Find me a lesson this week" or "Show my next booking."
            </Text>
            <AgentChatMessages
              agentLabel="Caddie"
              isLoading={isLoading}
              loadingLabel="Caddie is checking options…"
              messages={messages}
              onHandoffAction={canLaunchMarshal ? handleHandoffAction : undefined}
              onSlotSelect={handleSlotSelect}
              onBookingLinkPress={handleBookingLinkPress}
              handoffActionLabel="Open in Marshal"
            />
            <AgentChatInput
              error={combinedError}
              input={input}
              isLoading={isLoading}
              onChangeText={handleChangeText}
              onSelectSuggestion={selectSuggestion}
              onSend={sendCurrentMessage}
              onFocus={handleFocusInput}
              placeholder="Ask Caddie about lessons, bookings, or memberships…"
              suggestions={suggestions}
            />
          </View>

          <Button mode="text" onPress={handleResetConversation}>
            Reset conversation
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default CaddieScreen;
