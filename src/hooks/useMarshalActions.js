import { useCallback } from 'react';
import logger from '../helpers/logger.helper';
import { buildMessage } from '../helpers/agentChat.helper';
import { AGENT_CHAT_ACTIONS } from '../reducers/agentChat.reducer';
import { confirmMarshalAction, discardClientEmail, sendClientEmail } from '../services/marshal.api';
import { findPendingConfirmation, AFFIRMATIVE_REPLIES, NEGATIVE_REPLIES } from '../helpers/marshal.helpers';

const useMarshalActions = ({ chat, dispatch, screenContext }) => {
  // ── Marshal-specific: action confirmation ──

  const confirmAction = useCallback(async (action) => {
    if (!action?.tool || chat.isLoading) return;

    dispatch({ type: AGENT_CHAT_ACTIONS.SET_LOADING, payload: true });
    dispatch({ type: AGENT_CHAT_ACTIONS.SET_ERROR, payload: null });

    try {
      const result = await confirmMarshalAction(action.action_id);

      // Mark the confirmation message as resolved
      const pending = findPendingConfirmation(chat.messages);
      if (pending) {
        const remainingActions = pending.message.pendingActions.filter((a) => a.action_id !== action.action_id);
        dispatch({
          type: AGENT_CHAT_ACTIONS.UPDATE_MESSAGE,
          payload: {
            id: pending.message.id,
            updates: {
              pendingActions: remainingActions,
              resolved: remainingActions.length === 0,
            },
          },
        });
      }

      dispatch({
        type: AGENT_CHAT_ACTIONS.APPEND_MESSAGE,
        payload: buildMessage('assistant', result?.message || 'Marshal completed that action.', {
          type: result?.email_preview ? 'email_preview' : 'action_result',
          success: Boolean(result?.success),
          nextStep: result?.next_step || null,
          emailPreview: result?.email_preview || null,
        }),
      });
    } catch (error) {
      logger.warn('Marshal mobile confirm failed:', error?.message || error);
      dispatch({
        type: AGENT_CHAT_ACTIONS.APPEND_MESSAGE,
        payload: buildMessage('assistant', error?.response?.data?.message || error?.message || 'Marshal could not complete that action.', {
          type: 'action_result',
          success: false,
          nextStep: null,
        }),
      });
      dispatch({
        type: AGENT_CHAT_ACTIONS.SET_ERROR,
        payload: error?.response?.data?.message || error?.message || 'Marshal could not complete that action.',
      });
    } finally {
      dispatch({ type: AGENT_CHAT_ACTIONS.SET_LOADING, payload: false });
    }
  }, [chat.isLoading, chat.messages, dispatch]);

  const declineAction = useCallback(() => {
    // Mark the confirmation message as resolved
    const pending = findPendingConfirmation(chat.messages);
    if (pending) {
      dispatch({
        type: AGENT_CHAT_ACTIONS.UPDATE_MESSAGE,
        payload: {
          id: pending.message.id,
          updates: { pendingActions: [], resolved: true },
        },
      });
    }

    dispatch({
      type: AGENT_CHAT_ACTIONS.APPEND_MESSAGE,
      payload: buildMessage('assistant', 'No problem \u2014 the action was cancelled. What would you like to do next?'),
    });
  }, [chat.messages, dispatch]);

  // ── Email send/discard from preview card ──

  const handleSendEmail = useCallback(async (campaignId) => {
    if (!campaignId) return;
    dispatch({ type: AGENT_CHAT_ACTIONS.SET_LOADING, payload: true });

    try {
      const result = await sendClientEmail(campaignId);

      // Update the email preview message to show sent status
      const previewMsg = chat.messages.find((m) => m.emailPreview?.campaign_id === campaignId);
      if (previewMsg) {
        dispatch({
          type: AGENT_CHAT_ACTIONS.UPDATE_MESSAGE,
          payload: {
            id: previewMsg.id,
            updates: {
              emailPreview: { ...previewMsg.emailPreview, status: 'sent' },
            },
          },
        });
      }

      dispatch({
        type: AGENT_CHAT_ACTIONS.APPEND_MESSAGE,
        payload: buildMessage('assistant', result?.message || 'Email sent successfully.', {
          type: 'action_result',
          success: true,
          nextStep: result?.next_step || null,
        }),
      });
    } catch (error) {
      logger.warn('Marshal email send failed:', error?.message || error);
      dispatch({
        type: AGENT_CHAT_ACTIONS.APPEND_MESSAGE,
        payload: buildMessage('assistant', error?.response?.data?.message || error?.message || 'Failed to send email.', {
          type: 'action_result',
          success: false,
        }),
      });
    } finally {
      dispatch({ type: AGENT_CHAT_ACTIONS.SET_LOADING, payload: false });
    }
  }, [chat.messages, dispatch]);

  const handleDiscardEmail = useCallback(async (campaignId) => {
    if (!campaignId) return;

    try {
      await discardClientEmail(campaignId);
    } catch (error) {
      logger.warn('Marshal email discard failed:', error?.message || error);
    }

    // Update the email preview message to show discarded
    const previewMsg = chat.messages.find((m) => m.emailPreview?.campaign_id === campaignId);
    if (previewMsg) {
      dispatch({
        type: AGENT_CHAT_ACTIONS.UPDATE_MESSAGE,
        payload: {
          id: previewMsg.id,
          updates: {
            emailPreview: { ...previewMsg.emailPreview, status: 'discarded' },
            type: 'action_result',
            success: false,
          },
        },
      });
    }

    dispatch({
      type: AGENT_CHAT_ACTIONS.APPEND_MESSAGE,
      payload: buildMessage('assistant', 'Email draft discarded. Would you like me to draft a different message?'),
    });
  }, [chat.messages, dispatch]);

  // ── Natural language confirmation interception ──

  const sendMessage = useCallback(async (value, options = {}) => {
    const trimmed = typeof value === 'string' ? value.trim() : '';
    if (!trimmed) return;

    const pending = findPendingConfirmation(chat.messages);
    if (pending && pending.message.pendingActions.length === 1) {
      const normalized = trimmed.toLowerCase().replace(/[.!?]+$/g, '');

      if (AFFIRMATIVE_REPLIES.includes(normalized)) {
        dispatch({
          type: AGENT_CHAT_ACTIONS.APPEND_MESSAGE,
          payload: buildMessage('user', trimmed),
        });
        dispatch({ type: AGENT_CHAT_ACTIONS.SET_INPUT, payload: '' });
        await confirmAction(pending.message.pendingActions[0]);
        return;
      }

      if (NEGATIVE_REPLIES.includes(normalized)) {
        dispatch({
          type: AGENT_CHAT_ACTIONS.APPEND_MESSAGE,
          payload: buildMessage('user', trimmed),
        });
        dispatch({ type: AGENT_CHAT_ACTIONS.SET_INPUT, payload: '' });
        declineAction();
        return;
      }
    }

    // Pass screen context through to the API
    const enhancedOptions = screenContext
      ? { ...options, pageContext: screenContext }
      : options;

    await chat.sendMessage(value, enhancedOptions);
  }, [chat.messages, chat.sendMessage, confirmAction, declineAction, dispatch, screenContext]);

  const selectSuggestion = useCallback((suggestion) => {
    sendMessage(suggestion);
  }, [sendMessage]);

  const sendCurrentMessage = useCallback(() => {
    sendMessage(chat.input);
  }, [sendMessage, chat.input]);

  return {
    confirmAction,
    declineAction,
    handleSendEmail,
    handleDiscardEmail,
    sendMessage,
    selectSuggestion,
    sendCurrentMessage,
  };
};

export default useMarshalActions;
