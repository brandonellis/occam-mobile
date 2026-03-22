import { renderHook, act } from '@testing-library/react-native';
import useMarshalActions from '../../src/hooks/useMarshalActions';
import { confirmMarshalAction, sendClientEmail, discardClientEmail } from '../../src/services/marshal.api';

jest.mock('../../src/services/marshal.api', () => ({
  confirmMarshalAction: jest.fn(),
  sendClientEmail: jest.fn(),
  discardClientEmail: jest.fn(),
}));

jest.mock('../../src/helpers/logger.helper', () => ({
  warn: jest.fn(),
  log: jest.fn(),
}));

// Mock buildMessage to return predictable objects
jest.mock('../../src/helpers/agentChat.helper', () => ({
  buildMessage: jest.fn((sender, text, extras) => ({
    id: `msg-${Date.now()}`,
    sender,
    text,
    ...extras,
  })),
}));

const buildMockChat = (overrides = {}) => ({
  isLoading: false,
  messages: [],
  input: '',
  sendMessage: jest.fn(),
  ...overrides,
});

describe('useMarshalActions', () => {
  let mockDispatch;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDispatch = jest.fn();
  });

  // ── confirmAction ──

  describe('confirmAction', () => {
    test('calls confirmMarshalAction and dispatches success', async () => {
      confirmMarshalAction.mockResolvedValue({ success: true, message: 'Action completed' });

      const chat = buildMockChat({
        messages: [
          {
            id: 'conf-1',
            type: 'confirmation',
            resolved: false,
            pendingActions: [{ action_id: 'act-1', tool: 'send_email' }],
          },
        ],
      });

      const { result } = renderHook(() =>
        useMarshalActions({ chat, dispatch: mockDispatch, screenContext: null }),
      );

      await act(async () => {
        await result.current.confirmAction({ action_id: 'act-1', tool: 'send_email' });
      });

      expect(confirmMarshalAction).toHaveBeenCalledWith('act-1');
      // Should dispatch SET_LOADING true, SET_ERROR null, UPDATE_MESSAGE, APPEND_MESSAGE, SET_LOADING false
      const types = mockDispatch.mock.calls.map((c) => c[0].type);
      expect(types).toContain('SET_LOADING');
      expect(types).toContain('UPDATE_MESSAGE');
      expect(types).toContain('APPEND_MESSAGE');
    });

    test('does nothing when action has no tool', async () => {
      const chat = buildMockChat();
      const { result } = renderHook(() =>
        useMarshalActions({ chat, dispatch: mockDispatch, screenContext: null }),
      );

      await act(async () => {
        await result.current.confirmAction({ action_id: 'act-1' });
      });

      expect(confirmMarshalAction).not.toHaveBeenCalled();
    });

    test('does nothing when chat is loading', async () => {
      const chat = buildMockChat({ isLoading: true });
      const { result } = renderHook(() =>
        useMarshalActions({ chat, dispatch: mockDispatch, screenContext: null }),
      );

      await act(async () => {
        await result.current.confirmAction({ action_id: 'act-1', tool: 'send_email' });
      });

      expect(confirmMarshalAction).not.toHaveBeenCalled();
    });

    test('dispatches error message on API failure', async () => {
      confirmMarshalAction.mockRejectedValue(new Error('Network error'));

      const chat = buildMockChat();
      const { result } = renderHook(() =>
        useMarshalActions({ chat, dispatch: mockDispatch, screenContext: null }),
      );

      await act(async () => {
        await result.current.confirmAction({ action_id: 'act-1', tool: 'send_email' });
      });

      const errorDispatch = mockDispatch.mock.calls.find(
        (c) => c[0].type === 'SET_ERROR' && c[0].payload,
      );
      expect(errorDispatch).toBeTruthy();
    });
  });

  // ── declineAction ──

  describe('declineAction', () => {
    test('marks pending confirmation as resolved and appends cancellation message', () => {
      const chat = buildMockChat({
        messages: [
          {
            id: 'conf-1',
            type: 'confirmation',
            resolved: false,
            pendingActions: [{ action_id: 'act-1' }],
          },
        ],
      });

      const { result } = renderHook(() =>
        useMarshalActions({ chat, dispatch: mockDispatch, screenContext: null }),
      );

      act(() => {
        result.current.declineAction();
      });

      const updateCall = mockDispatch.mock.calls.find((c) => c[0].type === 'UPDATE_MESSAGE');
      expect(updateCall[0].payload.updates.resolved).toBe(true);
      expect(updateCall[0].payload.updates.pendingActions).toEqual([]);

      const appendCall = mockDispatch.mock.calls.find((c) => c[0].type === 'APPEND_MESSAGE');
      expect(appendCall[0].payload.text).toContain('cancelled');
    });
  });

  // ── handleSendEmail ──

  describe('handleSendEmail', () => {
    test('sends email and updates preview message status', async () => {
      sendClientEmail.mockResolvedValue({ message: 'Sent!', success: true });

      const chat = buildMockChat({
        messages: [
          { id: 'email-msg', emailPreview: { campaign_id: 'camp-1', status: 'draft' } },
        ],
      });

      const { result } = renderHook(() =>
        useMarshalActions({ chat, dispatch: mockDispatch, screenContext: null }),
      );

      await act(async () => {
        await result.current.handleSendEmail('camp-1');
      });

      expect(sendClientEmail).toHaveBeenCalledWith('camp-1');

      const updateCall = mockDispatch.mock.calls.find((c) => c[0].type === 'UPDATE_MESSAGE');
      expect(updateCall[0].payload.updates.emailPreview.status).toBe('sent');
    });

    test('does nothing when campaignId is falsy', async () => {
      const chat = buildMockChat();
      const { result } = renderHook(() =>
        useMarshalActions({ chat, dispatch: mockDispatch, screenContext: null }),
      );

      await act(async () => {
        await result.current.handleSendEmail(null);
      });

      expect(sendClientEmail).not.toHaveBeenCalled();
    });
  });

  // ── handleDiscardEmail ──

  describe('handleDiscardEmail', () => {
    test('discards email and updates preview message status', async () => {
      discardClientEmail.mockResolvedValue({});

      const chat = buildMockChat({
        messages: [
          { id: 'email-msg', emailPreview: { campaign_id: 'camp-1', status: 'draft' } },
        ],
      });

      const { result } = renderHook(() =>
        useMarshalActions({ chat, dispatch: mockDispatch, screenContext: null }),
      );

      await act(async () => {
        await result.current.handleDiscardEmail('camp-1');
      });

      expect(discardClientEmail).toHaveBeenCalledWith('camp-1');

      const updateCall = mockDispatch.mock.calls.find((c) => c[0].type === 'UPDATE_MESSAGE');
      expect(updateCall[0].payload.updates.emailPreview.status).toBe('discarded');
    });

    test('does nothing when campaignId is falsy', async () => {
      const chat = buildMockChat();
      const { result } = renderHook(() =>
        useMarshalActions({ chat, dispatch: mockDispatch, screenContext: null }),
      );

      await act(async () => {
        await result.current.handleDiscardEmail(null);
      });

      expect(discardClientEmail).not.toHaveBeenCalled();
    });
  });

  // ── sendMessage (natural language confirmation interception) ──

  describe('sendMessage', () => {
    test('intercepts affirmative reply to confirm pending action', async () => {
      confirmMarshalAction.mockResolvedValue({ success: true, message: 'Done' });

      const chat = buildMockChat({
        messages: [
          {
            id: 'conf-1',
            type: 'confirmation',
            resolved: false,
            pendingActions: [{ action_id: 'act-1', tool: 'do_thing' }],
          },
        ],
      });

      const { result } = renderHook(() =>
        useMarshalActions({ chat, dispatch: mockDispatch, screenContext: null }),
      );

      await act(async () => {
        await result.current.sendMessage('yes');
      });

      expect(confirmMarshalAction).toHaveBeenCalledWith('act-1');
      // Should NOT call chat.sendMessage (intercepted)
      expect(chat.sendMessage).not.toHaveBeenCalled();
    });

    test('intercepts negative reply to decline pending action', async () => {
      const chat = buildMockChat({
        messages: [
          {
            id: 'conf-1',
            type: 'confirmation',
            resolved: false,
            pendingActions: [{ action_id: 'act-1', tool: 'do_thing' }],
          },
        ],
      });

      const { result } = renderHook(() =>
        useMarshalActions({ chat, dispatch: mockDispatch, screenContext: null }),
      );

      await act(async () => {
        await result.current.sendMessage('no');
      });

      // Should decline, not call API
      expect(confirmMarshalAction).not.toHaveBeenCalled();
      expect(chat.sendMessage).not.toHaveBeenCalled();
    });

    test('passes through normal messages to chat.sendMessage', async () => {
      const chat = buildMockChat();
      const { result } = renderHook(() =>
        useMarshalActions({ chat, dispatch: mockDispatch, screenContext: null }),
      );

      await act(async () => {
        await result.current.sendMessage('Summarize bookings');
      });

      expect(chat.sendMessage).toHaveBeenCalledWith('Summarize bookings', {});
    });

    test('adds screenContext as pageContext to options', async () => {
      const chat = buildMockChat();
      const { result } = renderHook(() =>
        useMarshalActions({ chat, dispatch: mockDispatch, screenContext: { screen: 'MarshalScreen' } }),
      );

      await act(async () => {
        await result.current.sendMessage('Hello');
      });

      expect(chat.sendMessage).toHaveBeenCalledWith('Hello', {
        pageContext: { screen: 'MarshalScreen' },
      });
    });

    test('does nothing for empty/whitespace messages', async () => {
      const chat = buildMockChat();
      const { result } = renderHook(() =>
        useMarshalActions({ chat, dispatch: mockDispatch, screenContext: null }),
      );

      await act(async () => {
        await result.current.sendMessage('   ');
      });

      expect(chat.sendMessage).not.toHaveBeenCalled();
    });

    test('does not intercept when multiple pending actions exist', async () => {
      const chat = buildMockChat({
        messages: [
          {
            id: 'conf-1',
            type: 'confirmation',
            resolved: false,
            pendingActions: [
              { action_id: 'act-1', tool: 'a' },
              { action_id: 'act-2', tool: 'b' },
            ],
          },
        ],
      });

      const { result } = renderHook(() =>
        useMarshalActions({ chat, dispatch: mockDispatch, screenContext: null }),
      );

      await act(async () => {
        await result.current.sendMessage('yes');
      });

      // Should pass through to chat.sendMessage, not intercept
      expect(confirmMarshalAction).not.toHaveBeenCalled();
      expect(chat.sendMessage).toHaveBeenCalled();
    });
  });

  // ── selectSuggestion / sendCurrentMessage ──

  describe('selectSuggestion', () => {
    test('sends the suggestion as a message', async () => {
      const chat = buildMockChat();
      const { result } = renderHook(() =>
        useMarshalActions({ chat, dispatch: mockDispatch, screenContext: null }),
      );

      await act(async () => {
        await result.current.selectSuggestion('Summarize today\u2019s bookings');
      });

      expect(chat.sendMessage).toHaveBeenCalledWith('Summarize today\u2019s bookings', expect.any(Object));
    });
  });

  describe('sendCurrentMessage', () => {
    test('sends the current input value', async () => {
      const chat = buildMockChat({ input: 'What is the schedule?' });
      const { result } = renderHook(() =>
        useMarshalActions({ chat, dispatch: mockDispatch, screenContext: null }),
      );

      await act(async () => {
        await result.current.sendCurrentMessage();
      });

      expect(chat.sendMessage).toHaveBeenCalledWith('What is the schedule?', expect.any(Object));
    });
  });
});
