import {
  agentChatReducer,
  createInitialAgentChatState,
  AGENT_CHAT_ACTIONS,
} from '../../src/reducers/agentChat.reducer';

describe('createInitialAgentChatState', () => {
  test('returns default state with no arguments', () => {
    const state = createInitialAgentChatState();
    expect(state).toEqual({
      messages: [],
      suggestions: [],
      input: '',
      isLoading: false,
      isConnected: null,
      error: null,
      bookingState: null,
      sessionId: null,
    });
  });

  test('accepts initial messages and suggestions', () => {
    const messages = [{ id: 'w', sender: 'assistant', text: 'Hi' }];
    const suggestions = ['What next?'];
    const state = createInitialAgentChatState({ messages, suggestions });
    expect(state.messages).toBe(messages);
    expect(state.suggestions).toBe(suggestions);
  });
});

describe('agentChatReducer', () => {
  const initial = createInitialAgentChatState({
    messages: [{ id: 'welcome', sender: 'assistant', text: 'Hello' }],
    suggestions: ['Suggestion 1'],
  });

  test('APPEND_MESSAGE adds a message', () => {
    const msg = { id: 'u1', sender: 'user', text: 'Hi' };
    const next = agentChatReducer(initial, {
      type: AGENT_CHAT_ACTIONS.APPEND_MESSAGE,
      payload: msg,
    });
    expect(next.messages).toHaveLength(2);
    expect(next.messages[1]).toBe(msg);
  });

  test('APPEND_MESSAGE enforces max messages limit', () => {
    const messages = Array.from({ length: 40 }, (_, i) => ({
      id: `msg-${i}`,
      sender: 'user',
      text: `Message ${i}`,
    }));
    const state = { ...initial, messages };
    const next = agentChatReducer(state, {
      type: AGENT_CHAT_ACTIONS.APPEND_MESSAGE,
      payload: { id: 'overflow', sender: 'user', text: 'Overflow' },
    });
    // MAX_CHAT_MESSAGES is 38
    expect(next.messages).toHaveLength(38);
    expect(next.messages[next.messages.length - 1].id).toBe('overflow');
  });

  test('RESET_MESSAGES replaces messages and clears error + bookingState', () => {
    const state = { ...initial, error: 'something', bookingState: { step: 1 } };
    const newMessages = [{ id: 'new', sender: 'assistant', text: 'Reset' }];
    const next = agentChatReducer(state, {
      type: AGENT_CHAT_ACTIONS.RESET_MESSAGES,
      payload: newMessages,
    });
    expect(next.messages).toBe(newMessages);
    expect(next.error).toBeNull();
    expect(next.bookingState).toBeNull();
  });

  test('SET_BOOKING_STATE updates bookingState', () => {
    const bs = { step: 2, service_id: 5 };
    const next = agentChatReducer(initial, {
      type: AGENT_CHAT_ACTIONS.SET_BOOKING_STATE,
      payload: bs,
    });
    expect(next.bookingState).toBe(bs);
  });

  test('SET_CONNECTED updates isConnected', () => {
    const next = agentChatReducer(initial, {
      type: AGENT_CHAT_ACTIONS.SET_CONNECTED,
      payload: true,
    });
    expect(next.isConnected).toBe(true);
  });

  test('SET_ERROR updates error', () => {
    const next = agentChatReducer(initial, {
      type: AGENT_CHAT_ACTIONS.SET_ERROR,
      payload: 'Network error',
    });
    expect(next.error).toBe('Network error');
  });

  test('SET_INPUT updates input', () => {
    const next = agentChatReducer(initial, {
      type: AGENT_CHAT_ACTIONS.SET_INPUT,
      payload: 'Hello world',
    });
    expect(next.input).toBe('Hello world');
  });

  test('SET_LOADING updates isLoading', () => {
    const next = agentChatReducer(initial, {
      type: AGENT_CHAT_ACTIONS.SET_LOADING,
      payload: true,
    });
    expect(next.isLoading).toBe(true);
  });

  test('SET_MESSAGES replaces messages entirely', () => {
    const newMsgs = [{ id: 'a', sender: 'user', text: 'A' }];
    const next = agentChatReducer(initial, {
      type: AGENT_CHAT_ACTIONS.SET_MESSAGES,
      payload: newMsgs,
    });
    expect(next.messages).toBe(newMsgs);
  });

  test('SET_SESSION_ID updates sessionId', () => {
    const next = agentChatReducer(initial, {
      type: AGENT_CHAT_ACTIONS.SET_SESSION_ID,
      payload: 'sess-123',
    });
    expect(next.sessionId).toBe('sess-123');
  });

  test('SET_SUGGESTIONS updates suggestions', () => {
    const next = agentChatReducer(initial, {
      type: AGENT_CHAT_ACTIONS.SET_SUGGESTIONS,
      payload: ['New suggestion'],
    });
    expect(next.suggestions).toEqual(['New suggestion']);
  });

  test('UPDATE_MESSAGE updates only the matching message', () => {
    const state = {
      ...initial,
      messages: [
        { id: 'a', sender: 'assistant', text: 'Old', streaming: true },
        { id: 'b', sender: 'user', text: 'User' },
      ],
    };
    const next = agentChatReducer(state, {
      type: AGENT_CHAT_ACTIONS.UPDATE_MESSAGE,
      payload: { id: 'a', updates: { text: 'Updated', streaming: false } },
    });
    expect(next.messages[0].text).toBe('Updated');
    expect(next.messages[0].streaming).toBe(false);
    expect(next.messages[1]).toBe(state.messages[1]);
  });

  test('UPDATE_MESSAGE does not modify state when no matching id', () => {
    const next = agentChatReducer(initial, {
      type: AGENT_CHAT_ACTIONS.UPDATE_MESSAGE,
      payload: { id: 'nonexistent', updates: { text: 'X' } },
    });
    expect(next.messages).toEqual(initial.messages);
  });

  test('unknown action returns state unchanged', () => {
    const next = agentChatReducer(initial, { type: 'UNKNOWN_ACTION' });
    expect(next).toBe(initial);
  });
});
