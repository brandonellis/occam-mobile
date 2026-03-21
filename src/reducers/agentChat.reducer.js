export const AGENT_CHAT_ACTIONS = {
  APPEND_MESSAGE: 'APPEND_MESSAGE',
  RESET_MESSAGES: 'RESET_MESSAGES',
  SET_BOOKING_STATE: 'SET_BOOKING_STATE',
  SET_ERROR: 'SET_ERROR',
  SET_INPUT: 'SET_INPUT',
  SET_LOADING: 'SET_LOADING',
  SET_SUGGESTIONS: 'SET_SUGGESTIONS',
  UPDATE_MESSAGE: 'UPDATE_MESSAGE',
};

export const createInitialAgentChatState = ({ messages = [], suggestions = [] } = {}) => ({
  messages,
  suggestions,
  input: '',
  isLoading: false,
  error: null,
  bookingState: null,
});

export const agentChatReducer = (state, action) => {
  switch (action.type) {
    case AGENT_CHAT_ACTIONS.APPEND_MESSAGE:
      return {
        ...state,
        messages: [...state.messages, action.payload],
      };
    case AGENT_CHAT_ACTIONS.RESET_MESSAGES:
      return {
        ...state,
        messages: action.payload,
        error: null,
        bookingState: null,
      };
    case AGENT_CHAT_ACTIONS.SET_BOOKING_STATE:
      return {
        ...state,
        bookingState: action.payload,
      };
    case AGENT_CHAT_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
      };
    case AGENT_CHAT_ACTIONS.SET_INPUT:
      return {
        ...state,
        input: action.payload,
      };
    case AGENT_CHAT_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };
    case AGENT_CHAT_ACTIONS.SET_SUGGESTIONS:
      return {
        ...state,
        suggestions: action.payload,
      };
    case AGENT_CHAT_ACTIONS.UPDATE_MESSAGE:
      return {
        ...state,
        messages: state.messages.map((m) =>
          m.id === action.payload.id ? { ...m, ...action.payload.updates } : m
        ),
      };
    default:
      return state;
  }
};
