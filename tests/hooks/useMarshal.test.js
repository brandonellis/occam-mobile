import { act, renderHook, waitFor } from '@testing-library/react-native';
import useMarshal from '../../src/hooks/useMarshal';
import { confirmMarshalAction, getMarshalInsights, sendMarshalMessage } from '../../src/services/marshal.api';

jest.mock('../../src/services/marshal.api', () => ({
  sendMarshalMessage: jest.fn(),
  confirmMarshalAction: jest.fn(),
  getMarshalInsights: jest.fn(),
  saveMarshalConversation: jest.fn().mockResolvedValue({}),
  loadMarshalConversation: jest.fn().mockResolvedValue(null),
  checkMarshalHealth: jest.fn().mockResolvedValue(true),
}));

describe('useMarshal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getMarshalInsights.mockResolvedValue([]);
    confirmMarshalAction.mockResolvedValue({ success: true, message: 'Done' });
  });

  test('handleIncomingIntent sends the intent message and appends a handoff message when handoff is present', async () => {
    sendMarshalMessage.mockResolvedValue({
      response: 'Marshal reviewed the handoff.',
      pending_actions: [],
      suggested_actions: [],
      card: null,
    });

    const intent = {
      id: 'handoff-1',
      message: 'Client handoff from Caddie\nReason: billing_support\nClient request: I need a refund for my booking',
      handoff: {
        target: 'marshal',
        title: 'Marshal follow-up recommended',
        summary: 'This request needs facility-side billing support.',
        prompt: 'Client handoff from Caddie\nReason: billing_support\nClient request: I need a refund for my booking',
      },
    };

    const { result } = renderHook(() => useMarshal());

    // Wait for persistence restore to complete
    await waitFor(() => {
      expect(result.current.handleIncomingIntent).toBeDefined();
    });

    // Call handleIncomingIntent imperatively
    await act(async () => {
      result.current.handleIncomingIntent(intent);
    });

    await waitFor(() => {
      expect(sendMarshalMessage).toHaveBeenCalledWith(
        intent.message,
        expect.any(Array),
        expect.any(Object),
      );
    }, { timeout: 3000 });

    await waitFor(() => {
      expect(result.current.messages.some((message) => message.type === 'handoff')).toBe(true);
      expect(result.current.messages.some(
        (message) => message.sender === 'user' && message.text === intent.handoff.summary
      )).toBe(true);
    });
  });

  test('handleIncomingIntent sends a plain message when no handoff is present', async () => {
    sendMarshalMessage.mockResolvedValue({
      response: 'Here are today\'s bookings.',
      pending_actions: [],
      suggested_actions: [],
      card: null,
    });

    const intent = {
      message: 'Summarize today\'s bookings',
    };

    const { result } = renderHook(() => useMarshal());

    await waitFor(() => {
      expect(result.current.handleIncomingIntent).toBeDefined();
    });

    await act(async () => {
      result.current.handleIncomingIntent(intent);
    });

    await waitFor(() => {
      expect(sendMarshalMessage).toHaveBeenCalledWith(
        intent.message,
        expect.any(Array),
        expect.any(Object),
      );
    }, { timeout: 3000 });

    // No handoff message should be appended
    expect(result.current.messages.every((message) => message.type !== 'handoff')).toBe(true);
  });

  test('handleIncomingIntent does nothing when intent has no message', async () => {
    const { result } = renderHook(() => useMarshal());

    await waitFor(() => {
      expect(result.current.handleIncomingIntent).toBeDefined();
    });

    await act(async () => {
      result.current.handleIncomingIntent(null);
    });

    expect(sendMarshalMessage).not.toHaveBeenCalled();

    await act(async () => {
      result.current.handleIncomingIntent({ handoff: { title: 'no message' } });
    });

    expect(sendMarshalMessage).not.toHaveBeenCalled();
  });
});
