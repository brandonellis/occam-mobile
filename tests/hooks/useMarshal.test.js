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

  test('consumes an initial Marshal handoff intent once and sends the prepared prompt', async () => {
    sendMarshalMessage.mockResolvedValue({
      response: 'Marshal reviewed the handoff.',
      pending_actions: [],
      suggested_actions: [],
      card: null,
    });

    const onIntentConsumed = jest.fn();
    const initialIntent = {
      id: 'handoff-1',
      message: 'Client handoff from Caddie\nReason: billing_support\nClient request: I need a refund for my booking',
      handoff: {
        target: 'marshal',
        title: 'Marshal follow-up recommended',
        summary: 'This request needs facility-side billing support.',
        prompt: 'Client handoff from Caddie\nReason: billing_support\nClient request: I need a refund for my booking',
      },
    };

    // Wait for AsyncStorage restoration to complete before rendering with intent
    await act(async () => {
      // Flush async storage mocks
    });

    const { result } = renderHook(() => useMarshal({ initialIntent, onIntentConsumed }));

    // Wait for persistence restore to finish (async), then intent effect fires
    await waitFor(() => {
      expect(sendMarshalMessage).toHaveBeenCalledWith(
        initialIntent.message,
        expect.any(Array),
        expect.any(Object),
      );
    }, { timeout: 3000 });

    await waitFor(() => {
      expect(onIntentConsumed).toHaveBeenCalledTimes(1);
      expect(result.current.messages.some((message) => message.type === 'handoff')).toBe(true);
      expect(result.current.messages.some((message) => message.sender === 'user' && message.text === initialIntent.handoff.summary)).toBe(true);
    });
  });
});
