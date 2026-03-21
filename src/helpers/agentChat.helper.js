/**
 * Shared utilities for agent chat hooks (Caddie + Marshal).
 */

export const buildMessage = (sender, text, extras = {}) => ({
  id: `${sender}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  sender,
  text,
  ...extras,
});

export const buildHistory = (messages) =>
  messages
    .filter((message) => ['assistant', 'user'].includes(message.sender) && typeof message.text === 'string')
    .map((message) => ({
      role: message.sender === 'user' ? 'user' : 'assistant',
      content: message.text,
    }));

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
