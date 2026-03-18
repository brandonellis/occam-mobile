import { useCallback, useReducer } from 'react';
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
  transformResponse,
}) => {
  const [state, dispatch] = useReducer(
    agentChatReducer,
    createInitialAgentChatState({
      messages: initialMessages,
      suggestions: initialSuggestions,
    })
  );

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

      const result = await sendMessageApi(trimmed, history, apiOptions);

      // Update booking state from response
      if (supportsBookingState && result?.booking_state !== undefined) {
        dispatch({ type: AGENT_CHAT_ACTIONS.SET_BOOKING_STATE, payload: result.booking_state });
      }

      // Allow consumers to customize how the response becomes a message + suggestions
      if (transformResponse) {
        const transformed = transformResponse(result, initialSuggestions);
        dispatch({ type: AGENT_CHAT_ACTIONS.APPEND_MESSAGE, payload: transformed.message });
        dispatch({ type: AGENT_CHAT_ACTIONS.SET_SUGGESTIONS, payload: transformed.suggestions });
      } else {
        const responseText = result?.response || fallbackMessage;
        const suggestions = normalizeSuggestions(result?.suggested_actions, initialSuggestions);

        dispatch({
          type: AGENT_CHAT_ACTIONS.APPEND_MESSAGE,
          payload: buildMessage('assistant', responseText, {
            type: result?.handoff ? 'handoff' : 'assistant',
            handoff: result?.handoff || null,
            card: result?.card || null,
            bookingLink: result?.booking_link || null,
            availability: result?.availability || null,
          }),
        });
        dispatch({ type: AGENT_CHAT_ACTIONS.SET_SUGGESTIONS, payload: suggestions });
      }
    } catch (error) {
      logger.warn(`${agentName} mobile message failed:`, error?.message || error);
      const fallback = defaultFallback(agentName, initialSuggestions);

      // Clear booking state on error so stale state doesn't compound failures
      if (supportsBookingState) {
        dispatch({ type: AGENT_CHAT_ACTIONS.SET_BOOKING_STATE, payload: null });
      }

      dispatch({
        type: AGENT_CHAT_ACTIONS.APPEND_MESSAGE,
        payload: buildMessage('assistant', fallbackMessage || fallback.response, { type: 'error' }),
      });
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
  }, [agentName, fallbackMessage, initialSuggestions, sendMessageApi, state.isLoading, state.messages, state.bookingState, supportsBookingState, transformResponse]);

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
