import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import logger from '../helpers/logger.helper';
import { buildMessage, buildHistory, normalizeSuggestions } from '../helpers/agentChat.helper';
import { AGENT_CHAT_ACTIONS, agentChatReducer, createInitialAgentChatState } from '../reducers/agentChat.reducer';
import {
  saveMessages,
  loadMessages,
  saveSessionId,
  loadSessionId,
  clearPersistence,
  normalizePersistedMessages,
  generateSessionId,
  messagesToServerFormat,
  SERVER_SAVE_DEBOUNCE_MS,
} from '../helpers/chatPersistence.helper';

const defaultFallback = (agentName, suggestions) => ({
  response: `${agentName} is available on mobile now, and the live AI backend is still being connected. You can already use this screen as the home for ${agentName.toLowerCase()} conversations.`,
  suggested_actions: suggestions.map((prompt) => ({ prompt })),
});

const useAgentChat = ({
  agentName,
  initialMessages,
  initialSuggestions,
  sendMessageApi,
  fallbackMessage,
  supportsBookingState = false,
  supportsStreaming = false,
  transformResponse,
  // Persistence options
  messagesStorageKey,
  sessionStorageKey,
  saveConversationApi,
  loadConversationApi,
  // Connection status
  healthCheckApi,
}) => {
  const [state, dispatch] = useReducer(
    agentChatReducer,
    createInitialAgentChatState({
      messages: initialMessages,
      suggestions: initialSuggestions,
    })
  );

  const streamingTextRef = useRef('');
  const restoringRef = useRef(!!messagesStorageKey);
  const [isRestoring, setIsRestoring] = useState(!!messagesStorageKey);
  const serverSaveTimerRef = useRef(null);
  const latestMessagesRef = useRef(state.messages);
  latestMessagesRef.current = state.messages;

  // ── Persistence: restore on mount ──

  useEffect(() => {
    if (!messagesStorageKey) return;

    const restore = async () => {
      try {
        // Restore or generate session ID
        let sessionId = sessionStorageKey ? await loadSessionId(sessionStorageKey) : null;
        if (!sessionId) {
          sessionId = generateSessionId();
          if (sessionStorageKey) await saveSessionId(sessionStorageKey, sessionId);
        }
        dispatch({ type: AGENT_CHAT_ACTIONS.SET_SESSION_ID, payload: sessionId });

        // Try local first, then server
        let restored = await loadMessages(messagesStorageKey);

        if (!restored && loadConversationApi && sessionId) {
          const serverData = await loadConversationApi(sessionId);
          if (serverData?.messages) {
            restored = serverData.messages;
          }
        }

        if (restored && restored.length > 0) {
          const normalized = normalizePersistedMessages(restored);
          if (normalized.length > 0) {
            dispatch({ type: AGENT_CHAT_ACTIONS.SET_MESSAGES, payload: [...initialMessages, ...normalized] });
          }
        }
      } catch (error) {
        logger.warn(`${agentName} restore failed:`, error?.message);
      } finally {
        restoringRef.current = false;
        setIsRestoring(false);
      }
    };

    restore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Persistence: save on message changes ──

  useEffect(() => {
    if (!messagesStorageKey || restoringRef.current) return;

    // Only persist non-initial messages
    const persistable = state.messages.filter((m) => !m.streaming);
    if (persistable.length <= (initialMessages?.length || 0)) return;

    // Save to local storage immediately
    saveMessages(messagesStorageKey, persistable);

    // Debounced server save
    if (saveConversationApi && state.sessionId) {
      if (serverSaveTimerRef.current) clearTimeout(serverSaveTimerRef.current);
      serverSaveTimerRef.current = setTimeout(() => {
        const latest = latestMessagesRef.current.filter((m) => !m.streaming);
        saveConversationApi(state.sessionId, messagesToServerFormat(latest))
          .catch((err) => logger.warn('Server save failed:', err?.message));
      }, SERVER_SAVE_DEBOUNCE_MS);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.messages]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (serverSaveTimerRef.current) clearTimeout(serverSaveTimerRef.current);
    };
  }, []);

  const setInput = useCallback((value) => {
    dispatch({ type: AGENT_CHAT_ACTIONS.SET_INPUT, payload: value });
  }, []);

  const resetConversation = useCallback(async () => {
    dispatch({ type: AGENT_CHAT_ACTIONS.RESET_MESSAGES, payload: initialMessages });
    dispatch({ type: AGENT_CHAT_ACTIONS.SET_SUGGESTIONS, payload: initialSuggestions });
    dispatch({ type: AGENT_CHAT_ACTIONS.SET_INPUT, payload: '' });

    // Clear persisted data
    if (messagesStorageKey) {
      const keysToRemove = [messagesStorageKey];
      if (sessionStorageKey) keysToRemove.push(sessionStorageKey);
      await clearPersistence(...keysToRemove);

      // Generate new session ID
      const newSessionId = generateSessionId();
      dispatch({ type: AGENT_CHAT_ACTIONS.SET_SESSION_ID, payload: newSessionId });
      if (sessionStorageKey) await saveSessionId(sessionStorageKey, newSessionId);
    }
  }, [initialMessages, initialSuggestions, messagesStorageKey, sessionStorageKey]);

  const sendMessage = useCallback(async (value, { slotContext, displayText, pageContext } = {}) => {
    const trimmed = typeof value === 'string' ? value.trim() : '';

    if (!trimmed || state.isLoading || restoringRef.current) {
      return;
    }

    const userMessage = buildMessage('user', displayText || trimmed);
    const history = buildHistory([...state.messages, userMessage]);

    dispatch({ type: AGENT_CHAT_ACTIONS.APPEND_MESSAGE, payload: userMessage });
    dispatch({ type: AGENT_CHAT_ACTIONS.SET_INPUT, payload: '' });
    dispatch({ type: AGENT_CHAT_ACTIONS.SET_ERROR, payload: null });
    dispatch({ type: AGENT_CHAT_ACTIONS.SET_LOADING, payload: true });

    // For streaming agents, add a placeholder message and update it progressively
    const streamingId = supportsStreaming
      ? `streaming-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      : null;

    if (streamingId) {
      streamingTextRef.current = '';
      dispatch({
        type: AGENT_CHAT_ACTIONS.APPEND_MESSAGE,
        payload: buildMessage('assistant', '', { id: streamingId, streaming: true }),
      });
    }

    try {
      const apiOptions = {};
      if (supportsBookingState) {
        if (state.bookingState) {
          apiOptions.bookingState = state.bookingState;
        }
        if (slotContext) {
          apiOptions.slotContext = slotContext;
        }
      }

      if (pageContext) {
        apiOptions.pageContext = pageContext;
      }

      if (supportsStreaming) {
        apiOptions.onToken = (text) => {
          streamingTextRef.current += text;
          dispatch({
            type: AGENT_CHAT_ACTIONS.UPDATE_MESSAGE,
            payload: { id: streamingId, updates: { text: streamingTextRef.current } },
          });
        };
        apiOptions.onCard = (card) => {
          dispatch({
            type: AGENT_CHAT_ACTIONS.UPDATE_MESSAGE,
            payload: { id: streamingId, updates: { card } },
          });
        };
      }

      const result = await sendMessageApi(trimmed, history, apiOptions);

      // Update booking state from response
      if (supportsBookingState && result?.booking_state !== undefined) {
        dispatch({ type: AGENT_CHAT_ACTIONS.SET_BOOKING_STATE, payload: result.booking_state });
      }

      // Mark connection as healthy on success
      dispatch({ type: AGENT_CHAT_ACTIONS.SET_CONNECTED, payload: true });

      // Allow consumers to customize how the response becomes a message + suggestions
      if (transformResponse) {
        const transformed = transformResponse(result, initialSuggestions);
        if (streamingId) {
          // Update the streaming message in-place
          dispatch({
            type: AGENT_CHAT_ACTIONS.UPDATE_MESSAGE,
            payload: { id: streamingId, updates: { ...transformed.message, id: streamingId, streaming: false } },
          });
        } else {
          dispatch({ type: AGENT_CHAT_ACTIONS.APPEND_MESSAGE, payload: transformed.message });
        }
        dispatch({ type: AGENT_CHAT_ACTIONS.SET_SUGGESTIONS, payload: transformed.suggestions });
      } else {
        const responseText = result?.response || fallbackMessage;
        const suggestions = normalizeSuggestions(result?.suggested_actions, initialSuggestions);
        const messageData = {
          text: responseText,
          type: result?.handoff ? 'handoff' : 'assistant',
          handoff: result?.handoff || null,
          card: result?.card || null,
          bookingLink: result?.booking_link || null,
          availability: result?.availability || null,
          bookings: result?.bookings || null,
          streaming: false,
        };

        if (streamingId) {
          dispatch({
            type: AGENT_CHAT_ACTIONS.UPDATE_MESSAGE,
            payload: { id: streamingId, updates: messageData },
          });
        } else {
          dispatch({
            type: AGENT_CHAT_ACTIONS.APPEND_MESSAGE,
            payload: buildMessage('assistant', responseText, messageData),
          });
        }
        dispatch({ type: AGENT_CHAT_ACTIONS.SET_SUGGESTIONS, payload: suggestions });
      }
    } catch (error) {
      logger.warn(`${agentName} mobile message failed:`, error?.message || error);

      // Mark connection as unhealthy on error
      dispatch({ type: AGENT_CHAT_ACTIONS.SET_CONNECTED, payload: false });

      // Preserve partial streamed text on error instead of replacing with error message
      if (streamingId && streamingTextRef.current.trim()) {
        dispatch({
          type: AGENT_CHAT_ACTIONS.UPDATE_MESSAGE,
          payload: {
            id: streamingId,
            updates: { text: `${streamingTextRef.current} [response interrupted]`, streaming: false, type: 'assistant' },
          },
        });
      } else {
        const fallback = defaultFallback(agentName, initialSuggestions);

        const errorData = {
          text: fallbackMessage || fallback.response,
          type: 'error',
          streaming: false,
        };

        if (streamingId) {
          dispatch({
            type: AGENT_CHAT_ACTIONS.UPDATE_MESSAGE,
            payload: { id: streamingId, updates: errorData },
          });
        } else {
          dispatch({
            type: AGENT_CHAT_ACTIONS.APPEND_MESSAGE,
            payload: buildMessage('assistant', fallbackMessage || fallback.response, { type: 'error' }),
          });
        }
        dispatch({
          type: AGENT_CHAT_ACTIONS.SET_SUGGESTIONS,
          payload: fallback.suggested_actions.map((action) => action.prompt),
        });
      }

      // Clear booking state on error so stale state doesn't compound failures
      if (supportsBookingState) {
        dispatch({ type: AGENT_CHAT_ACTIONS.SET_BOOKING_STATE, payload: null });
      }

      dispatch({
        type: AGENT_CHAT_ACTIONS.SET_ERROR,
        payload: error?.response?.data?.message || error?.message || `${agentName} is temporarily unavailable right now. Please try again.`,
      });
    } finally {
      dispatch({ type: AGENT_CHAT_ACTIONS.SET_LOADING, payload: false });
    }
  }, [agentName, fallbackMessage, initialSuggestions, sendMessageApi, state.isLoading, state.messages, state.bookingState, supportsBookingState, supportsStreaming, transformResponse]);

  const sendCurrentMessage = useCallback(() => {
    sendMessage(state.input);
  }, [sendMessage, state.input]);

  const selectSuggestion = useCallback((suggestion) => {
    sendMessage(suggestion);
  }, [sendMessage]);

  const runHealthCheck = useCallback(async () => {
    if (!healthCheckApi) return;
    try {
      const healthy = await healthCheckApi();
      dispatch({ type: AGENT_CHAT_ACTIONS.SET_CONNECTED, payload: Boolean(healthy) });
    } catch {
      dispatch({ type: AGENT_CHAT_ACTIONS.SET_CONNECTED, payload: false });
    }
  }, [healthCheckApi]);

  return {
    ...state,
    dispatch,
    isRestoring,
    resetConversation,
    runHealthCheck,
    selectSuggestion,
    sendCurrentMessage,
    sendMessage,
    setInput,
  };
};

export default useAgentChat;
