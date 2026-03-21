import {
  buildMessage,
  buildHistory,
  normalizeSuggestions,
  stripContextBlocks,
  formatEligibilityLabel,
} from '../../src/helpers/agentChat.helper';

describe('buildMessage', () => {
  test('creates a message with sender, text, and unique id', () => {
    const msg = buildMessage('user', 'Hello');
    expect(msg.sender).toBe('user');
    expect(msg.text).toBe('Hello');
    expect(msg.id).toMatch(/^user-/);
  });

  test('merges extra fields into the message', () => {
    const msg = buildMessage('assistant', 'Response', { type: 'handoff', card: { type: 'stats' } });
    expect(msg.type).toBe('handoff');
    expect(msg.card).toEqual({ type: 'stats' });
  });

  test('extras can override the id', () => {
    const msg = buildMessage('assistant', '', { id: 'custom-id', streaming: true });
    expect(msg.id).toBe('custom-id');
    expect(msg.streaming).toBe(true);
  });

  test('generates unique ids for successive calls', () => {
    const a = buildMessage('user', 'A');
    const b = buildMessage('user', 'B');
    expect(a.id).not.toBe(b.id);
  });
});

describe('buildHistory', () => {
  test('maps messages to role/content format', () => {
    const messages = [
      { id: '1', sender: 'user', text: 'Hi' },
      { id: '2', sender: 'assistant', text: 'Hello' },
    ];
    const history = buildHistory(messages);
    expect(history).toEqual([
      { role: 'user', content: 'Hi' },
      { role: 'assistant', content: 'Hello' },
    ]);
  });

  test('filters out non-user/assistant senders', () => {
    const messages = [
      { id: '1', sender: 'system', text: 'System msg' },
      { id: '2', sender: 'user', text: 'User msg' },
    ];
    expect(buildHistory(messages)).toHaveLength(1);
  });

  test('filters out messages without string text', () => {
    const messages = [
      { id: '1', sender: 'user', text: null },
      { id: '2', sender: 'user', text: 'Valid' },
    ];
    expect(buildHistory(messages)).toHaveLength(1);
    expect(buildHistory(messages)[0].content).toBe('Valid');
  });

  test('returns empty array for empty input', () => {
    expect(buildHistory([])).toEqual([]);
  });
});

describe('normalizeSuggestions', () => {
  test('extracts prompts from suggested actions', () => {
    const actions = [
      { prompt: 'What next?' },
      { prompt: 'Show bookings' },
    ];
    expect(normalizeSuggestions(actions)).toEqual(['What next?', 'Show bookings']);
  });

  test('falls back to labels when prompts are missing', () => {
    const actions = [{ label: 'Action 1' }];
    expect(normalizeSuggestions(actions)).toEqual(['Action 1']);
  });

  test('returns fallback when suggestedActions is empty or not an array', () => {
    const fallback = ['Default 1', 'Default 2'];
    expect(normalizeSuggestions([], fallback)).toEqual(fallback);
    expect(normalizeSuggestions(null, fallback)).toEqual(fallback);
    expect(normalizeSuggestions(undefined, fallback)).toEqual(fallback);
  });

  test('limits to 3 suggestions', () => {
    const actions = [
      { prompt: 'A' }, { prompt: 'B' }, { prompt: 'C' }, { prompt: 'D' },
    ];
    expect(normalizeSuggestions(actions)).toHaveLength(3);
  });

  test('filters out actions without prompt or label', () => {
    const actions = [{ prompt: 'Good' }, { other: 'Bad' }, { prompt: 'Also good' }];
    expect(normalizeSuggestions(actions)).toEqual(['Good', 'Also good']);
  });
});

describe('stripContextBlocks', () => {
  test('removes AVAILABILITY CONTEXT blocks', () => {
    const text = 'Here are slots.\n[AVAILABILITY CONTEXT: some data here]';
    expect(stripContextBlocks(text)).toBe('Here are slots.');
  });

  test('removes BOOKING LINK CONTEXT blocks', () => {
    const text = 'Book here.\n[BOOKING LINK CONTEXT: link data]';
    expect(stripContextBlocks(text)).toBe('Book here.');
  });

  test('collapses triple+ newlines to double', () => {
    const text = 'Line 1\n\n\n\nLine 2';
    expect(stripContextBlocks(text)).toBe('Line 1\n\nLine 2');
  });

  test('returns null/undefined/empty string as-is', () => {
    expect(stripContextBlocks(null)).toBeNull();
    expect(stripContextBlocks(undefined)).toBeUndefined();
    expect(stripContextBlocks('')).toBe('');
  });

  test('returns non-string values unchanged', () => {
    expect(stripContextBlocks(42)).toBe(42);
  });

  test('handles text with no context blocks', () => {
    const text = 'Normal message with no blocks.';
    expect(stripContextBlocks(text)).toBe(text);
  });
});

describe('formatEligibilityLabel', () => {
  test('returns null for no eligibility', () => {
    expect(formatEligibilityLabel(null)).toBeNull();
    expect(formatEligibilityLabel(undefined)).toBeNull();
  });

  test('formats membership eligibility', () => {
    expect(formatEligibilityLabel({ source: 'membership' })).toBe('Covered by membership');
  });

  test('formats membership with remaining count', () => {
    expect(formatEligibilityLabel({ source: 'membership', remaining: 5 })).toBe('Covered by membership • 5 remaining');
  });

  test('formats package eligibility with name', () => {
    expect(formatEligibilityLabel({ source: 'package', package_name: '10-Pack' })).toBe('10-Pack');
  });

  test('formats package without name', () => {
    expect(formatEligibilityLabel({ source: 'package' })).toBe('Package booking');
  });

  test('formats package with remaining count', () => {
    expect(formatEligibilityLabel({ source: 'package', package_name: '5-Pack', remaining: 3 })).toBe('5-Pack • 3 remaining');
  });

  test('formats one_off payment', () => {
    expect(formatEligibilityLabel({ source: 'one_off' })).toBe('Payment required');
  });

  test('returns null for unknown source', () => {
    expect(formatEligibilityLabel({ source: 'unknown' })).toBeNull();
  });
});
