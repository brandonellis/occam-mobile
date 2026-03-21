import {
  buildBookingMarshalIntent,
  buildClientMarshalIntent,
  buildMarshalIntentFromHandoff,
} from '../../src/helpers/marshalIntent.helper';

describe('marshalIntent.helper', () => {
  test('buildBookingMarshalIntent returns a structured Marshal handoff for staff booking follow-up', () => {
    const booking = {
      id: 42,
      status: 'confirmed',
      start_time: '2026-03-16T17:00:00Z',
      end_time: '2026-03-16T18:00:00Z',
      client: {
        first_name: 'Jordan',
        last_name: 'Lee',
      },
      services: [
        { id: 7, name: 'Performance Lesson' },
      ],
      coaches: [
        { id: 11, first_name: 'Taylor', last_name: 'Reed' },
      ],
      location: {
        id: 3,
        name: 'North Studio',
      },
      resources: [
        { id: 9, name: 'Bay 2' },
      ],
      notes: 'Client may need to move to a later time.',
    };

    const company = {
      timezone: 'America/Chicago',
    };

    const intent = buildBookingMarshalIntent({ booking, company });

    expect(intent.id).toBe('booking-42-marshal-intent');
    expect(intent.message).toContain('Booking ID: 42');
    expect(intent.message).toContain('Client: Jordan Lee');
    expect(intent.message).toContain('Service: Performance Lesson');
    expect(intent.message).toContain('Coach: Taylor Reed');
    expect(intent.message).toContain('Location: North Studio');
    expect(intent.message).toContain('Resources: Bay 2');
    expect(intent.message).toContain('[BOOKING_NOTE_START] Client may need to move to a later time. [BOOKING_NOTE_END]');
    expect(intent.handoff.target).toBe('marshal');
    expect(intent.handoff.reason).toBe('booking_follow_up');
    expect(intent.handoff.title).toBe('Booking follow-up recommended');
    expect(intent.handoff.summary).toContain('Performance Lesson');
    expect(intent.handoff.summary).toContain('Jordan Lee');
    expect(intent.handoff.prompt).toBe(intent.message);
  });

  test('buildClientMarshalIntent returns a structured Marshal handoff for client follow-up', () => {
    const client = {
      id: 18,
      first_name: 'Avery',
      last_name: 'Stone',
      email: 'avery@example.com',
      membership: {
        is_active: true,
        plan: {
          name: 'Elite Plan',
        },
      },
    };

    const upcomingBookings = [
      {
        id: 90,
        start_time: '2026-03-18T15:00:00Z',
        services: [{ id: 2, name: 'Short Game Session' }],
      },
    ];

    const pastBookings = [
      {
        id: 77,
      },
    ];

    const company = {
      timezone: 'America/Chicago',
    };

    const intent = buildClientMarshalIntent({
      client,
      company,
      upcomingBookings,
      pastBookings,
    });

    expect(intent.id).toBe('client-18-marshal-intent');
    expect(intent.message).toContain('Client ID: 18');
    expect(intent.message).toContain('Client: Avery Stone');
    expect(intent.message).toContain('Email: avery@example.com');
    expect(intent.message).toContain('Upcoming bookings: 1');
    expect(intent.message).toContain('Past bookings: 1');
    expect(intent.message).toContain('Membership: Elite Plan');
    expect(intent.message).toContain('Next booking service: Short Game Session');
    expect(intent.handoff.target).toBe('marshal');
    expect(intent.handoff.reason).toBe('client_follow_up');
    expect(intent.handoff.title).toBe('Client follow-up recommended');
    expect(intent.handoff.summary).toContain('Avery Stone');
    expect(intent.handoff.prompt).toBe(intent.message);
  });

  test('buildMarshalIntentFromHandoff preserves the prepared prompt for Marshal intake', () => {
    const handoff = {
      target: 'marshal',
      reason: 'billing_support',
      title: 'Marshal follow-up recommended',
      summary: 'This request needs facility-side billing support.',
      prompt: 'Client handoff from Caddie\nReason: billing_support\nClient request: I need a refund.',
    };

    const intent = buildMarshalIntentFromHandoff(handoff, { id: 'handoff-123' });

    expect(intent).toEqual({
      id: 'handoff-123',
      message: handoff.prompt,
      handoff,
    });
  });
});
