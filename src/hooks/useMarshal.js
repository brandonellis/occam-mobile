import { useCallback, useEffect, useState } from 'react';
import logger from '../helpers/logger.helper';
import { buildMessage, normalizeSuggestions } from '../helpers/agentChat.helper';
import { AGENT_CHAT_ACTIONS } from '../reducers/agentChat.reducer';
import { confirmMarshalAction, discardClientEmail, getMarshalInsights, sendClientEmail, sendMarshalMessage, saveMarshalConversation, loadMarshalConversation, checkMarshalHealth } from '../services/marshal.api';
import { MARSHAL_MESSAGES_KEY, MARSHAL_SESSION_KEY } from '../helpers/chatPersistence.helper';
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

// ── Natural language confirmation shortcuts ──

const AFFIRMATIVE_REPLIES = ['yes', 'y', 'ok', 'okay', 'confirm', 'confirmed', 'do it', 'go ahead'];
const NEGATIVE_REPLIES = ['no', 'n', 'cancel', 'stop', 'never mind'];

const findPendingConfirmation = (messages) => {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.type === 'confirmation' && !msg.resolved && Array.isArray(msg.pendingActions) && msg.pendingActions.length > 0) {
      return { message: msg, index: i };
    }
  }
  return null;
};

// ── Helpers ──

/**
 * Build insight cards from the structured API response.
 * Falls back to the array format for backwards compatibility,
 * then to INITIAL_INSIGHTS as a last resort.
 */
