import {
  isMembershipActive,
  isMembershipPausedNow,
  buildMembershipAllotments,
  getMembershipStatus,
  getNextRenewalDate,
} from '../../src/helpers/membership.helper';

// ── isMembershipActive ──

describe('isMembershipActive', () => {
  test('active stripe_status is active', () => {
    expect(isMembershipActive({ stripe_status: 'active' })).toBe(true);
  });

  test('canceled but not ended is still active', () => {
    const future = new Date(Date.now() + 86400000).toISOString();
    expect(isMembershipActive({ stripe_status: 'canceled', end_date: future })).toBe(true);
  });

  test('cancelled (British spelling) but not ended is active', () => {
    const future = new Date(Date.now() + 86400000).toISOString();
    expect(isMembershipActive({ stripe_status: 'cancelled', ends_at: future })).toBe(true);
  });

  test('canceled and ended is NOT active', () => {
    expect(isMembershipActive({ stripe_status: 'canceled', end_date: '2020-01-01' })).toBe(false);
  });

  test('paused membership is NOT active', () => {
    expect(isMembershipActive({ stripe_status: 'active', is_paused: true })).toBe(false);
  });

  test('null/undefined returns false', () => {
    expect(isMembershipActive(null)).toBe(false);
    expect(isMembershipActive(undefined)).toBe(false);
  });

  test('empty stripe_status is not active', () => {
    expect(isMembershipActive({ stripe_status: '' })).toBe(false);
  });

  test('active with no end_date is active', () => {
    expect(isMembershipActive({ stripe_status: 'active', end_date: null })).toBe(true);
  });
});

// ── isMembershipPausedNow ──

describe('isMembershipPausedNow', () => {
  test('not paused when is_paused is false', () => {
    expect(isMembershipPausedNow({ is_paused: false })).toBe(false);
  });

  test('paused when in pause window', () => {
    const past = new Date(Date.now() - 86400000).toISOString();
    const future = new Date(Date.now() + 86400000).toISOString();
    expect(isMembershipPausedNow({
      is_paused: true,
      pause_start_at: past,
      pause_end_at: future,
    })).toBe(true);
  });

  test('NOT paused when before pause_start_at', () => {
    const future1 = new Date(Date.now() + 86400000).toISOString();
    const future2 = new Date(Date.now() + 172800000).toISOString();
    expect(isMembershipPausedNow({
      is_paused: true,
      pause_start_at: future1,
      pause_end_at: future2,
    })).toBe(false);
  });

  test('NOT paused when after pause_end_at', () => {
    const past1 = new Date(Date.now() - 172800000).toISOString();
    const past2 = new Date(Date.now() - 86400000).toISOString();
    expect(isMembershipPausedNow({
      is_paused: true,
      pause_start_at: past1,
      pause_end_at: past2,
    })).toBe(false);
  });

  test('paused with no start/end dates (indefinite pause)', () => {
    expect(isMembershipPausedNow({
      is_paused: true,
      pause_start_at: null,
      pause_end_at: null,
    })).toBe(true);
  });

  test('null membership returns false', () => {
    expect(isMembershipPausedNow(null)).toBe(false);
  });
});

// ── buildMembershipAllotments ──

describe('buildMembershipAllotments', () => {
  test('builds allotment map from plan services', () => {
    const result = buildMembershipAllotments({
      membership_plan: {
        plan_services: [
          { service_id: 1, remaining_quantity: 5, quantity: 10 },
          { service_id: 2, remaining_quantity: null, quantity: 0 },
        ],
      },
    });
    expect(result).toEqual({
      1: { remaining: 5, total: 10 },
      2: { remaining: null, total: 0 },
    });
  });

  test('returns null when no plan services', () => {
    expect(buildMembershipAllotments({ membership_plan: { plan_services: [] } })).toBeNull();
  });

  test('returns null for null input', () => {
    expect(buildMembershipAllotments(null)).toBeNull();
  });
});

// ── getMembershipStatus ──

describe('getMembershipStatus', () => {
  test('active status', () => {
    const { status } = getMembershipStatus({ stripe_status: 'active' });
    expect(status).toBe('active');
  });

  test('canceled with future end shows active_until', () => {
    const future = new Date(Date.now() + 86400000).toISOString();
    const { status } = getMembershipStatus({ stripe_status: 'canceled', end_date: future });
    expect(status).toBe('active_until');
  });

  test('paused status', () => {
    const past = new Date(Date.now() - 86400000).toISOString();
    const future = new Date(Date.now() + 86400000).toISOString();
    const { status } = getMembershipStatus({
      stripe_status: 'active',
      is_paused: true,
      pause_start_at: past,
      pause_end_at: future,
    });
    expect(status).toBe('paused');
  });

  test('expired status', () => {
    const past = new Date(Date.now() - 86400000).toISOString();
    const { status } = getMembershipStatus({ stripe_status: 'incomplete', end_date: past });
    expect(status).toBe('expired');
  });

  test('trialing is active', () => {
    const { status } = getMembershipStatus({ stripe_status: 'trialing' });
    expect(status).toBe('active');
  });

  test('null returns inactive', () => {
    const { status } = getMembershipStatus(null);
    expect(status).toBe('inactive');
  });
});

// ── getNextRenewalDate ──

describe('getNextRenewalDate', () => {
  test('returns future date after cycling through billing periods', () => {
    const startDate = '2025-01-15';
    const billingCycle = { duration_months: 1 };
    const result = getNextRenewalDate(startDate, billingCycle);
    expect(result).toBeInstanceOf(Date);
    expect(result.getTime()).toBeGreaterThan(Date.now());
  });

  test('returns null for missing inputs', () => {
    expect(getNextRenewalDate(null, { duration_months: 1 })).toBeNull();
    expect(getNextRenewalDate('2025-01-01', null)).toBeNull();
  });
});
