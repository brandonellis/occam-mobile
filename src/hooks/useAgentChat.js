import { useCallback, useReducer, useRef } from 'react';
import logger from '../helpers/logger.helper';
import { buildMessage, buildHistory, normalizeSuggestions } from '../helpers/agentChat.helper';
import { AGENT_CHAT_ACTIONS, agentChatReducer, createInitialAgentChatState } from '../reducers/agentChat.reducer';

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
}) => {
  const [state, dispatch] = useReducer(
    agentChatReducer,
    createInitialAgentChatState({
      messages: initialMessages,
      suggestions: initialSuggestions,
    })
  );

  const streamingTextRef = useRef('');

  const setInput = useCallback((value) => {
    dispatch({ type: AGENT_CHAT_ACTIONS.SET_INPUT, payload: value });
  }, []);

  const resetConversation = useCallback(() => {
    dispatch({ type: AGENT_CHAT_ACTIONS.RESET_MESSAGES, payload: initialMessages });
    dispatch({ type: AGENT_CHAT_ACTIONS.SET_SUGGESTIONS, payload: initialSuggestions });
    dispatch({ type: AGENT_CHAT_ACTIONS.SET_INPUT, payload: '' });
  }, [initialMessages, initialSuggestions]);

  const sendMessage = useCallback(async (value, { slotContext, displayText } = {}) => {
    const trimmed = typeof value === 'string' ? value.trim() : '';

    if (!trimmed || state.isLoading) {
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
      const fallback = defaultFallback(agentName, initialSuggestions);

      // Clear booking state on error so stale state doesn't compound failures
      if (supportsBookingState) {
        dispatch({ type: AGENT_CHAT_ACTIONS.SET_BOOKING_STATE, payload: null });
      }

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

  return {
    ...state,
    dispatch,
    resetConversation,
    selectSuggestion,
    sendCurrentMessage,
    sendMessage,
    setInput,
  };
};

export default useAgentChat;