const normalizeInsights = (raw) => {
  // Handle structured object response (keyed by insight type)
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const data = raw.data || raw;
    const cards = [];

    const exp = data.expiring_memberships;
    if (exp && (exp.count ?? 0) > 0) {
      cards.push({
        id: 'expiring-memberships',
        title: 'Expiring Memberships',
        body: `${exp.count} membership${exp.count !== 1 ? 's' : ''} expiring in the next 30 days.`,
        prompt: 'Review expiring memberships and recommend follow-up actions.',
      });
    }

    const rev = data.revenue_trend;
    if (rev && !rev.unavailable) {
      const dir = (rev.change_pct ?? 0) >= 0 ? 'up' : 'down';
      cards.push({
        id: 'revenue-trend',
        title: 'Revenue Trend',
        body: `${rev.this_month_fmt ?? '$0'} this month (${dir} ${Math.abs(rev.change_pct ?? 0)}% vs last month).`,
        prompt: 'Analyze our revenue trend and recommend ways to improve.',
      });
    }

    const cap = data.capacity;
    if (cap) {
      cards.push({
        id: 'capacity',
        title: 'Weekly Capacity',
        body: `${cap.booked_hours ?? 0} hrs booked across ${cap.coach_count ?? 0} coach${(cap.coach_count ?? 0) !== 1 ? 'es' : ''} this week.`,
        prompt: 'What capacity issues should I watch this week?',
      });
    }

    const eng = data.client_engagement;
    if (eng && (eng.inactive_count ?? 0) > 0) {
      cards.push({
        id: 'client-engagement',
        title: 'Client Engagement',
        body: `${eng.inactive_count} of ${eng.total_clients ?? 0} clients inactive for 30+ days.`,
        prompt: 'Which inactive clients should I reach out to first?',
      });
    }

    const cd = data.caddie_demand;
    if (cd && !cd.unavailable && cd.has_signals) {
      cards.push({
        id: 'caddie-demand',
        title: 'Caddie Demand',
        body: `${cd.total_signals ?? 0} friction signal${(cd.total_signals ?? 0) !== 1 ? 's' : ''} in the last ${cd.period_days ?? 7} days.`,
        prompt: 'Analyze Caddie demand signals and recommend improvements.',
      });
    }

    const conv = data.conversions;
    if (conv && !conv.unavailable && conv.has_signals) {
      cards.push({
        id: 'conversions',
        title: 'Conversions',
        body: `${conv.total_signals ?? 0} conversion event${(conv.total_signals ?? 0) !== 1 ? 's' : ''} in the last ${conv.period_days ?? 7} days.`,
        prompt: 'Review conversion activity and highlight trends.',
      });
    }

    if (cards.length > 0) return cards.slice(0, 4);
  }

  // Handle legacy array format
  if (Array.isArray(raw) && raw.length > 0) {
    return raw.slice(0, 4).map((item, index) => ({
      id: item.id || item.action_id || `marshal-insight-${index}`,
      title: item.title || 'Insight',
      body: item.summary || item.description || 'Marshal surfaced a new operational recommendation.',
      prompt: item.prompt || item.title || INITIAL_SUGGESTIONS[0],
    }));
  }

  return INITIAL_INSIGHTS;
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

  // ── Marshal-specific: action confirmation ──

  const confirmAction = useCallback(async (action) => {
    if (!action?.tool || chat.isLoading) return;

    dispatch({ type: AGENT_CHAT_ACTIONS.SET_LOADING, payload: true });
    dispatch({ type: AGENT_CHAT_ACTIONS.SET_ERROR, payload: null });

    try {
      const result = await confirmMarshalAction(action.action_id);

      // Mark the confirmation message as resolved
      const pending = findPendingConfirmation(chat.messages);
      if (pending) {
        const remainingActions = pending.message.pendingActions.filter((a) => a.action_id !== action.action_id);
        dispatch({
          type: AGENT_CHAT_ACTIONS.UPDATE_MESSAGE,
          payload: {
            id: pending.message.id,
            updates: {
              pendingActions: remainingActions,
              resolved: remainingActions.length === 0,
            },
          },
        });
      }

      dispatch({
        type: AGENT_CHAT_ACTIONS.APPEND_MESSAGE,
        payload: buildMessage('assistant', result?.message || 'Marshal completed that action.', {
          type: result?.email_preview ? 'email_preview' : 'action_result',
          success: Boolean(result?.success),
          nextStep: result?.next_step || null,
          emailPreview: result?.email_preview || null,
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
  }, [chat.isLoading, chat.messages, dispatch]);

  const declineAction = useCallback(() => {
    // Mark the confirmation message as resolved
    const pending = findPendingConfirmation(chat.messages);
    if (pending) {
      dispatch({
        type: AGENT_CHAT_ACTIONS.UPDATE_MESSAGE,
        payload: {
          id: pending.message.id,
          updates: { pendingActions: [], resolved: true },
        },
      });
    }

    dispatch({
      type: AGENT_CHAT_ACTIONS.APPEND_MESSAGE,
      payload: buildMessage('assistant', 'No problem \u2014 the action was cancelled. What would you like to do next?'),
    });
  }, [chat.messages, dispatch]);

  // ── Email send/discard from preview card ──

  const handleSendEmail = useCallback(async (campaignId) => {
    if (!campaignId) return;
    dispatch({ type: AGENT_CHAT_ACTIONS.SET_LOADING, payload: true });

    try {
      const result = await sendClientEmail(campaignId);

      // Update the email preview message to show sent status
      const previewMsg = chat.messages.find((m) => m.emailPreview?.campaign_id === campaignId);
      if (previewMsg) {
        dispatch({
          type: AGENT_CHAT_ACTIONS.UPDATE_MESSAGE,
          payload: {
            id: previewMsg.id,
            updates: {
              emailPreview: { ...previewMsg.emailPreview, status: 'sent' },
            },
          },
        });
      }

      dispatch({
        type: AGENT_CHAT_ACTIONS.APPEND_MESSAGE,
        payload: buildMessage('assistant', result?.message || 'Email sent successfully.', {
          type: 'action_result',
          success: true,
          nextStep: result?.next_step || null,
        }),
      });
    } catch (error) {
      logger.warn('Marshal email send failed:', error?.message || error);
      dispatch({
        type: AGENT_CHAT_ACTIONS.APPEND_MESSAGE,
        payload: buildMessage('assistant', error?.response?.data?.message || error?.message || 'Failed to send email.', {
          type: 'action_result',
          success: false,
        }),
      });
    } finally {
      dispatch({ type: AGENT_CHAT_ACTIONS.SET_LOADING, payload: false });
    }
  }, [chat.messages, dispatch]);

  const handleDiscardEmail = useCallback(async (campaignId) => {
    if (!campaignId) return;

    try {
      await discardClientEmail(campaignId);
    } catch (error) {
      logger.warn('Marshal email discard failed:', error?.message || error);
    }

    // Update the email preview message to show discarded
    const previewMsg = chat.messages.find((m) => m.emailPreview?.campaign_id === campaignId);
    if (previewMsg) {
      dispatch({
        type: AGENT_CHAT_ACTIONS.UPDATE_MESSAGE,
        payload: {
          id: previewMsg.id,
          updates: {
            emailPreview: { ...previewMsg.emailPreview, status: 'discarded' },
            type: 'action_result',
            success: false,
          },
        },
      });
    }

    dispatch({
      type: AGENT_CHAT_ACTIONS.APPEND_MESSAGE,
      payload: buildMessage('assistant', 'Email draft discarded. Would you like me to draft a different message?'),
    });
  }, [chat.messages, dispatch]);

  // ── Natural language confirmation interception ──

  const sendMessage = useCallback(async (value, options = {}) => {
    const trimmed = typeof value === 'string' ? value.trim() : '';
    if (!trimmed) return;

    const pending = findPendingConfirmation(chat.messages);
    if (pending && pending.message.pendingActions.length === 1) {
      const normalized = trimmed.toLowerCase().replace(/[.!?]+$/g, '');

      if (AFFIRMATIVE_REPLIES.includes(normalized)) {
        dispatch({
          type: AGENT_CHAT_ACTIONS.APPEND_MESSAGE,
          payload: buildMessage('user', trimmed),
        });
        dispatch({ type: AGENT_CHAT_ACTIONS.SET_INPUT, payload: '' });
        await confirmAction(pending.message.pendingActions[0]);
        return;
      }

      if (NEGATIVE_REPLIES.includes(normalized)) {
        dispatch({
          type: AGENT_CHAT_ACTIONS.APPEND_MESSAGE,
          payload: buildMessage('user', trimmed),
        });
        dispatch({ type: AGENT_CHAT_ACTIONS.SET_INPUT, payload: '' });
        declineAction();
        return;
      }
    }

    // Pass screen context through to the API
    const enhancedOptions = screenContext
      ? { ...options, pageContext: screenContext }
      : options;

    await chat.sendMessage(value, enhancedOptions);
  }, [chat.messages, chat.sendMessage, confirmAction, declineAction, dispatch, screenContext]);

  const selectSuggestion = useCallback((suggestion) => {
    sendMessage(suggestion);
  }, [sendMessage]);

  const sendCurrentMessage = useCallback(() => {
    sendMessage(chat.input);
  }, [sendMessage, chat.input]);

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
