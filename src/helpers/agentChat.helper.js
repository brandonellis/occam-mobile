/**
 * Shared utilities for agent chat hooks (Caddie + Marshal).
 */

export const buildMessage = (sender, text, extras = {}) => ({
  id: `${sender}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  sender,
  text,
  ...extras,
});

/**
 * Build conversation history with structured metadata so the LLM understands
 * what the user experienced (cards shown, actions offered, actions tapped).
 */
export const buildHistory = (messages) =>
  messages
    .filter((message) => (['assistant', 'user'].includes(message.sender) || ['action_result', 'confirmation', 'error'].includes(message.type)) && typeof message.text === 'string')
    .map((message) => {
      let content = message.text;

      // Marshal-specific message types need system note annotations
      if (message.type === 'action_result') {
        const status = message.success ? 'executed and completed' : 'attempted but failed';
        content = `(System note: an action was ${status}. Result: ${message.text || 'no details'}. Do not re-propose it.)`;
      } else if (message.type === 'confirmation') {
        const actionDesc = message.pendingActions?.map((a) => a.description || a.tool).join(', ') || 'unknown';
        content = `(System note: a mutation was proposed: ${actionDesc}. The user either confirmed or declined it — check subsequent messages for the result.)`;
      } else if (message.type === 'error') {
        content = '(System note: the previous response encountered a connection error. Please retry the original request.)';
      }

      if (message.sender === 'assistant') {
        // Annotate what structured cards were rendered
        const cardAnnotations = [];
        if (message.bookings?.bookings?.length) cardAnnotations.push(`BOOKINGS_CARD (${message.bookings.bookings.length} bookings)`);
        if (message.availability?.slots?.length || message.availability?.days?.length) cardAnnotations.push('AVAILABILITY_CARD');
        if (message.bookingLink) cardAnnotations.push('BOOKING_LINK_CARD');
        if (message.handoff) cardAnnotations.push('HANDOFF_ALERT');
        if (message.classSessions?.sessions?.length) cardAnnotations.push(`CLASS_SESSIONS_CARD (${message.classSessions.sessions.length} sessions)`);
        if (message.card) cardAnnotations.push(`${message.card.type || 'data'} card`);
        if (cardAnnotations.length) {
          content += `\n[CARDS SHOWN: ${cardAnnotations.join(', ')}]`;
        }

        // Annotate suggested actions shown
        if (message.suggestedActions?.length) {
          const labels = message.suggestedActions.map((a) => a.label || a.prompt || a).filter(Boolean).join(', ');
          if (labels) content += `\n[SUGGESTED ACTIONS SHOWN: ${labels}]`;
        }

        // Annotate pending actions proposed
        if (message.pendingActions?.length && message.type !== 'confirmation') {
          content += `\n[PENDING ACTION PROPOSED: ${message.pendingActions.map((a) => a.description || a.tool).join(', ')}]`;
        }
      }

      // Track when the user tapped a suggested action vs. typed freely
      if (message.sender === 'user' && message.fromSuggestedAction) {
        content = `[User tapped suggested action] ${content}`;
      }

      return { role: message.sender === 'user' ? 'user' : 'assistant', content };
    });

export const normalizeSuggestions = (suggestedActions, fallback = []) => {
  if (!Array.isArray(suggestedActions) || suggestedActions.length === 0) {
    return fallback;
  }

  return suggestedActions
    .map((action) => action?.prompt || action?.label)
    .filter(Boolean)
    .slice(0, 3);
};

/**
 * Strip internal context blocks from assistant messages before display.
 * These blocks are useful for LLM context but should not be shown to users.
 */
export const stripContextBlocks = (text) => {
  if (!text || typeof text !== 'string') return text;
  return text
    .replace(/\n?\[AVAILABILITY CONTEXT:[\s\S]*?\]/g, '')
    .replace(/\n?\[BOOKING LINK CONTEXT:[\s\S]*?\]/g, '')
    .replace(/\n?\[CARDS SHOWN:[\s\S]*?\]/g, '')
    .replace(/\n?\[SUGGESTED ACTIONS SHOWN:[\s\S]*?\]/g, '')
    .replace(/\n?\[PENDING ACTION PROPOSED:[\s\S]*?\]/g, '')
    .replace(/^\[User tapped suggested action\] /gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

export const formatEligibilityLabel = (eligibility) => {
  if (!eligibility) return null;

  const remaining =
    eligibility.remaining !== undefined && eligibility.remaining !== null
      ? ` \u2022 ${eligibility.remaining} remaining`
      : '';

  if (eligibility.source === 'membership') return `Covered by membership${remaining}`;
  if (eligibility.source === 'package') return `${eligibility.package_name || 'Package booking'}${remaining}`;
  if (eligibility.source === 'one_off') return 'Payment required';

  return null;
};
