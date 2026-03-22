import { useCallback, useEffect, useState } from 'react';
import logger from '../helpers/logger.helper';
import { buildMessage } from '../helpers/agentChat.helper';
import { AGENT_CHAT_ACTIONS } from '../reducers/agentChat.reducer';
import { getMarshalInsights, sendMarshalMessage, saveMarshalConversation, loadMarshalConversation, checkMarshalHealth } from '../services/marshal.api';
import { MARSHAL_MESSAGES_KEY, MARSHAL_SESSION_KEY } from '../helpers/chatPersistence.helper';
import useAgentChat from './useAgentChat';
import useMarshalActions from './useMarshalActions';
import {
  INITIAL_SUGGESTIONS,
  INITIAL_MESSAGES,
  INITIAL_INSIGHTS,
  normalizeInsights,
  normalizeIntent,
  transformMarshalResponse,
} from '../helpers/marshal.helpers';

const useMarshal = ({ screenContext = null } = {}) => {
  const chat = useAgentChat({
    agentName: 'Marshal',
    initialMessages: INITIAL_MESSAGES,
    initialSuggestions: INITIAL_SUGGESTIONS,
    sendMessageApi: sendMarshalMessage,
    fallbackMessage: 'Marshal couldn\u2019t complete that request right now. Try rephrasing the question or check back in a moment.',
    supportsStreaming: true,
    transformResponse: transformMarshalResponse,
    // Persistence
    messagesStorageKey: MARSHAL_MESSAGES_KEY,
    sessionStorageKey: MARSHAL_SESSION_KEY,
    saveConversationApi: saveMarshalConversation,
    loadConversationApi: loadMarshalConversation,
    // Connection status
    healthCheckApi: checkMarshalHealth,
  });

  const { dispatch } = chat;
  const [insights, setInsights] = useState(INITIAL_INSIGHTS);
  const [isRefreshingInsights, setIsRefreshingInsights] = useState(false);

  const {
    confirmAction,
    declineAction,
    handleSendEmail,
    handleDiscardEmail,
    sendMessage,
    selectSuggestion,
    sendCurrentMessage,
  } = useMarshalActions({ chat, dispatch, screenContext });

  // ── Marshal-specific: insights ──

  const refreshInsights = useCallback(async () => {
    setIsRefreshingInsights(true);

    try {
      const result = await getMarshalInsights();
      setInsights(normalizeInsights(result));
    } catch (error) {
      logger.warn('Marshal mobile insights failed:', error?.message || error);
      setInsights(INITIAL_INSIGHTS);
    } finally {
      setIsRefreshingInsights(false);
    }
  }, []);

  useEffect(() => {
    refreshInsights();
  }, [refreshInsights]);

  // ── Marshal-specific: imperative intent handling ──

  const handleIncomingIntent = useCallback(async (rawIntent) => {
    const intent = normalizeIntent(rawIntent);
    if (!intent?.message) {
      if (rawIntent) logger.log('Marshal: ignoring intent without message');
      return;
    }

    // Start a fresh conversation for each incoming intent
    await chat.resetConversation();

    if (intent?.handoff) {
      dispatch({
        type: AGENT_CHAT_ACTIONS.APPEND_MESSAGE,
        payload: buildMessage(
          'assistant',
          intent.handoff.summary || intent.handoff.title || 'Prepared handoff ready for review.',
          { type: 'handoff', handoff: intent.handoff }
        ),
      });
    }

    await sendMessage(intent.message, {
      displayText: intent?.handoff?.summary || intent?.handoff?.title || intent.message,
      freshStart: true,
    });
  }, [chat.resetConversation, dispatch, sendMessage]);

  return {
    ...chat,
    confirmAction,
    declineAction,
    handleDiscardEmail,
    handleIncomingIntent,
    handleSendEmail,
    insights,
    isRefreshingInsights,
    refreshInsights,
    sendMessage,
    selectSuggestion,
    sendCurrentMessage,
  };
};

export default useMarshal;
