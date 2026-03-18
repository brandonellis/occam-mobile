import { useCallback, useEffect, useRef, useState } from 'react';
import logger from '../helpers/logger.helper';
import { buildMessage, normalizeSuggestions } from '../helpers/agentChat.helper';
import { AGENT_CHAT_ACTIONS } from '../reducers/agentChat.reducer';
import { confirmMarshalAction, getMarshalInsights, sendMarshalMessage } from '../services/marshal.api';
import useAgentChat from './useAgentChat';

const INITIAL_SUGGESTIONS = [
  'Summarize today\u2019s bookings',
  'What should I focus on next?',
  'Show operational risks for this week',
];

const INITIAL_MESSAGES = [
  {
    id: 'marshal-welcome',
    sender: 'assistant',
    text: 'I\u2019m Marshal. I can help you review operational priorities, summarize schedule pressure, and surface next actions for your facility.',
  },
];

const INITIAL_INSIGHTS = [
  {
    id: 'today-summary',
    title: 'Today\u2019s Board',
    body: 'Ask Marshal for a quick summary of bookings, schedule gaps, and follow-ups before you start your day.',
    prompt: 'Summarize today\u2019s bookings',
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

const normalizeIntent = (intent) => {
  if (!intent) return null;
  if (typeof intent === 'string') return { message: intent };

  return {
    ...intent,
    message: intent.message || intent.prompt || intent.handoff?.prompt || '',
  };
};

/**
 * Marshal-specific response transformer for useAgentChat.
 * Handles pendingActions and card data that Caddie doesn't need.
 */
const transformMarshalResponse = (result, initialSuggs) => {
  const responseText = result?.response || 'Marshal processed your request but did not return any text.';
  const pendingActions = Array.isArray(result?.pending_actions) ? result.pending_actions : [];
  const card = result?.card || null;
  const suggestions = normalizeSuggestions(result?.suggested_actions, initialSuggs);

  return {
    message: buildMessage('assistant', responseText, {
      type: pendingActions.length > 0 ? 'confirmation' : 'assistant',
      pendingActions,
      card,
    }),
    suggestions,
  };
};

const useMarshal = ({ initialIntent = null, onIntentConsumed = null } = {}) => {
  const chat = useAgentChat({
    agentName: 'Marshal',
    initialMessages: INITIAL_MESSAGES,
    initialSuggestions: INITIAL_SUGGESTIONS,
    sendMessageApi: sendMarshalMessage,
    fallbackMessage: 'Marshal couldn\u2019t complete that request right now. Try rephrasing the question or check back in a moment.',
    transformResponse: transformMarshalResponse,
  });

  const { dispatch, sendMessage } = chat;
  const [insights, setInsights] = useState(INITIAL_INSIGHTS);
  const [isRefreshingInsights, setIsRefreshingInsights] = useState(false);
  const consumedIntentRef = useRef(null);

  // ── Marshal-specific: action confirmation ──

  const confirmAction = useCallback(async (action) => {
    if (!action?.tool || chat.isLoading) return;

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
  }, [chat.isLoading, dispatch]);

  const declineAction = useCallback(() => {
    dispatch({
      type: AGENT_CHAT_ACTIONS.APPEND_MESSAGE,
      payload: buildMessage('assistant', 'No problem \u2014 the action was cancelled. What would you like to do next?'),
    });
  }, [dispatch]);

  // ── Marshal-specific: insights ──

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

  // ── Marshal-specific: intent consumption (Caddie → Marshal handoff) ──

  useEffect(() => {
    const intent = normalizeIntent(initialIntent);
    const intentKey = intent?.id || intent?.message || intent?.handoff?.prompt || null;

    if (!intentKey || consumedIntentRef.current === intentKey || chat.isLoading) {
      return;
    }

    consumedIntentRef.current = intentKey;

    if (intent?.handoff) {
      dispatch({
        type: AGENT_CHAT_ACTIONS.APPEND_MESSAGE,
        payload: buildMessage(
          'assistant',
          intent.handoff.summary || intent.handoff.title || 'Prepared Caddie handoff ready for review.',
          { type: 'handoff', handoff: intent.handoff }
        ),
      });
    }

    if (intent?.message) {
      sendMessage(intent.message, {
        displayText: intent?.handoff?.summary || intent?.handoff?.title || intent.message,
      });
    }

    onIntentConsumed?.();
  }, [initialIntent, chat.isLoading, onIntentConsumed, sendMessage, dispatch]);

  return {
    ...chat,
    confirmAction,
    declineAction,
    insights,
    isRefreshingInsights,
    refreshInsights,
  };
};

export default useMarshal;
