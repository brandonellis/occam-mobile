import apiClient from './apiClient';
import { getToken, getTenantId } from '../helpers/storage.helper';
import { getTenantApiUrl } from '../config';
import { streamSSE } from '../helpers/sse.helper';
import logger from '../helpers/logger.helper';

/**
 * Send a Marshal chat message, attempting SSE streaming first and falling
 * back to the non-streaming endpoint if streaming is unavailable.
 *
 * @param {string}   message  - User message
 * @param {Array}    history  - Conversation history [{role, content}]
 * @param {Object}   options  - Optional { onToken, onCard, pageContext }
 * @returns {Promise<Object>} Final response: { response, suggested_actions, pending_actions, card }
 */
export const sendMarshalMessage = async (message, history = [], { onToken, onCard, pageContext } = {}) => {
  const body = { message, history, ...(pageContext ? { page_context: pageContext } : {}) };

  // ── Attempt SSE streaming first ──
  try {
    return await sendMarshalMessageStreaming(body, { onToken, onCard });
  } catch (streamError) {
    logger.warn('Marshal streaming failed, falling back to non-streaming:', streamError?.message);
  }

  // ── Fallback: non-streaming via apiClient (axios) ──
  const response = await apiClient.post('/marshal/chat', body);
  const result = response.data?.data || response.data;

  return {
    response: result?.response || '',
    suggested_actions: result?.suggested_actions || [],
    pending_actions: result?.pending_actions || [],
    card: result?.card || null,
  };
};

/**
 * Internal: SSE streaming implementation using XMLHttpRequest (React Native compatible).
 */
const sendMarshalMessageStreaming = async (body, { onToken, onCard } = {}) => {
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

  const finalResult = await streamSSE(
    `${baseUrl}/marshal/chat/stream`,
    { headers, body: JSON.stringify(body), timeout: 60000 },
    {
      token: (data) => { if (data.text && onToken) onToken(data.text); },
      card: (data) => { if (data.card && onCard) onCard(data.card); },
    },
  );

  return {
    response: finalResult.response || '',
    suggested_actions: finalResult.suggested_actions || [],
    pending_actions: finalResult.pending_actions || [],
    card: finalResult.card || null,
  };
};

export const confirmMarshalAction = async (actionId) => {
  const response = await apiClient.post('/marshal/confirm', {
    action_id: actionId,
  });

  return response.data?.data || response.data;
};

export const getMarshalInsights = async () => {
  const response = await apiClient.get('/marshal/insights');

  return response.data?.data || response.data;
};

export const saveMarshalConversation = async (sessionId, messages) => {
  try {
    await apiClient.post('/marshal/conversations', {
      session_id: sessionId,
      messages,
    });
  } catch (error) {
    logger.warn('Marshal conversation save failed:', error?.message);
  }
};

export const loadMarshalConversation = async (sessionId) => {
  try {
    const response = await apiClient.get('/marshal/conversations/load', {
      params: { session_id: sessionId },
    });
    return response.data?.data || response.data;
  } catch (error) {
    logger.warn('Marshal conversation load failed:', error?.message);
    return null;
  }
};

export const checkMarshalHealth = async () => {
  try {
    await apiClient.get('/onboarding/health');
    return true;
  } catch {
    return false;
  }
};
