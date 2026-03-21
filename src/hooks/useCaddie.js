import { useCallback, useEffect, useState } from 'react';
import useAgentChat from './useAgentChat';
import { sendCaddieMessage, saveCaddieConversation, loadCaddieConversation, fetchCaddieContext, checkCaddieHealth } from '../services/caddie.api';
import { CADDIE_MESSAGES_KEY, CADDIE_SESSION_KEY, CADDIE_BOOKING_STATE_KEY, saveBookingState, loadBookingState, saveDismissedNudges, loadDismissedNudges } from '../helpers/chatPersistence.helper';
import { AGENT_CHAT_ACTIONS } from '../reducers/agentChat.reducer';
import logger from '../helpers/logger.helper';

const INITIAL_SUGGESTIONS = [
  'Find me a lesson this week',
  'Show my upcoming bookings',
  'What memberships do I have?',
];

const INITIAL_MESSAGES = [
  {
    id: 'caddie-welcome',
    sender: 'assistant',
    text: "I'm Caddie. I can help you book sessions, review upcoming bookings, and answer questions about memberships or packages.",
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
        const fetched = context?.nudges || [];
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
