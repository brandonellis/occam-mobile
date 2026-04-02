import { useCallback, useEffect, useState } from 'react';
import useAgentChat from './useAgentChat';
import { sendCaddieMessage, saveCaddieConversation, loadCaddieConversation, fetchCaddieContext, checkCaddieHealth } from '../services/caddie.api';
import { CADDIE_MESSAGES_KEY, CADDIE_SESSION_KEY, CADDIE_BOOKING_STATE_KEY, saveBookingState, loadBookingState, saveDismissedNudges, loadDismissedNudges } from '../helpers/chatPersistence.helper';
import { AGENT_CHAT_ACTIONS } from '../reducers/agentChat.reducer';
import logger from '../helpers/logger.helper';

const INITIAL_SUGGESTIONS = [
  'What services do you offer?',
  'Show my upcoming bookings',
  'What memberships do I have?',
];

const NUDGE_TITLES = {
  upcoming_booking: 'Upcoming Session',
  package_low: 'Package Running Low',
  membership_exhausted: 'Sessions Used Up',
};

const NUDGE_PROMPTS = {
  upcoming_booking: 'Show my upcoming bookings',
  package_low: 'What packages do I have?',
  membership_exhausted: 'What memberships do I have?',
};

/** Map backend nudge format ({ type, message, data }) to frontend format ({ id, title, body, prompt }). */
const normalizeNudge = (raw, index) => ({
  id: raw.id || `${raw.type || 'nudge'}-${index}`,
  title: raw.title || NUDGE_TITLES[raw.type] || 'Tip',
  body: raw.body || raw.description || raw.message || '',
  prompt: raw.prompt || NUDGE_PROMPTS[raw.type] || raw.message || '',
  type: raw.type,
});

const INITIAL_MESSAGES = [
  {
    id: 'caddie-welcome',
    sender: 'assistant',
    text: "What are you looking for today — a lesson, booking details, or membership info?",
  },
];

const useCaddie = () => {
  const chat = useAgentChat({
    agentName: 'Caddie',
    fallbackMessage: "I'm having trouble reaching the live booking assistant right now. Please try again in a moment, or ask about lessons, availability, your next booking, memberships, or packages.",
    initialMessages: INITIAL_MESSAGES,
    initialSuggestions: INITIAL_SUGGESTIONS,
    sendMessageApi: sendCaddieMessage,
    supportsBookingState: true,
    supportsStreaming: true,
    // Persistence
    messagesStorageKey: CADDIE_MESSAGES_KEY,
    sessionStorageKey: CADDIE_SESSION_KEY,
    saveConversationApi: saveCaddieConversation,
    loadConversationApi: loadCaddieConversation,
    // Connection status
    healthCheckApi: checkCaddieHealth,
  });

  const { dispatch } = chat;

  // ── Booking state persistence ──

  useEffect(() => {
    loadBookingState().then((restored) => {
      if (restored) {
        dispatch({ type: AGENT_CHAT_ACTIONS.SET_BOOKING_STATE, payload: restored });
      }
    }).catch((err) => {
      logger.warn('Caddie booking state restore failed:', String(err?.message || 'Unknown error').substring(0, 100));
    });
  }, [dispatch]);

  useEffect(() => {
    saveBookingState(chat.bookingState);
  }, [chat.bookingState]);

  // ── Nudges ──

  const [nudges, setNudges] = useState([]);
  const [dismissedNudgeIds, setDismissedNudgeIds] = useState([]);

  useEffect(() => {
    const loadNudges = async () => {
      try {
        const dismissed = await loadDismissedNudges();
        setDismissedNudgeIds(dismissed);

        const context = await fetchCaddieContext();
        const fetched = (context?.nudges || []).map(normalizeNudge);
        if (fetched.length > 0) {
          setNudges(fetched.filter((n) => !dismissed.includes(n.id)));
        }
      } catch (error) {
        logger.warn('Caddie nudges load failed:', error?.message);
      }
    };

    loadNudges();
  }, []);

  const dismissNudge = useCallback((nudgeId) => {
    setNudges((prev) => prev.filter((n) => n.id !== nudgeId));
    setDismissedNudgeIds((prev) => {
      const updated = [...prev, nudgeId];
      saveDismissedNudges(updated);
      return updated;
    });
  }, []);

  // ── Clear chat override to also clear booking state + nudge dismissals ──

  const resetConversation = useCallback(async () => {
    await chat.resetConversation();
    saveBookingState(null);
  }, [chat.resetConversation]);

  return {
    ...chat,
    resetConversation,
    nudges,
    dismissNudge,
  };
};

export default useCaddie;
