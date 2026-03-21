import apiClient from './apiClient';
import logger from '../helpers/logger.helper';

export const sendCaddieMessage = async (message, history = [], { bookingState, slotContext } = {}) => {
  const body = { message, history };

  if (bookingState) {
    body.booking_state = bookingState;
  }
  if (slotContext) {
    body.slot_context = slotContext;
  }

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
