import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Icon, Surface, Text } from 'react-native-paper';
import AgentChatInput from '../../components/AgentChat/AgentChatInput';
import AgentChatMessages from '../../components/AgentChat/AgentChatMessages';
import useAuth from '../../hooks/useAuth';
import useMarshal from '../../hooks/useMarshal';
import useMarshalIntent from '../../hooks/useMarshalIntent';
import { buildMarshalScreenContext } from '../../helpers/marshalContext.helper';
import { agentChatStyles as chatStyles } from '../../styles/agentChat.styles';
import { marshalStyles as styles } from '../../styles/marshal.styles';

const INSIGHT_ACCENT_COLORS = [
  chatStyles.insightCardAccentBlue,
  chatStyles.insightCardAccentGold,
  chatStyles.insightCardAccentCoral,
];

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
    handleIncomingIntent,
    input,
    insights,
    isConnected,
    isLoading,
    isRefreshingInsights,
    isRestoring,
    messages,
    refreshInsights,
    resetConversation,
    runHealthCheck,
    selectSuggestion,
    sendCurrentMessage,
    setInput,
    suggestions,
  } = useMarshal({ screenContext });

  // Consume pending intent on focus (handles normal tab navigation)
  useFocusEffect(useCallback(() => {
    runHealthCheck();
    if (isRestoring) return;
    const intent = consumeIntent();
    if (intent) handleIncomingIntent(intent);
  }, [consumeIntent, handleIncomingIntent, isRestoring, runHealthCheck]));

  // Consume pending intent after restoration completes (handles role-switch + fresh mount)
  const wasRestoringRef = useRef(true);
  useEffect(() => {
    if (wasRestoringRef.current && !isRestoring) {
      wasRestoringRef.current = false;
      const intent = consumeIntent();
      if (intent) handleIncomingIntent(intent);
    }
  }, [isRestoring, consumeIntent, handleIncomingIntent]);

  const roleLabel = activeRole === 'coach' ? 'Coach' : 'Admin';

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
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>{roleLabel} operations</Text>
            </View>
            <View style={styles.heroTitleRow}>
              <Text style={styles.heroTitle}>Marshal</Text>
              <View style={[
                styles.statusDot,
                isConnected === true ? styles.statusConnected
                  : isConnected === false ? styles.statusDisconnected
                    : styles.statusUnknown,
              ]} />
            </View>
            <Text style={styles.heroBody}>
              Review operational priorities, ask questions about the schedule, and surface the next best actions for your facility.
            </Text>
          </Surface>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Insights</Text>
                <Text style={styles.sectionHint}>Marshal highlights the most actionable items first.</Text>
              </View>
              <Button mode="text" loading={isRefreshingInsights} onPress={refreshInsights}>
                Refresh
              </Button>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={chatStyles.insightsRow}>
              {insights.map((insight, index) => (
                <Pressable key={insight.id} onPress={() => selectSuggestion(insight.prompt)}>
                  <Surface
                    style={[
                      chatStyles.insightCard,
                      chatStyles.insightCardAccent,
                      INSIGHT_ACCENT_COLORS[index % INSIGHT_ACCENT_COLORS.length],
                    ]}
                    elevation={0}
                  >
                    <Text style={chatStyles.insightTitle}>{insight.title}</Text>
                    <Text style={chatStyles.insightBody} numberOfLines={3}>{insight.body}</Text>
                    <View style={chatStyles.insightActionRow}>
                      <Text style={chatStyles.insightActionText}>Ask Marshal</Text>
                      <Icon source="arrow-right" size={14} color={chatStyles.insightActionArrow.color} />
                    </View>
                  </Surface>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <View style={styles.section}>
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
