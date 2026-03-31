import { buildMessage, normalizeSuggestions } from './agentChat.helper';

export const INITIAL_SUGGESTIONS = [
  'Summarize today\u2019s bookings',
  'What should I focus on next?',
  'How are we doing this month?',
];

export const INITIAL_MESSAGES = [
  {
    id: 'marshal-welcome',
    sender: 'assistant',
    text: 'What do you need? I can pull up today\u2019s schedule, flag priorities, or run an action.',
  },
];

export const INITIAL_INSIGHTS = [
  {
    id: 'today-summary',
    title: 'Today\u2019s Board',
    body: 'Ask Marshal for a quick summary of bookings, schedule gaps, and follow-ups before you start your day.',
    prompt: 'Summarize today\u2019s bookings',
  },
  {
    id: 'client-followups',
    title: 'Follow-Ups',
    body: 'Marshal can help identify clients who may need outreach, rebooking, or schedule recovery.',
    prompt: 'Which clients need follow-up this week?',
  },
  {
    id: 'capacity-check',
    title: 'Capacity View',
    body: 'Use Marshal to spot schedule pressure, under-booked windows, and coach availability opportunities.',
    prompt: 'What capacity issues should I watch this week?',
  },
];

// ── Natural language confirmation shortcuts ──

export const AFFIRMATIVE_REPLIES = ['yes', 'y', 'ok', 'okay', 'confirm', 'confirmed', 'do it', 'go ahead'];
export const NEGATIVE_REPLIES = ['no', 'n', 'cancel', 'stop', 'never mind'];

export const findPendingConfirmation = (messages) => {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.type === 'confirmation' && !msg.resolved && Array.isArray(msg.pendingActions) && msg.pendingActions.length > 0) {
      return { message: msg, index: i };
    }
  }
  return null;
};

// ── Helpers ──

/**
 * Build insight cards from the structured API response.
 * Falls back to the array format for backwards compatibility,
 * then to INITIAL_INSIGHTS as a last resort.
 */
export const normalizeInsights = (raw) => {
  // Handle structured object response (keyed by insight type)
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const data = raw.data || raw;
    const cards = [];

    const exp = data.expiring_memberships;
    if (exp && (exp.count ?? 0) > 0) {
      cards.push({
        id: 'expiring-memberships',
        title: 'Expiring Memberships',
        body: `${exp.count} membership${exp.count !== 1 ? 's' : ''} expiring in the next 30 days.`,
        prompt: 'Review expiring memberships and recommend follow-up actions.',
      });
    }

    const rev = data.revenue_trend;
    if (rev && !rev.unavailable) {
      const dir = (rev.change_pct ?? 0) >= 0 ? 'up' : 'down';
      cards.push({
        id: 'revenue-trend',
        title: 'Revenue Trend',
        body: `${rev.this_month_fmt ?? '$0'} this month (${dir} ${Math.abs(rev.change_pct ?? 0)}% vs last month).`,
        prompt: 'Analyze our revenue trend and recommend ways to improve.',
      });
    }

    const cap = data.capacity;
    if (cap) {
      cards.push({
        id: 'capacity',
        title: 'Weekly Capacity',
        body: `${cap.booked_hours ?? 0} hrs booked across ${cap.coach_count ?? 0} coach${(cap.coach_count ?? 0) !== 1 ? 'es' : ''} this week.`,
        prompt: 'What capacity issues should I watch this week?',
      });
    }

    const eng = data.client_engagement;
    if (eng && (eng.inactive_count ?? 0) > 0) {
      cards.push({
        id: 'client-engagement',
        title: 'Client Engagement',
        body: `${eng.inactive_count} of ${eng.total_clients ?? 0} clients inactive for 30+ days.`,
        prompt: 'Which inactive clients should I reach out to first?',
      });
    }

    const cd = data.caddie_demand;
    if (cd && !cd.unavailable && cd.has_signals) {
      cards.push({
        id: 'caddie-demand',
        title: 'Caddie Demand',
        body: `${cd.total_signals ?? 0} friction signal${(cd.total_signals ?? 0) !== 1 ? 's' : ''} in the last ${cd.period_days ?? 7} days.`,
        prompt: 'Analyze Caddie demand signals and recommend improvements.',
      });
    }

    const conv = data.conversions;
    if (conv && !conv.unavailable && conv.has_signals) {
      cards.push({
        id: 'conversions',
        title: 'Conversions',
        body: `${conv.total_signals ?? 0} conversion event${(conv.total_signals ?? 0) !== 1 ? 's' : ''} in the last ${conv.period_days ?? 7} days.`,
        prompt: 'Review conversion activity and highlight trends.',
      });
    }

    if (cards.length > 0) return cards.slice(0, 4);
  }

  // Handle legacy array format
  if (Array.isArray(raw) && raw.length > 0) {
    return raw.slice(0, 4).map((item, index) => ({
      id: item.id || item.action_id || `marshal-insight-${index}`,
      title: item.title || 'Insight',
      body: item.summary || item.description || 'Marshal surfaced a new operational recommendation.',
      prompt: item.prompt || item.title || INITIAL_SUGGESTIONS[0],
    }));
  }

  return INITIAL_INSIGHTS;
};

export const normalizeIntent = (intent) => {
  if (!intent) return null;
  if (typeof intent === 'string') return { message: intent };

  return {
    ...intent,
    message: intent.message || intent.prompt || intent.handoff?.prompt || '',
  };
};

/**
 * Marshal-specific response transformer for useAgentChat.
 * Handles pendingActions and card data that Caddie doesn't need.
 */
export const transformMarshalResponse = (result, initialSuggs) => {
  const responseText = result?.response || 'Marshal processed your request but did not return any text.';
  const pendingActions = Array.isArray(result?.pending_actions) ? result.pending_actions : [];
  const card = result?.card || null;
  const suggestions = normalizeSuggestions(result?.suggested_actions, initialSuggs);

  return {
    message: buildMessage('assistant', responseText, {
      type: pendingActions.length > 0 ? 'confirmation' : 'assistant',
      pendingActions,
      card,
    }),
    suggestions,
  };
};
