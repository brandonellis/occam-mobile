import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import logger from '../helpers/logger.helper';
import { AGENT_CHAT_ACTIONS, agentChatReducer, createInitialAgentChatState } from '../reducers/agentChat.reducer';
import { confirmMarshalAction, getMarshalInsights, sendMarshalMessage } from '../services/marshal.api';

const INITIAL_SUGGESTIONS = [
  'Summarize today’s bookings',
  'What should I focus on next?',
  'Show operational risks for this week',
];

const INITIAL_MESSAGES = [
  {
    id: 'marshal-welcome',
    sender: 'assistant',
    text: 'I’m Marshal. I can help you review operational priorities, summarize schedule pressure, and surface next actions for your facility.',
  },
];

const INITIAL_INSIGHTS = [
  {
    id: 'today-summary',
    title: 'Today’s Board',
    body: 'Ask Marshal for a quick summary of bookings, schedule gaps, and follow-ups before you start your day.',
    prompt: 'Summarize today’s bookings',
  },
  {
    id: 'client-followups',
    title: 'Follow-Ups',
    body: 'Marshal can help identify clients who may need outreach, rebooking, or schedule recovery.',
    prompt: 'Which clients need follow-up this week?',
  },
  {
    id: 'capacity-check',
    title: 'Capacity View',
    body: 'Use Marshal to spot schedule pressure, under-booked windows, and coach availability opportunities.',
    prompt: 'What capacity issues should I watch this week?',
  },
];

const normalizeInsights = (insights) => {
  if (!Array.isArray(insights) || insights.length === 0) {
    return INITIAL_INSIGHTS;
  }

  return insights.slice(0, 3).map((item, index) => ({
    id: item.id || item.action_id || `marshal-insight-${index}`,
    title: item.title || 'Insight',
    body: item.summary || item.description || 'Marshal surfaced a new operational recommendation.',
    prompt: item.prompt || item.title || INITIAL_SUGGESTIONS[0],
  }));
};

