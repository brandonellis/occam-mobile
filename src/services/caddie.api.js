import apiClient from './apiClient';

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
