import {
  INITIAL_SUGGESTIONS,
  INITIAL_MESSAGES,
  INITIAL_INSIGHTS,
  AFFIRMATIVE_REPLIES,
  NEGATIVE_REPLIES,
  findPendingConfirmation,
  normalizeInsights,
  normalizeIntent,
  transformMarshalResponse,
} from '../../src/helpers/marshal.helpers';

jest.mock('../../src/helpers/agentChat.helper', () => ({
  buildMessage: jest.fn((sender, text, extras) => ({ id: 'msg-1', sender, text, ...extras })),
  normalizeSuggestions: jest.fn((actions, fallback) => actions || fallback),
}));

describe('marshal.helpers', () => {
  // ── findPendingConfirmation ──

  describe('findPendingConfirmation', () => {
    test('returns null for empty messages', () => {
      expect(findPendingConfirmation([])).toBeNull();
    });

    test('returns null when no pending confirmations exist', () => {
      const messages = [
        { type: 'assistant', text: 'Hello' },
        { type: 'confirmation', resolved: true, pendingActions: [] },
      ];
      expect(findPendingConfirmation(messages)).toBeNull();
    });

    test('finds the most recent unresolved confirmation', () => {
      const messages = [
        { id: 'old', type: 'confirmation', resolved: false, pendingActions: [{ action_id: 'a1' }] },
        { id: 'msg', type: 'assistant', text: 'other' },
        { id: 'recent', type: 'confirmation', resolved: false, pendingActions: [{ action_id: 'a2' }] },
      ];
      const result = findPendingConfirmation(messages);
      expect(result.message.id).toBe('recent');
      expect(result.index).toBe(2);
    });

    test('skips resolved confirmations', () => {
      const messages = [
        { id: 'unresolved', type: 'confirmation', resolved: false, pendingActions: [{ action_id: 'a1' }] },
        { id: 'resolved', type: 'confirmation', resolved: true, pendingActions: [{ action_id: 'a2' }] },
      ];
      const result = findPendingConfirmation(messages);
      expect(result.message.id).toBe('unresolved');
    });

    test('skips confirmations with empty pendingActions', () => {
      const messages = [
        { id: 'valid', type: 'confirmation', resolved: false, pendingActions: [{ action_id: 'a1' }] },
        { id: 'empty', type: 'confirmation', resolved: false, pendingActions: [] },
      ];
      const result = findPendingConfirmation(messages);
      expect(result.message.id).toBe('valid');
    });
  });

  // ── normalizeInsights ──

  describe('normalizeInsights', () => {
    test('returns INITIAL_INSIGHTS for null/undefined', () => {
      expect(normalizeInsights(null)).toEqual(INITIAL_INSIGHTS);
      expect(normalizeInsights(undefined)).toEqual(INITIAL_INSIGHTS);
    });

    test('returns INITIAL_INSIGHTS for empty array', () => {
      expect(normalizeInsights([])).toEqual(INITIAL_INSIGHTS);
    });

    test('normalizes structured object response with expiring memberships', () => {
      const raw = {
        expiring_memberships: { count: 3 },
      };
      const result = normalizeInsights(raw);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('expiring-memberships');
      expect(result[0].body).toContain('3 memberships');
    });

    test('normalizes structured response with revenue trend up', () => {
      const raw = {
        revenue_trend: { this_month_fmt: '$5,000', change_pct: 12 },
      };
      const result = normalizeInsights(raw);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('revenue-trend');
      expect(result[0].body).toContain('$5,000');
      expect(result[0].body).toContain('up 12%');
    });

    test('normalizes structured response with revenue trend down', () => {
      const raw = {
        revenue_trend: { this_month_fmt: '$3,000', change_pct: -8 },
      };
      const result = normalizeInsights(raw);
      expect(result[0].body).toContain('down 8%');
    });

    test('skips unavailable revenue trend', () => {
      const raw = {
        revenue_trend: { unavailable: true },
      };
      const result = normalizeInsights(raw);
      expect(result).toEqual(INITIAL_INSIGHTS);
    });

    test('normalizes capacity data', () => {
      const raw = {
        capacity: { booked_hours: 40, coach_count: 3 },
      };
      const result = normalizeInsights(raw);
      expect(result[0].id).toBe('capacity');
      expect(result[0].body).toContain('40 hrs');
      expect(result[0].body).toContain('3 coaches');
    });

    test('normalizes client engagement data', () => {
      const raw = {
        client_engagement: { inactive_count: 5, total_clients: 50 },
      };
      const result = normalizeInsights(raw);
      expect(result[0].id).toBe('client-engagement');
      expect(result[0].body).toContain('5 of 50');
    });

    test('skips client engagement when inactive_count is 0', () => {
      const raw = {
        client_engagement: { inactive_count: 0, total_clients: 50 },
      };
      const result = normalizeInsights(raw);
      expect(result).toEqual(INITIAL_INSIGHTS);
    });

    test('caps structured insights at 4', () => {
      const raw = {
        expiring_memberships: { count: 1 },
        revenue_trend: { this_month_fmt: '$1k', change_pct: 5 },
        capacity: { booked_hours: 10, coach_count: 2 },
        client_engagement: { inactive_count: 3, total_clients: 20 },
        caddie_demand: { has_signals: true, total_signals: 5, period_days: 7 },
      };
      const result = normalizeInsights(raw);
      expect(result).toHaveLength(4);
    });

    test('handles .data wrapper in structured response', () => {
      const raw = {
        data: { expiring_memberships: { count: 2 } },
      };
      const result = normalizeInsights(raw);
      expect(result[0].id).toBe('expiring-memberships');
    });

    test('normalizes legacy array format', () => {
      const raw = [
        { id: 'custom-1', title: 'Custom', summary: 'Summary text', prompt: 'Do something' },
        { title: 'No ID', description: 'Desc text' },
      ];
      const result = normalizeInsights(raw);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('custom-1');
      expect(result[0].body).toBe('Summary text');
      expect(result[1].id).toBe('marshal-insight-1');
      expect(result[1].body).toBe('Desc text');
    });

    test('caps legacy array at 4 items', () => {
      const raw = Array.from({ length: 6 }, (_, i) => ({ title: `Insight ${i}` }));
      const result = normalizeInsights(raw);
      expect(result).toHaveLength(4);
    });
  });

  // ── normalizeIntent ──

  describe('normalizeIntent', () => {
    test('returns null for falsy input', () => {
      expect(normalizeIntent(null)).toBeNull();
      expect(normalizeIntent(undefined)).toBeNull();
      expect(normalizeIntent('')).toBeNull();
    });

    test('wraps string intent into object', () => {
      const result = normalizeIntent('Summarize bookings');
      expect(result).toEqual({ message: 'Summarize bookings' });
    });

    test('preserves object intent with message', () => {
      const intent = { message: 'Hello', extra: 'data' };
      const result = normalizeIntent(intent);
      expect(result.message).toBe('Hello');
      expect(result.extra).toBe('data');
    });

    test('falls back to prompt when no message', () => {
      const intent = { prompt: 'Do something' };
      const result = normalizeIntent(intent);
      expect(result.message).toBe('Do something');
    });

    test('falls back to handoff.prompt when no message or prompt', () => {
      const intent = { handoff: { prompt: 'Handoff prompt' } };
      const result = normalizeIntent(intent);
      expect(result.message).toBe('Handoff prompt');
    });

    test('returns empty message string when no message sources exist', () => {
      const result = normalizeIntent({ extra: 'only' });
      expect(result.message).toBe('');
    });
  });

  // ── transformMarshalResponse ──

  describe('transformMarshalResponse', () => {
    test('transforms response with pending actions into confirmation type', () => {
      const result = transformMarshalResponse({
        response: 'Shall I proceed?',
        pending_actions: [{ action_id: 'a1', tool: 'send_email' }],
        card: null,
      }, INITIAL_SUGGESTIONS);

      expect(result.message.type).toBe('confirmation');
      expect(result.message.text).toBe('Shall I proceed?');
      expect(result.message.pendingActions).toHaveLength(1);
    });

    test('transforms response without pending actions into assistant type', () => {
      const result = transformMarshalResponse({
        response: 'Here is the summary.',
        pending_actions: [],
        card: null,
      }, INITIAL_SUGGESTIONS);

      expect(result.message.type).toBe('assistant');
    });

    test('uses fallback text when response is empty', () => {
      const result = transformMarshalResponse({}, INITIAL_SUGGESTIONS);
      expect(result.message.text).toBe('Marshal processed your request but did not return any text.');
    });

    test('passes card data through', () => {
      const card = { type: 'booking', data: {} };
      const result = transformMarshalResponse({
        response: 'Done',
        card,
      }, INITIAL_SUGGESTIONS);
      expect(result.message.card).toBe(card);
    });
  });

  // ── Constants ──

  describe('constants', () => {
    test('AFFIRMATIVE_REPLIES includes common confirmations', () => {
      expect(AFFIRMATIVE_REPLIES).toContain('yes');
      expect(AFFIRMATIVE_REPLIES).toContain('ok');
      expect(AFFIRMATIVE_REPLIES).toContain('go ahead');
    });

    test('NEGATIVE_REPLIES includes common denials', () => {
      expect(NEGATIVE_REPLIES).toContain('no');
      expect(NEGATIVE_REPLIES).toContain('cancel');
    });

    test('INITIAL_MESSAGES has welcome message', () => {
      expect(INITIAL_MESSAGES).toHaveLength(1);
      expect(INITIAL_MESSAGES[0].sender).toBe('assistant');
    });

    test('INITIAL_INSIGHTS has 3 default cards', () => {
      expect(INITIAL_INSIGHTS).toHaveLength(3);
      INITIAL_INSIGHTS.forEach((insight) => {
        expect(insight).toHaveProperty('id');
        expect(insight).toHaveProperty('title');
        expect(insight).toHaveProperty('body');
        expect(insight).toHaveProperty('prompt');
      });
    });
  });
});
