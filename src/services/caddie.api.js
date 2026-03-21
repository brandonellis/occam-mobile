import apiClient from './apiClient';
import { getToken, getTenantId } from '../helpers/storage.helper';
import { getTenantApiUrl } from '../config';
import { readSSEStream } from '../helpers/sse.helper';
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
    return await sendCaddieMessageStreaming(body, { onToken, onCard });
  } catch (streamError) {
    logger.warn('Caddie streaming failed, falling back to non-streaming:', streamError?.message);
  }

  // ── Fallback: non-streaming via apiClient (axios) ──
  const response = await apiClient.post('/caddie/chat', body);
  return response.data?.data || response.data;
};

/**
 * Internal: SSE streaming implementation for Caddie.
 */
const sendCaddieMessageStreaming = async (body, { onToken, onCard } = {}) => {
  const token = await getToken();
  if (!token) {
    throw new Error('Authentication token is required');
  }

  const tenantId = await getTenantId();
  const baseUrl = tenantId ? getTenantApiUrl(tenantId) : '';
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    Accept: 'text/event-stream',
    'X-Requested-With': 'XMLHttpRequest',
  };
  if (tenantId) {
    headers['X-Tenant'] = tenantId;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  let response;
  try {
    response = await fetch(`${baseUrl}/caddie/chat/stream`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (fetchError) {
    clearTimeout(timeoutId);
    if (fetchError?.name === 'AbortError') {
      throw new Error('Caddie took too long to respond. Please try again.');
    }
    throw fetchError;
  }

  if (!response.ok) {
    clearTimeout(timeoutId);
    const text = await response.text().catch(() => '');
    throw new Error(text || `Stream request failed: ${response.status}`);
  }

  try {
    const finalResult = await readSSEStream(response, {
      token: (data) => { if (data.text && onToken) onToken(data.text); },
      card: (data) => { if (data.card && onCard) onCard(data.card); },
    });

    return finalResult;
  } finally {
    clearTimeout(timeoutId);
  }
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