const buildMessage = (sender, text, extras = {}) => ({
  id: `${sender}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  sender,
  text,
  ...extras,
});

const buildHistory = (messages) => messages
  .filter((message) => ['assistant', 'user'].includes(message.sender) && typeof message.text === 'string')
  .map((message) => ({
    role: message.sender === 'user' ? 'user' : 'assistant',
    content: message.text,
  }));

const normalizeSuggestions = (suggestedActions) => {
  if (!Array.isArray(suggestedActions) || suggestedActions.length === 0) {
    return INITIAL_SUGGESTIONS;
  }

  return suggestedActions
    .map((action) => action?.prompt || action?.label)
    .filter(Boolean)
    .slice(0, 3);
};

const normalizeIntent = (intent) => {
  if (!intent) {
    return null;
  }

  if (typeof intent === 'string') {
    return { message: intent };
  }

  return {
    ...intent,
    message: intent.message || intent.prompt || intent.handoff?.prompt || '',
  };
};

const useMarshal = ({ initialIntent = null, onIntentConsumed = null } = {}) => {
  const [chatState, dispatch] = useReducer(
    agentChatReducer,
    createInitialAgentChatState({
      messages: INITIAL_MESSAGES,
      suggestions: INITIAL_SUGGESTIONS,
    })
  );
  const [insights, setInsights] = useState(INITIAL_INSIGHTS);
  const [isRefreshingInsights, setIsRefreshingInsights] = useState(false);
  const consumedIntentRef = useRef(null);

  const setInput = useCallback((value) => {
    dispatch({ type: AGENT_CHAT_ACTIONS.SET_INPUT, payload: value });
  }, []);

  const resetConversation = useCallback(() => {
    dispatch({ type: AGENT_CHAT_ACTIONS.RESET_MESSAGES, payload: INITIAL_MESSAGES });
    dispatch({ type: AGENT_CHAT_ACTIONS.SET_SUGGESTIONS, payload: INITIAL_SUGGESTIONS });
    dispatch({ type: AGENT_CHAT_ACTIONS.SET_INPUT, payload: '' });
    dispatch({ type: AGENT_CHAT_ACTIONS.SET_ERROR, payload: null });
  }, []);

  const sendMessage = useCallback(async (value, options = {}) => {
    const trimmed = value.trim();

    if (!trimmed || chatState.isLoading) {
      return;
    }

    const userMessage = buildMessage('user', options.displayText || trimmed);
    const history = buildHistory([...chatState.messages, userMessage]);

    dispatch({ type: AGENT_CHAT_ACTIONS.APPEND_MESSAGE, payload: userMessage });
    dispatch({ type: AGENT_CHAT_ACTIONS.SET_INPUT, payload: '' });
    dispatch({ type: AGENT_CHAT_ACTIONS.SET_ERROR, payload: null });
    dispatch({ type: AGENT_CHAT_ACTIONS.SET_LOADING, payload: true });

    try {
      const result = await sendMarshalMessage(trimmed, history);
      const responseText = result?.response || 'Marshal processed your request but did not return any text.';
      const pendingActions = Array.isArray(result?.pending_actions) ? result.pending_actions : [];
      const card = result?.card || null;
      const suggestions = normalizeSuggestions(result?.suggested_actions);

      dispatch({
        type: AGENT_CHAT_ACTIONS.APPEND_MESSAGE,
        payload: buildMessage('assistant', responseText, {
          type: pendingActions.length > 0 ? 'confirmation' : 'assistant',
          pendingActions,
          card,
        }),
      });
      dispatch({ type: AGENT_CHAT_ACTIONS.SET_SUGGESTIONS, payload: suggestions });
    } catch (error) {
      logger.warn('Marshal mobile message failed:', error?.message || error);
      dispatch({
        type: AGENT_CHAT_ACTIONS.APPEND_MESSAGE,
        payload: buildMessage(
          'assistant',
          'Marshal couldn’t complete that request right now. Try rephrasing the question or check back in a moment.'
        ),
      });
      dispatch({
        type: AGENT_CHAT_ACTIONS.SET_ERROR,
        payload: error?.response?.data?.message || error?.message || 'Marshal is temporarily unavailable.',
      });
      dispatch({ type: AGENT_CHAT_ACTIONS.SET_SUGGESTIONS, payload: INITIAL_SUGGESTIONS });
    } finally {
      dispatch({ type: AGENT_CHAT_ACTIONS.SET_LOADING, payload: false });
    }
  }, [chatState.isLoading, chatState.messages]);

  const confirmAction = useCallback(async (action) => {
    if (!action?.tool || chatState.isLoading) {
      return;
    }

    dispatch({ type: AGENT_CHAT_ACTIONS.SET_LOADING, payload: true });
    dispatch({ type: AGENT_CHAT_ACTIONS.SET_ERROR, payload: null });

    try {
      const result = await confirmMarshalAction(action.tool, action.args || {});
      dispatch({
        type: AGENT_CHAT_ACTIONS.APPEND_MESSAGE,
        payload: buildMessage('assistant', result?.message || 'Marshal completed that action.', {
          type: 'action_result',
          success: Boolean(result?.success),
          nextStep: result?.next_step || null,
        }),
      });
    } catch (error) {
      logger.warn('Marshal mobile confirm failed:', error?.message || error);
      dispatch({
        type: AGENT_CHAT_ACTIONS.APPEND_MESSAGE,
        payload: buildMessage('assistant', error?.response?.data?.message || error?.message || 'Marshal could not complete that action.', {
          type: 'action_result',
          success: false,
          nextStep: null,
        }),
      });
      dispatch({
        type: AGENT_CHAT_ACTIONS.SET_ERROR,
        payload: error?.response?.data?.message || error?.message || 'Marshal could not complete that action.',
      });
    } finally {
      dispatch({ type: AGENT_CHAT_ACTIONS.SET_LOADING, payload: false });
    }
  }, [chatState.isLoading]);

  const declineAction = useCallback(() => {
    dispatch({
      type: AGENT_CHAT_ACTIONS.APPEND_MESSAGE,
      payload: buildMessage('assistant', 'No problem — the action was cancelled. What would you like to do next?'),
    });
  }, []);

  const sendCurrentMessage = useCallback(() => {
    sendMessage(chatState.input);
  }, [chatState.input, sendMessage]);

  const selectSuggestion = useCallback((suggestion) => {
    sendMessage(suggestion);
  }, [sendMessage]);

  const refreshInsights = useCallback(async () => {
    setIsRefreshingInsights(true);

    try {
      const result = await getMarshalInsights();
      const normalized = Array.isArray(result) ? result : result?.items || result?.data || [];
      setInsights(normalizeInsights(normalized));
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

  useEffect(() => {
    const intent = normalizeIntent(initialIntent);
    const intentKey = intent?.id || intent?.message || intent?.handoff?.prompt || null;

    if (!intentKey || consumedIntentRef.current === intentKey || chatState.isLoading) {
      return;
    }

    consumedIntentRef.current = intentKey;

    if (intent?.handoff) {
      dispatch({
        type: AGENT_CHAT_ACTIONS.APPEND_MESSAGE,
        payload: buildMessage(
          'assistant',
          intent.handoff.summary || intent.handoff.title || 'Prepared Caddie handoff ready for review.',
          {
            type: 'handoff',
            handoff: intent.handoff,
          }
        ),
      });
    }

    if (intent?.message) {
      sendMessage(intent.message, {
        displayText: intent?.handoff?.summary || intent?.handoff?.title || intent.message,
      });
    }

    onIntentConsumed?.();
  }, [initialIntent, chatState.isLoading, onIntentConsumed, sendMessage]);

  return {
    ...chatState,
    confirmAction,
    declineAction,
    insights,
    isRefreshingInsights,
    refreshInsights,
    resetConversation,
    selectSuggestion,
    sendCurrentMessage,
    sendMessage,
    setInput,
  };
};

export default useMarshal;
