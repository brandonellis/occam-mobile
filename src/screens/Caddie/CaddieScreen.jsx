import React, { useCallback, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Icon, Surface, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AgentChatInput from '../../components/AgentChat/AgentChatInput';
import AgentChatMessages from '../../components/AgentChat/AgentChatMessages';
import useCaddie from '../../hooks/useCaddie';
import useAuth from '../../hooks/useAuth';
import { submitCaddieFeedback } from '../../services/caddie.api';
import { ADMIN_SHELL_ROLES, COACH_ROLES, ROLES } from '../../constants/auth.constants';
import { SCREENS } from '../../constants/navigation.constants';
import { navigate, navigationRef } from '../../helpers/navigation.helper';
import { buildBookingDataFromLink } from '../../helpers/booking.helper';
import { buildMarshalIntentFromHandoff } from '../../helpers/marshalIntent.helper';
import useMarshalIntent from '../../hooks/useMarshalIntent';
import { AGENT_CHAT_ACTIONS } from '../../reducers/agentChat.reducer';
import { caddieStyles as styles } from '../../styles/caddie.styles';
import { colors } from '../../theme';
import logger from '../../helpers/logger.helper';

const CaddieScreen = () => {
  const { user, activeRole, isDualRole, switchRole } = useAuth();
  const [handoffError, setHandoffError] = useState(null);
  const {
    dismissNudge,
    error,
    input,
    isConnected,
    isLoading,
    messages,
    nudges,
    resetConversation,
    runHealthCheck,
    selectSuggestion,
    sendCurrentMessage,
    sendMessage,
    sessionId,
    setInput,
    suggestions,
    dispatch,
  } = useCaddie();

  const handleFeedback = useCallback(({ rating, reason }) => {
    submitCaddieFeedback(sessionId, { rating, reason });
  }, [sessionId]);

  useFocusEffect(useCallback(() => { runHealthCheck(); }, [runHealthCheck]));

  const roleNames = Array.isArray(user?.roles)
    ? user.roles.map((role) => (typeof role === 'string' ? role : role?.name)).filter(Boolean)
    : [];
  const hasAdminShellRole = roleNames.some((roleName) => ADMIN_SHELL_ROLES.includes(roleName));
  const hasStaffCapability = roleNames.some((roleName) => COACH_ROLES.includes(roleName));
  const marshalTargetRole = hasAdminShellRole ? ROLES.ADMIN : hasStaffCapability ? ROLES.COACH : null;
  const canLaunchMarshal = Boolean(isDualRole && marshalTargetRole);
  const combinedError = handoffError || error;
  const { deliverIntent } = useMarshalIntent();

  const handleHandoffAction = useCallback(async (handoff) => {
    if (!canLaunchMarshal || !handoff?.prompt) return;
    setHandoffError(null);

    const intent = buildMarshalIntentFromHandoff(handoff, {
      id: `caddie-${handoff.reason || 'handoff'}-${Date.now()}`,
    });

    try {
      // Deliver intent BEFORE role switch — survives navigator remount
      // because MarshalIntentProvider sits above NavigationContainer
      deliverIntent(intent);

      if (activeRole !== marshalTargetRole) {
        await switchRole(marshalTargetRole);
        // Replace setTimeout(50) with bounded readiness check.
        // After role switch, the navigator tree remounts (key changes),
        // so we wait for it to be ready before navigating.
        let retries = 0;
        const tryNavigate = () => {
          if (navigationRef.current?.isReady()) {
            const parentScreen = marshalTargetRole === ROLES.ADMIN ? SCREENS.ADMIN_TABS : SCREENS.COACH_TABS;
            navigate(parentScreen, { screen: SCREENS.MARSHAL });
          } else if (retries < 10) {
            retries++;
            requestAnimationFrame(tryNavigate);
          } else {
            logger.warn('CaddieScreen: navigation not ready after role switch, aborting handoff');
            setHandoffError("We couldn't open Marshal right now. Please try again.");
          }
        };
        requestAnimationFrame(tryNavigate);
        return;
      }

      const parentScreen = marshalTargetRole === ROLES.ADMIN ? SCREENS.ADMIN_TABS : SCREENS.COACH_TABS;
      navigate(parentScreen, { screen: SCREENS.MARSHAL });
    } catch (handoffActionError) {
      logger.warn('CaddieScreen: Marshal handoff failed', handoffActionError?.message || handoffActionError);
      setHandoffError("We couldn't open Marshal right now. Please try again.");
    }
  }, [activeRole, canLaunchMarshal, deliverIntent, marshalTargetRole, switchRole]);

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
    // Clear any prior booking state so the backend treats this as a fresh slot selection
    dispatch({ type: AGENT_CHAT_ACTIONS.SET_BOOKING_STATE, payload: null });
    sendMessage(prompt, { slotContext });
  }, [dispatch, sendMessage]);

  const handleBookingLinkPress = useCallback((bookingLink) => {
    const bookingData = buildBookingDataFromLink(bookingLink);
    if (!bookingData) {
      logger.warn('CaddieScreen: booking link missing required IDs');
      return;
    }
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
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          <Surface style={styles.heroCard} elevation={1}>
            <MaterialCommunityIcons name="golf" size={32} color={colors.aquaLight} style={styles.heroIcon} />
            <Text style={styles.heroEyebrow}>Booking concierge</Text>
            <View style={styles.heroTitleRow}>
              <Text style={styles.heroTitle}>Caddie</Text>
              <View style={styles.betaBadge}><Text style={styles.betaBadgeText}>Beta</Text></View>
              <View style={[
                styles.statusDot,
                isConnected === true ? styles.statusConnected
                  : isConnected === false ? styles.statusDisconnected
                    : styles.statusUnknown,
              ]} />
            </View>
          </Surface>

          {nudges.length > 0 ? (
            <View style={styles.nudgesSection}>
              <View style={styles.nudgesSectionHeader}>
                <Icon source="lightbulb-on-outline" size={18} color={colors.accent} />
                <Text style={styles.nudgesSectionTitle}>Suggestions</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.nudgesRow}>
                {nudges.map((nudge) => (
                  <Surface key={nudge.id} style={styles.nudgeCard} elevation={0}>
                    <Pressable onPress={() => selectSuggestion(nudge.prompt || nudge.title)}>
                      <Text style={styles.nudgeTitle}>{nudge.title}</Text>
                      <Text style={styles.nudgeBody} numberOfLines={3}>{nudge.body || nudge.description}</Text>
                    </Pressable>
                    <View style={styles.nudgeActions}>
                      <Pressable
                        hitSlop={8}
                        style={styles.nudgeAskRow}
                        onPress={() => selectSuggestion(nudge.prompt || nudge.title)}
                      >
                        <Text style={styles.nudgeAskText}>Ask Caddie</Text>
                        <Icon source="arrow-right" size={14} color={colors.accent} />
                      </Pressable>
                      <Pressable
                        hitSlop={12}
                        style={{ minHeight: 44, justifyContent: 'center' }}
                        onPress={() => dismissNudge(nudge.id)}
                      >
                        <Text style={styles.nudgeDismiss}>Dismiss</Text>
                      </Pressable>
                    </View>
                  </Surface>
                ))}
              </ScrollView>
            </View>
          ) : null}

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
              onFeedback={handleFeedback}
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
