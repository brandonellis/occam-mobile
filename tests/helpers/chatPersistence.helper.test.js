import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  saveMessages,
  loadMessages,
  saveSessionId,
  loadSessionId,
  saveBookingState,
  loadBookingState,
  saveDismissedNudges,
  loadDismissedNudges,
  clearPersistence,
  normalizePersistedMessages,
  messagesToServerFormat,
  generateSessionId,
  CADDIE_MESSAGES_KEY,
  CADDIE_SESSION_KEY,
  CADDIE_BOOKING_STATE_KEY,
  CADDIE_DISMISSED_NUDGES_KEY,
  MARSHAL_MESSAGES_KEY,
  MARSHAL_SESSION_KEY,
} from '../../src/helpers/chatPersistence.helper';

describe('storage keys', () => {
  test('exports expected storage keys', () => {
    expect(CADDIE_MESSAGES_KEY).toBe('occam_caddie_messages');
    expect(CADDIE_SESSION_KEY).toBe('occam_caddie_session_id');
    expect(CADDIE_BOOKING_STATE_KEY).toBe('occam_caddie_booking_state');
    expect(CADDIE_DISMISSED_NUDGES_KEY).toBe('occam_caddie_dismissed_nudges');
    expect(MARSHAL_MESSAGES_KEY).toBe('occam_marshal_messages');
    expect(MARSHAL_SESSION_KEY).toBe('occam_marshal_session_id');
  });
});

describe('saveMessages', () => {
  beforeEach(() => jest.clearAllMocks());

  test('saves messages to AsyncStorage as JSON', async () => {
    const messages = [{ id: '1', sender: 'user', text: 'Hello' }];
    await saveMessages('test_key', messages);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('test_key', JSON.stringify(messages));
  });

  test('filters out streaming messages', async () => {
    const messages = [
      { id: '1', sender: 'user', text: 'Hello' },
      { id: '2', sender: 'assistant', text: '', streaming: true },
    ];
    await saveMessages('test_key', messages);
    const saved = JSON.parse(AsyncStorage.setItem.mock.calls[0][1]);
    expect(saved).toHaveLength(1);
    expect(saved[0].id).toBe('1');
  });

  test('limits to 50 messages (most recent)', async () => {
    const messages = Array.from({ length: 60 }, (_, i) => ({
      id: `msg-${i}`, sender: 'user', text: `Message ${i}`,
    }));
    await saveMessages('test_key', messages);
    const saved = JSON.parse(AsyncStorage.setItem.mock.calls[0][1]);
    expect(saved).toHaveLength(50);
    expect(saved[0].id).toBe('msg-10');
  });

  test('handles null messages gracefully', async () => {
    await saveMessages('test_key', null);
    const saved = JSON.parse(AsyncStorage.setItem.mock.calls[0][1]);
    expect(saved).toEqual([]);
  });

  test('swallows storage errors', async () => {
    AsyncStorage.setItem.mockRejectedValueOnce(new Error('Storage full'));
    await expect(saveMessages('key', [])).resolves.not.toThrow();
  });
});

describe('loadMessages', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns parsed messages from storage', async () => {
    const messages = [{ id: '1', sender: 'user', text: 'Hi' }];
    AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(messages));
    const result = await loadMessages('test_key');
    expect(result).toEqual(messages);
  });

  test('returns null when storage is empty', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce(null);
    expect(await loadMessages('test_key')).toBeNull();
  });

  test('returns null for non-array JSON', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify({ not: 'array' }));
    expect(await loadMessages('test_key')).toBeNull();
  });

  test('returns null and clears corrupted data', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce('not valid json{{{');
    const result = await loadMessages('test_key');
    expect(result).toBeNull();
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('test_key');
  });
});

describe('saveSessionId / loadSessionId', () => {
  beforeEach(() => jest.clearAllMocks());

  test('saves session id string', async () => {
    await saveSessionId('sess_key', 'abc-123');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('sess_key', 'abc-123');
  });

  test('loads session id', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce('abc-123');
    expect(await loadSessionId('sess_key')).toBe('abc-123');
  });

  test('returns null on error', async () => {
    AsyncStorage.getItem.mockRejectedValueOnce(new Error('fail'));
    expect(await loadSessionId('sess_key')).toBeNull();
  });
});

describe('saveBookingState / loadBookingState', () => {
  beforeEach(() => jest.clearAllMocks());

  test('saves booking state as JSON', async () => {
    const state = { step: 2, service_id: 5 };
    await saveBookingState(state);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      CADDIE_BOOKING_STATE_KEY,
      JSON.stringify(state)
    );
  });

  test('removes key when state is null', async () => {
    await saveBookingState(null);
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith(CADDIE_BOOKING_STATE_KEY);
  });

  test('loads booking state', async () => {
    const state = { step: 3 };
    AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(state));
    expect(await loadBookingState()).toEqual(state);
  });

  test('returns null when not stored', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce(null);
    expect(await loadBookingState()).toBeNull();
  });
});

