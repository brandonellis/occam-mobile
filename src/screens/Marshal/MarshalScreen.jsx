import React, { useCallback } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Icon, Surface, Text } from 'react-native-paper';
import AgentChatInput from '../../components/AgentChat/AgentChatInput';
import AgentChatMessages from '../../components/AgentChat/AgentChatMessages';
import useAuth from '../../hooks/useAuth';
import useMarshal from '../../hooks/useMarshal';
import { agentChatStyles as chatStyles } from '../../styles/agentChat.styles';
import { marshalStyles as styles } from '../../styles/marshal.styles';

const INSIGHT_ACCENT_COLORS = [
  chatStyles.insightCardAccentBlue,
  chatStyles.insightCardAccentGold,
  chatStyles.insightCardAccentCoral,
];

const MarshalScreen = ({ navigation, route }) => {
  const { activeRole } = useAuth();
  const handleIntentConsumed = useCallback(() => {
    if (navigation?.setParams && route?.params?.marshalIntent) {
      navigation.setParams({ marshalIntent: null });
    }
  }, [navigation, route?.params?.marshalIntent]);
  const {
    confirmAction,
    declineAction,
    error,
    input,
    insights,
    isLoading,
    isRefreshingInsights,
    messages,
    refreshInsights,
    resetConversation,
    selectSuggestion,
    sendCurrentMessage,
    setInput,
    suggestions,
  } = useMarshal({
    initialIntent: route?.params?.marshalIntent || null,
    onIntentConsumed: handleIntentConsumed,
  });

  const roleLabel = activeRole === 'coach' ? 'Coach' : 'Admin';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Surface style={styles.heroCard} elevation={1}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>{roleLabel} operations</Text>
          </View>
          <Text style={styles.heroTitle}>Marshal</Text>
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
            placeholder="Ask Marshal about bookings, staffing, or follow-ups…"
            suggestions={suggestions}
          />
        </View>

        <Button mode="text" onPress={resetConversation}>
          Reset conversation
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
};

export default MarshalScreen;
