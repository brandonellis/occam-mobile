import apiClient from './apiClient';
import { sendStreamingRequest } from '../helpers/streaming.helper';
import logger from '../helpers/logger.helper';

/**
 * Send a Caddie chat message, attempting SSE streaming first and falling
 * back to the non-streaming endpoint if streaming is unavailable.
 *
 * @param {string}   message  - User message
 * @param {Array}    history  - Conversation history [{role, content}]
 * @param {Object}   options  - Optional { bookingState, slotContext, onToken, onCard }
 * @returns {Promise<Object>} Final response
 */
export const sendCaddieMessage = async (message, history = [], { bookingState, slotContext, onToken, onCard } = {}) => {
  const body = { message, history };

  if (bookingState) {
    body.booking_state = bookingState;
  }
  if (slotContext) {
    body.slot_context = slotContext;
  }

  // ── Attempt SSE streaming first ──
  try {
    return await sendStreamingRequest('/caddie/chat/stream', body, {
      token: (data) => { if (data.text && onToken) onToken(data.text); },
      card: (data) => { if (data.card && onCard) onCard(data.card); },
    });
  } catch (streamError) {
    // Only fall back for network/streaming errors, not auth or server errors
    if (streamError?.message?.includes('401') || streamError?.message?.includes('403')) {
      throw streamError;
    }
    logger.warn('Caddie streaming failed, falling back to non-streaming:', streamError?.message);
  }

  // ── Fallback: non-streaming via apiClient (axios) ──
  const response = await apiClient.post('/caddie/chat', body);
  return response.data?.data || response.data;
};

export const saveCaddieConversation = async (sessionId, messages) => {
  try {
    await apiClient.post('/caddie/conversations', {
      session_id: sessionId,
      messages,
    });
  } catch (error) {
    logger.warn('Caddie conversation save failed:', error?.message);
  }
};

export const loadCaddieConversation = async (sessionId) => {
  try {
    const response = await apiClient.get('/caddie/conversations/load', {
      params: { session_id: sessionId },
    });
    return response.data?.data || response.data;
  } catch (error) {
    logger.warn('Caddie conversation load failed:', error?.message);
    return null;
  }
};

export const fetchCaddieContext = async () => {
  try {
    const response = await apiClient.get('/caddie/context');
    return response.data?.data || response.data;
  } catch (error) {
    logger.warn('Caddie context fetch failed:', error?.message);
    return { nudges: [] };
  }
};

export const checkCaddieHealth = async () => {
  try {
    await apiClient.get('/onboarding/health');
    return true;
  } catch {
    return false;
  }
};

export const submitCaddieFeedback = async (sessionId, { rating, reason, comment, messageIndex }) => {
  try {
    await apiClient.post('/caddie/feedback', {
      session_id: sessionId,
      rating,
      reason: reason || null,
      comment: comment || null,
      message_index: messageIndex ?? null,
    });
  } catch (err) {
    logger.warn('Caddie feedback submit failed:', err?.message);
  }
};