describe('saveDismissedNudges / loadDismissedNudges', () => {
  beforeEach(() => jest.clearAllMocks());

  test('saves dismissed nudge ids', async () => {
    await saveDismissedNudges(['nudge-1', 'nudge-2']);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      CADDIE_DISMISSED_NUDGES_KEY,
      JSON.stringify(['nudge-1', 'nudge-2'])
    );
  });

  test('loads dismissed nudge ids', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(['n1']));
    expect(await loadDismissedNudges()).toEqual(['n1']);
  });

  test('returns empty array when not stored', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce(null);
    expect(await loadDismissedNudges()).toEqual([]);
  });

  test('returns empty array on error', async () => {
    AsyncStorage.getItem.mockRejectedValueOnce(new Error('fail'));
    expect(await loadDismissedNudges()).toEqual([]);
  });
});

describe('clearPersistence', () => {
  beforeEach(() => jest.clearAllMocks());

  test('removes multiple keys at once', async () => {
    await clearPersistence('key1', 'key2', 'key3');
    expect(AsyncStorage.multiRemove).toHaveBeenCalledWith(['key1', 'key2', 'key3']);
  });

  test('handles errors gracefully', async () => {
    AsyncStorage.multiRemove.mockRejectedValueOnce(new Error('fail'));
    await expect(clearPersistence('key1')).resolves.not.toThrow();
  });
});

describe('normalizePersistedMessages', () => {
  test('returns empty array for non-array input', () => {
    expect(normalizePersistedMessages(null)).toEqual([]);
    expect(normalizePersistedMessages('string')).toEqual([]);
    expect(normalizePersistedMessages(undefined)).toEqual([]);
  });

  test('assigns ids to messages without them', () => {
    const messages = [{ sender: 'user', text: 'No id' }];
    const result = normalizePersistedMessages(messages);
    expect(result[0].id).toBe('restored-0');
  });

  test('preserves existing ids', () => {
    const messages = [{ id: 'keep-me', sender: 'user', text: 'Has id' }];
    const result = normalizePersistedMessages(messages);
    expect(result[0].id).toBe('keep-me');
  });

  test('maps server format (role/content) to mobile format (sender/text)', () => {
    const messages = [{ role: 'user', content: 'Server format' }];
    const result = normalizePersistedMessages(messages);
    expect(result[0].sender).toBe('user');
    expect(result[0].text).toBe('Server format');
  });

  test('maps assistant role correctly', () => {
    const messages = [{ role: 'assistant', content: 'Bot reply' }];
    const result = normalizePersistedMessages(messages);
    expect(result[0].sender).toBe('assistant');
  });

  test('recovers stale streaming message with text', () => {
    const messages = [{ id: 's1', sender: 'assistant', text: 'Partial response', streaming: true }];
    const result = normalizePersistedMessages(messages);
    expect(result[0].streaming).toBe(false);
    expect(result[0].text).toBe('Partial response');
    expect(result[0].type).toBe('assistant');
  });

  test('recovers stale streaming message without text as error', () => {
    const messages = [{ id: 's1', sender: 'assistant', text: '', streaming: true }];
    const result = normalizePersistedMessages(messages);
    expect(result[0].streaming).toBe(false);
    expect(result[0].type).toBe('error');
    expect(result[0].text).toBe('This message was interrupted. Please try again.');
  });

  test('limits to 50 messages', () => {
    const messages = Array.from({ length: 60 }, (_, i) => ({
      id: `msg-${i}`, sender: 'user', text: `${i}`,
    }));
    expect(normalizePersistedMessages(messages)).toHaveLength(50);
  });
});

describe('generateSessionId', () => {
  test('returns a UUID string', () => {
    const id = generateSessionId();
    expect(typeof id).toBe('string');
    // Uses mocked expo-crypto which returns '00000000-...'
    expect(id).toBe('00000000-0000-0000-0000-000000000000');
  });
});

describe('messagesToServerFormat', () => {
  test('maps mobile messages to server format', () => {
    const messages = [
      { id: '1', sender: 'user', text: 'Hello' },
      { id: '2', sender: 'assistant', text: 'Hi' },
    ];
    const result = messagesToServerFormat(messages);
    expect(result).toEqual([
      { role: 'user', content: 'Hello', type: 'user' },
      { role: 'assistant', content: 'Hi', type: 'assistant' },
    ]);
  });

  test('filters out streaming messages', () => {
    const messages = [
      { id: '1', sender: 'user', text: 'Hello' },
      { id: '2', sender: 'assistant', text: '', streaming: true },
    ];
    expect(messagesToServerFormat(messages)).toHaveLength(1);
  });

  test('filters out non-user/assistant senders', () => {
    const messages = [
      { id: '1', sender: 'system', text: 'System' },
      { id: '2', sender: 'user', text: 'User' },
    ];
    expect(messagesToServerFormat(messages)).toHaveLength(1);
  });

  test('preserves message type', () => {
    const messages = [
      { id: '1', sender: 'assistant', text: 'Confirm?', type: 'confirmation' },
    ];
    expect(messagesToServerFormat(messages)[0].type).toBe('confirmation');
  });

  test('handles null input', () => {
    expect(messagesToServerFormat(null)).toEqual([]);
  });

  test('limits to 50 messages', () => {
    const messages = Array.from({ length: 60 }, (_, i) => ({
      id: `${i}`, sender: 'user', text: `${i}`,
    }));
    expect(messagesToServerFormat(messages)).toHaveLength(50);
  });
});
