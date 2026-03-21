import { act, renderHook, waitFor } from '@testing-library/react-native';
import useAgentChat from '../../src/hooks/useAgentChat';

const INITIAL_MESSAGES = [{ id: 'welcome', sender: 'assistant', text: 'Welcome' }];
const INITIAL_SUGGESTIONS = ['Suggest 1', 'Suggest 2'];

const defaultProps = {
  agentName: 'TestAgent',
  initialMessages: INITIAL_MESSAGES,
  initialSuggestions: INITIAL_SUGGESTIONS,
  sendMessageApi: jest.fn(),
  fallbackMessage: 'TestAgent is unavailable.',
};

describe('useAgentChat', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    defaultProps.sendMessageApi.mockResolvedValue({
      response: 'Agent reply',
      suggested_actions: [{ prompt: 'Next action' }],
    });
  });

  // ── Initialization ──

  test('initializes with initial messages and suggestions', () => {
    const { result } = renderHook(() => useAgentChat(defaultProps));
    expect(result.current.messages).toEqual(INITIAL_MESSAGES);
    expect(result.current.suggestions).toEqual(INITIAL_SUGGESTIONS);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.input).toBe('');
  });

  test('isRestoring is false when no persistence key', () => {
    const { result } = renderHook(() => useAgentChat(defaultProps));
    expect(result.current.isRestoring).toBe(false);
  });

  // ── setInput ──

  test('setInput updates input value', () => {
    const { result } = renderHook(() => useAgentChat(defaultProps));
    act(() => result.current.setInput('Hello'));
    expect(result.current.input).toBe('Hello');
  });

  // ── sendMessage ──

  test('sendMessage appends user message, calls API, and appends response', async () => {
    const { result } = renderHook(() => useAgentChat(defaultProps));

    await act(async () => {
      await result.current.sendMessage('Hello');
    });

    expect(defaultProps.sendMessageApi).toHaveBeenCalledWith(
      'Hello',
      expect.any(Array),
      expect.any(Object),
    );

    // Should have welcome + user + assistant messages
    expect(result.current.messages).toHaveLength(3);
    expect(result.current.messages[1].sender).toBe('user');
    expect(result.current.messages[1].text).toBe('Hello');
    expect(result.current.messages[2].sender).toBe('assistant');
    expect(result.current.messages[2].text).toBe('Agent reply');
  });

  test('sendMessage ignores empty strings', async () => {
    const { result } = renderHook(() => useAgentChat(defaultProps));

    await act(async () => {
      await result.current.sendMessage('');
      await result.current.sendMessage('   ');
    });

    expect(defaultProps.sendMessageApi).not.toHaveBeenCalled();
    expect(result.current.messages).toHaveLength(1); // only welcome
  });

  test('sendMessage uses displayText for user-visible message', async () => {
    const { result } = renderHook(() => useAgentChat(defaultProps));

    await act(async () => {
      await result.current.sendMessage('raw message', { displayText: 'Pretty message' });
    });

    expect(result.current.messages[1].text).toBe('Pretty message');
    // API should receive the raw trimmed message
    expect(defaultProps.sendMessageApi).toHaveBeenCalledWith(
      'raw message',
      expect.any(Array),
      expect.any(Object),
    );
  });

  test('sendMessage shows fallback on API error', async () => {
    defaultProps.sendMessageApi.mockRejectedValueOnce(new Error('Network fail'));

    const { result } = renderHook(() => useAgentChat(defaultProps));

    await act(async () => {
      await result.current.sendMessage('Hello');
    });

    expect(result.current.error).toBe('Network fail');
    expect(result.current.isConnected).toBe(false);
    // Should have welcome + user + error fallback
    expect(result.current.messages).toHaveLength(3);
    expect(result.current.messages[2].text).toBe('TestAgent is unavailable.');
  });

  test('sendMessage marks connection as healthy on success', async () => {
    const { result } = renderHook(() => useAgentChat(defaultProps));

    await act(async () => {
      await result.current.sendMessage('Hello');
    });

    expect(result.current.isConnected).toBe(true);
  });

  test('sendMessage clears input after sending', async () => {
    const { result } = renderHook(() => useAgentChat(defaultProps));

    act(() => result.current.setInput('Hello'));
    expect(result.current.input).toBe('Hello');

    await act(async () => {
      await result.current.sendMessage('Hello');
    });

    expect(result.current.input).toBe('');
  });

  test('sendMessage passes pageContext to API options', async () => {
    const { result } = renderHook(() => useAgentChat(defaultProps));

    await act(async () => {
      await result.current.sendMessage('Hello', { pageContext: { screen: 'dashboard' } });
    });

    expect(defaultProps.sendMessageApi).toHaveBeenCalledWith(
      'Hello',
      expect.any(Array),
      expect.objectContaining({ pageContext: { screen: 'dashboard' } }),
    );
  });

  test('sendMessage with freshStart uses initial messages for history', async () => {
    const { result } = renderHook(() => useAgentChat(defaultProps));

    // Send a regular message first to build up history
    await act(async () => {
      await result.current.sendMessage('First message');
    });

    // Now send with freshStart
    await act(async () => {
      await result.current.sendMessage('Fresh message', { freshStart: true });
    });

    // The second API call should have a fresh history (only initial welcome + user)
    const secondCall = defaultProps.sendMessageApi.mock.calls[1];
    const history = secondCall[1];
    // Fresh history should NOT contain the "First message" exchange
    expect(history.length).toBeLessThanOrEqual(2); // welcome (assistant) + fresh message (user)
  });

  // ── sendCurrentMessage / selectSuggestion ──

  test('sendCurrentMessage sends current input value', async () => {
    const { result } = renderHook(() => useAgentChat(defaultProps));

    act(() => result.current.setInput('From input'));

    await act(async () => {
      await result.current.sendCurrentMessage();
    });

    expect(defaultProps.sendMessageApi).toHaveBeenCalledWith(
      'From input',
      expect.any(Array),
      expect.any(Object),
    );
  });

  test('selectSuggestion sends the suggestion text', async () => {
    const { result } = renderHook(() => useAgentChat(defaultProps));

    await act(async () => {
      await result.current.selectSuggestion('Suggest 1');
    });

    expect(defaultProps.sendMessageApi).toHaveBeenCalledWith(
      'Suggest 1',
      expect.any(Array),
      expect.any(Object),
    );
  });

  // ── resetConversation ──

  test('resetConversation restores initial state', async () => {
    const { result } = renderHook(() => useAgentChat(defaultProps));

    // Add a message first
    await act(async () => {
      await result.current.sendMessage('Hello');
    });

    expect(result.current.messages.length).toBeGreaterThan(1);

    await act(async () => {
      await result.current.resetConversation();
    });

    expect(result.current.messages).toEqual(INITIAL_MESSAGES);
    expect(result.current.suggestions).toEqual(INITIAL_SUGGESTIONS);
    expect(result.current.input).toBe('');
    expect(result.current.error).toBeNull();
  });

  // ── runHealthCheck ──

  test('runHealthCheck sets connected to true when healthy', async () => {
    const healthCheckApi = jest.fn().mockResolvedValue(true);
    const { result } = renderHook(() => useAgentChat({ ...defaultProps, healthCheckApi }));

    await act(async () => {
      await result.current.runHealthCheck();
    });

    expect(result.current.isConnected).toBe(true);
  });

  test('runHealthCheck sets connected to false when unhealthy', async () => {
    const healthCheckApi = jest.fn().mockResolvedValue(false);
    const { result } = renderHook(() => useAgentChat({ ...defaultProps, healthCheckApi }));

    await act(async () => {
      await result.current.runHealthCheck();
    });

    expect(result.current.isConnected).toBe(false);
  });

  test('runHealthCheck sets connected to false on error', async () => {
    const healthCheckApi = jest.fn().mockRejectedValue(new Error('fail'));
    const { result } = renderHook(() => useAgentChat({ ...defaultProps, healthCheckApi }));

    await act(async () => {
      await result.current.runHealthCheck();
    });

    expect(result.current.isConnected).toBe(false);
  });

  test('runHealthCheck does nothing when no healthCheckApi', async () => {
    const { result } = renderHook(() => useAgentChat(defaultProps));
    // Should not throw
    await act(async () => {
      await result.current.runHealthCheck();
    });
    expect(result.current.isConnected).toBeNull();
  });

  // ── transformResponse ──

  test('uses transformResponse when provided', async () => {
    const transformResponse = jest.fn((result, fallbackSuggestions) => ({
      message: { id: 'custom', sender: 'assistant', text: 'Transformed', type: 'assistant' },
      suggestions: ['Custom suggestion'],
    }));

    const { result } = renderHook(() => useAgentChat({ ...defaultProps, transformResponse }));

    await act(async () => {
      await result.current.sendMessage('Hello');
    });

    expect(transformResponse).toHaveBeenCalled();
    expect(result.current.messages[2].text).toBe('Transformed');
    expect(result.current.suggestions).toEqual(['Custom suggestion']);
  });

  // ── bookingState ──

  test('passes bookingState to API when supportsBookingState is true', async () => {
    const { result } = renderHook(() => useAgentChat({
      ...defaultProps,
      supportsBookingState: true,
    }));

    await act(async () => {
      await result.current.sendMessage('Hello', { slotContext: { date: '2025-01-01' } });
    });

    expect(defaultProps.sendMessageApi).toHaveBeenCalledWith(
      'Hello',
      expect.any(Array),
      expect.objectContaining({ slotContext: { date: '2025-01-01' } }),
    );
  });

  test('clears bookingState on API error when supportsBookingState', async () => {
    defaultProps.sendMessageApi.mockRejectedValueOnce(new Error('fail'));

    const { result } = renderHook(() => useAgentChat({
      ...defaultProps,
      supportsBookingState: true,
    }));

    await act(async () => {
      await result.current.sendMessage('Hello');
    });

    expect(result.current.bookingState).toBeNull();
  });

  // ── Streaming placeholder ──

  test('creates streaming placeholder when supportsStreaming is true', async () => {
    // Make the API call take a moment so we can observe the streaming state
    let resolveApi;
    defaultProps.sendMessageApi.mockImplementation(() => new Promise((r) => { resolveApi = r; }));

    const { result } = renderHook(() => useAgentChat({
      ...defaultProps,
      supportsStreaming: true,
    }));

    // Start sending (don't await)
    let sendPromise;
    act(() => {
      sendPromise = result.current.sendMessage('Hello');
    });

    // While loading, there should be a streaming placeholder
    await waitFor(() => {
      const streamingMsg = result.current.messages.find((m) => m.streaming);
      expect(streamingMsg).toBeDefined();
      expect(streamingMsg.text).toBe('');
    });

    // Resolve the API call
    await act(async () => {
      resolveApi({ response: 'Streamed reply', suggested_actions: [] });
      await sendPromise;
    });

    // Streaming message should be updated
    expect(result.current.messages.every((m) => !m.streaming)).toBe(true);
  });

  // ── Persistence restore with dedup ──

  test('deduplicates initial messages on persistence restore', async () => {
    const loadMessages = require('../../src/helpers/chatPersistence.helper').loadMessages;
    const AsyncStorage = require('@react-native-async-storage/async-storage');

    // Simulate stored messages that include the welcome message
    AsyncStorage.getItem.mockImplementation((key) => {
      if (key === 'test_messages') {
        return Promise.resolve(JSON.stringify([
          { id: 'welcome', sender: 'assistant', text: 'Welcome' },
          { id: 'msg-1', sender: 'user', text: 'Stored message' },
        ]));
      }
      return Promise.resolve(null);
    });

    const { result } = renderHook(() => useAgentChat({
      ...defaultProps,
      messagesStorageKey: 'test_messages',
      sessionStorageKey: 'test_session',
    }));

    await waitFor(() => {
      expect(result.current.isRestoring).toBe(false);
    });

    // Should have: welcome (from initial) + stored user message (deduped welcome)
    const welcomeMessages = result.current.messages.filter((m) => m.id === 'welcome');
    expect(welcomeMessages).toHaveLength(1);
  });
});
