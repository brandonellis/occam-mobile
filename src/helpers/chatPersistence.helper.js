import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from './logger.helper';

// ── Storage keys ──

export const CADDIE_MESSAGES_KEY = 'occam_caddie_messages';
export const CADDIE_SESSION_KEY = 'occam_caddie_session_id';
export const CADDIE_BOOKING_STATE_KEY = 'occam_caddie_booking_state';
export const CADDIE_DISMISSED_NUDGES_KEY = 'occam_caddie_dismissed_nudges';

export const MARSHAL_MESSAGES_KEY = 'occam_marshal_messages';
export const MARSHAL_SESSION_KEY = 'occam_marshal_session_id';

// ── Limits ──

const MAX_PERSISTED_MESSAGES = 50;
const MAX_CHAT_MESSAGES = 38;
export { MAX_CHAT_MESSAGES };

const SERVER_SAVE_DEBOUNCE_MS = 3000;
export { SERVER_SAVE_DEBOUNCE_MS };

// ── Message persistence ──

export const saveMessages = async (storageKey, messages) => {
  try {
    const filtered = (messages || [])
      .filter((m) => !m.streaming)
      .slice(-MAX_PERSISTED_MESSAGES);
    await AsyncStorage.setItem(storageKey, JSON.stringify(filtered));
  } catch (error) {
    logger.warn('Chat persistence: failed to save messages', error?.message);
  }
};

export const loadMessages = async (storageKey) => {
  try {
    const raw = await AsyncStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch (error) {
    logger.warn('Chat persistence: failed to load messages', error?.message);
    return null;
  }
};

// ── Session ID persistence ──

export const saveSessionId = async (storageKey, sessionId) => {
  try {
    await AsyncStorage.setItem(storageKey, sessionId);
  } catch (error) {
    logger.warn('Chat persistence: failed to save session ID', error?.message);
  }
};

export const loadSessionId = async (storageKey) => {
  try {
    return await AsyncStorage.getItem(storageKey);
  } catch (error) {
    logger.warn('Chat persistence: failed to load session ID', error?.message);
    return null;
  }
};

// ── Booking state persistence ──

export const saveBookingState = async (bookingState) => {
  try {
    if (bookingState) {
      await AsyncStorage.setItem(CADDIE_BOOKING_STATE_KEY, JSON.stringify(bookingState));
    } else {
      await AsyncStorage.removeItem(CADDIE_BOOKING_STATE_KEY);
    }
  } catch (error) {
    logger.warn('Chat persistence: failed to save booking state', error?.message);
  }
};

export const loadBookingState = async () => {
  try {
    const raw = await AsyncStorage.getItem(CADDIE_BOOKING_STATE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    logger.warn('Chat persistence: failed to load booking state', error?.message);
    return null;
  }
};

// ── Dismissed nudges ──

export const saveDismissedNudges = async (dismissedIds) => {
  try {
    await AsyncStorage.setItem(CADDIE_DISMISSED_NUDGES_KEY, JSON.stringify(dismissedIds));
  } catch (error) {
    logger.warn('Chat persistence: failed to save dismissed nudges', error?.message);
  }
};

export const loadDismissedNudges = async () => {
  try {
    const raw = await AsyncStorage.getItem(CADDIE_DISMISSED_NUDGES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    logger.warn('Chat persistence: failed to load dismissed nudges', error?.message);
    return [];
  }
};

// ── Bulk clear ──

export const clearPersistence = async (...keys) => {
  try {
    await AsyncStorage.multiRemove(keys);
  } catch (error) {
    logger.warn('Chat persistence: failed to clear storage', error?.message);
  }
};

// ── Message normalization ──

const STALE_MESSAGE = 'This message was interrupted. Please try again.';

/**
 * Normalize messages restored from AsyncStorage or the server.
 * Ensures every message has an id, sender, and text field.
 * Recovers stale streaming messages that were persisted mid-stream.
 */
export const normalizePersistedMessages = (messages) => {
  if (!Array.isArray(messages)) return [];

  return messages.slice(-MAX_PERSISTED_MESSAGES).map((msg, index) => {
    const normalized = { ...msg };

    // Ensure id exists
    if (!normalized.id) {
      normalized.id = `restored-${index}`;
    }

    // Map server format (role/content) to mobile format (sender/text)
    if (normalized.role && !normalized.sender) {
      normalized.sender = normalized.role === 'user' ? 'user' : 'assistant';
    }
    if (normalized.content && !normalized.text) {
      normalized.text = normalized.content;
    }

    // Recover stale streaming messages
    if (normalized.streaming) {
      const hasText = typeof normalized.text === 'string' && normalized.text.trim().length > 0;
      return {
        ...normalized,
        type: hasText ? (normalized.type || 'assistant') : 'error',
        text: hasText ? normalized.text : STALE_MESSAGE,
        streaming: false,
      };
    }

    return normalized;
  });
};

// ── UUID generator ──

export const generateSessionId = () => {
  const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  return `${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
};

// ── Server save helpers ──

/**
 * Map mobile messages to the server format for conversation persistence.
 * Server expects: [{ role: 'user'|'assistant', content: string, ... }]
 */
export const messagesToServerFormat = (messages) =>
  (messages || [])
    .filter((m) => !m.streaming && ['user', 'assistant'].includes(m.sender))
    .slice(-MAX_PERSISTED_MESSAGES)
    .map((m) => ({
      role: m.sender === 'user' ? 'user' : 'assistant',
      content: m.text || '',
      type: m.type || m.sender,
    }));
