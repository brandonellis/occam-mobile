import { useCallback, useReducer } from 'react';
import logger from '../helpers/logger.helper';
import { AGENT_CHAT_ACTIONS, agentChatReducer, createInitialAgentChatState } from '../reducers/agentChat.reducer';

const buildMessage = (sender, text, extras = {}) => ({
  id: `${sender}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  sender,
  text,
  ...extras,
});

const buildHistory = (messages) => messages.map((message) => ({
  role: message.sender === 'user' ? 'user' : 'assistant',
  content: message.text,
}));

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

  const sendMessage = useCallback(async (value, { slotContext } = {}) => {
    const trimmed = typeof value === 'string' ? value.trim() : '';

    if (!trimmed || state.isLoading) {
      return;
    }

    const userMessage = buildMessage('user', trimmed);
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
      const responseText = result?.response || fallbackMessage;
      const suggestions = Array.isArray(result?.suggested_actions)
        ? result.suggested_actions
            .map((action) => action?.prompt || action?.label)
            .filter(Boolean)
        : initialSuggestions;

      // Update booking state from response
      if (supportsBookingState && result?.booking_state !== undefined) {
        dispatch({ type: AGENT_CHAT_ACTIONS.SET_BOOKING_STATE, payload: result.booking_state });
      }

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
      dispatch({ type: AGENT_CHAT_ACTIONS.SET_SUGGESTIONS, payload: suggestions.slice(0, 3) });
    } catch (error) {
      logger.warn(`${agentName} mobile message failed:`, error?.message || error);
      const fallback = defaultFallback(agentName, initialSuggestions);

      dispatch({
        type: AGENT_CHAT_ACTIONS.APPEND_MESSAGE,
        payload: buildMessage('assistant', fallbackMessage || fallback.response),
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
  }, [agentName, fallbackMessage, initialSuggestions, sendMessageApi, state.isLoading, state.messages, state.bookingState, supportsBookingState]);

  const sendCurrentMessage = useCallback(() => {
    sendMessage(state.input);
  }, [sendMessage, state.input]);

  const selectSuggestion = useCallback((suggestion) => {
    sendMessage(suggestion);
  }, [sendMessage]);

  return {
    ...state,
    resetConversation,
    selectSuggestion,
    sendCurrentMessage,
    sendMessage,
    setInput,
  };
};

export default useAgentChat;
