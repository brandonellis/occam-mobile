import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Surface, Text } from 'react-native-paper';
import AgentChatInput from '../../components/AgentChat/AgentChatInput';
import AgentChatMessages from '../../components/AgentChat/AgentChatMessages';
import useAuth from '../../hooks/useAuth';
import useMarshal from '../../hooks/useMarshal';
import useMarshalIntent from '../../hooks/useMarshalIntent';
import { submitMarshalFeedback } from '../../services/marshal.api';
import { buildMarshalScreenContext } from '../../helpers/marshalContext.helper';
import { marshalStyles as styles } from '../../styles/marshal.styles';
import logger from '../../helpers/logger.helper';

const MarshalScreen = ({ route }) => {
  const { activeRole } = useAuth();
  const { consumeIntent } = useMarshalIntent();

  const routeParams = route?.params;
  const screenContext = useMemo(
    () => buildMarshalScreenContext(route?.name, routeParams),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [route?.name, routeParams?.clientId, routeParams?.bookingId, routeParams?.serviceId,
     routeParams?.coachId, routeParams?.locationId, routeParams?.resourceId, routeParams?.classSessionId],
  );

  const {
    confirmAction,
    declineAction,
    error,
    handleDiscardEmail,
    handleIncomingIntent,
    handleSendEmail,
    input,
    isConnected,
    isLoading,
    isRestoring,
    messages,
    resetConversation,
    runHealthCheck,
    selectSuggestion,
    sendCurrentMessage,
    sessionId,
    setInput,
    suggestions,
  } = useMarshal({ screenContext });

  const handleFeedback = useCallback(({ rating, reason }) => {
    if (!sessionId) return;
    submitMarshalFeedback(sessionId, { rating, reason });
  }, [sessionId]);

  // Consume pending intent on focus (handles normal tab navigation)
  useFocusEffect(useCallback(() => {
    runHealthCheck();
    if (isRestoring) {
      logger.log('Marshal: deferring intent consume until restore completes');
      return;
    }
    const intent = consumeIntent();
    if (intent) {
      handleIncomingIntent(intent);
      scrollToConversation();
    }
  }, [consumeIntent, handleIncomingIntent, isRestoring, runHealthCheck, scrollToConversation]));

  // Consume pending intent after restoration completes (handles role-switch + fresh mount)
  const wasRestoringRef = useRef(true);
  useEffect(() => {
    if (wasRestoringRef.current && !isRestoring) {
      wasRestoringRef.current = false;
      const intent = consumeIntent();
      if (intent) {
        handleIncomingIntent(intent);
        scrollToConversation();
      }
    }
  }, [isRestoring, consumeIntent, handleIncomingIntent, scrollToConversation]);

  const roleLabel = activeRole === 'coach' ? 'Coach' : 'Admin';

  const scrollRef = useRef(null);
  const conversationYRef = useRef(0);

  const scrollToConversation = useCallback(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo?.({ y: conversationYRef.current, animated: true });
    }, 200);
  }, []);

  const handleFocusInput = useCallback(() => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd?.({ animated: true });
    }, 300);
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          <Surface style={styles.heroCard} elevation={1}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>{roleLabel} operations</Text>
            </View>
            <View style={styles.heroTitleRow}>
              <Text style={styles.heroTitle}>Marshal</Text>
              <View style={styles.betaBadge}><Text style={styles.betaBadgeText}>Beta</Text></View>
              <View style={[
                styles.statusDot,
                isConnected === true ? styles.statusConnected
                  : isConnected === false ? styles.statusDisconnected
                    : styles.statusUnknown,
              ]} />
            </View>
          </Surface>

          <View onLayout={(e) => { conversationYRef.current = e.nativeEvent.layout.y; }} style={styles.section}>
            <Text style={styles.sectionTitle}>Conversation</Text>
            <Text style={styles.sectionHint}>
              Ask for a summary, next actions, follow-ups, or booking pressure by day.
            </Text>
            <AgentChatMessages
              agentLabel="Marshal"
              isLoading={isLoading}
              loadingLabel="Marshal is reviewing operations…"
              messages={messages}
              onConfirmAction={confirmAction}
              onDeclineAction={declineAction}
              onSendEmail={handleSendEmail}
              onDiscardEmail={handleDiscardEmail}
              onFeedback={handleFeedback}
            />
            <AgentChatInput
              error={error}
              input={input}
              isLoading={isLoading}
              onChangeText={setInput}
              onSelectSuggestion={selectSuggestion}
              onSend={sendCurrentMessage}
              onFocus={handleFocusInput}
              placeholder="Ask Marshal about bookings, staffing, or follow-ups…"
              suggestions={suggestions}
            />
          </View>

          <Button mode="text" onPress={resetConversation}>
            Reset conversation
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

MarshalScreen.propTypes = {
  route: PropTypes.shape({
    name: PropTypes.string,
    params: PropTypes.object,
  }),
};

export default MarshalScreen;
