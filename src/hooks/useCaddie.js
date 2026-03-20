import useAgentChat from './useAgentChat';
import { sendCaddieMessage } from '../services/caddie.api';

const INITIAL_SUGGESTIONS = [
  'Find me a lesson this week',
  'Show my upcoming bookings',
  'What memberships do I have?',
];

const INITIAL_MESSAGES = [
  {
    id: 'caddie-welcome',
    sender: 'assistant',
    text: 'I\'m Caddie. I can help you book sessions, review upcoming bookings, and answer questions about memberships or packages.',
  },
];

const useCaddie = () => useAgentChat({
  agentName: 'Caddie',
  fallbackMessage: 'I\'m having trouble reaching the live booking assistant right now. Please try again in a moment, or ask about lessons, availability, your next booking, memberships, or packages.',
  initialMessages: INITIAL_MESSAGES,
  initialSuggestions: INITIAL_SUGGESTIONS,
  sendMessageApi: sendCaddieMessage,
  supportsBookingState: true,
});

export default useCaddie;
