import { formatDateInTz, formatTimeInTz } from './timezone.helper';
import { getSessionCoachNames, getSessionResourceNames, getSessionServiceName } from './booking.helper';

const sanitize = (text) => {
  if (!text) return '';
  return String(text).replace(/[<>\[\]{}]/g, '').substring(0, 500);
};

const getPersonName = (person) => {
  if (!person) {
    return '';
  }

  return `${person.first_name || ''} ${person.last_name || ''}`.trim() || person.name || person.email || '';
};

export const buildMarshalIntentFromHandoff = (handoff, options = {}) => {
  const prompt = handoff?.prompt || '';

  return {
    id: options.id || `handoff-${handoff?.target || 'marshal'}-${handoff?.reason || 'follow_up'}`,
    message: prompt,
    handoff: handoff || null,
  };
};

export const buildBookingMarshalIntent = ({ booking, company }) => {
  const clientName = getPersonName(booking?.client || booking?.user) || 'Unknown client';
  const serviceName = getSessionServiceName(booking);
  const coachNames = getSessionCoachNames(booking) || 'Unassigned';
  const resourceNames = getSessionResourceNames(booking) || 'None assigned';
  // Show endpoint returns flat location_name; index returns nested location.name
  const locationName = booking?.location?.name || booking?.location_name || 'Unknown location';
  const bookingDate = booking?.start_time ? formatDateInTz(booking.start_time, company, 'long') : 'Unknown date';
  const startTime = booking?.start_time ? formatTimeInTz(booking.start_time, company) : 'Unknown time';
  const endTime = booking?.end_time ? formatTimeInTz(booking.end_time, company) : '';
  const timeRange = endTime ? `${startTime} – ${endTime}` : startTime;
  const status = booking?.status || 'unknown';
  // Strip potential LLM instruction characters from user-supplied notes to
  // prevent prompt injection before embedding in the intent message.
  const rawNotes = booking?.notes ? String(booking.notes).trim() : '';
  const notes = rawNotes.replace(/[<>\[\]{}]/g, '').substring(0, 500);
  const summary = `Review ${serviceName} for ${clientName} on ${bookingDate}${timeRange ? ` at ${timeRange}` : ''}.`;

  const service = booking?.services?.[0] || booking?.service;
  const requiresCoach = service?.requires_coach ?? service?.coach_required ?? null;
  const paymentStatus = booking?.payment_status || 'unknown';
  const totalAmount = booking?.total_amount;

  const promptLines = [
    'Booking follow-up handoff for Marshal',
    'Reason: booking_follow_up',
    `Booking ID: ${booking?.id ?? 'unknown'}`,
    `Client: ${clientName}`,
    `Service: ${serviceName}`,
    `Service requires coach: ${requiresCoach === true ? 'yes' : requiresCoach === false ? 'no' : 'unknown'}`,
    `Date: ${bookingDate}`,
    `Time: ${timeRange}`,
    `Location: ${locationName}`,
    `Coach: ${coachNames}`,
    `Resources: ${resourceNames}`,
    `Status: ${status}`,
    `Payment status: ${paymentStatus}`,
    `Total amount: ${totalAmount != null ? `$${totalAmount}` : 'N/A'}`,
  ];

  if (notes) {
    promptLines.push(`[BOOKING_NOTE_START] ${notes} [BOOKING_NOTE_END]`);
  }

  promptLines.push('Please review this booking and recommend or perform the next facility-side follow-up. Any mutation still requires explicit human approval.');

  const prompt = promptLines.join('\n');

  return {
    id: `booking-${booking?.id ?? 'unknown'}-marshal-intent`,
    message: prompt,
    handoff: {
      target: 'marshal',
      reason: 'booking_follow_up',
      title: 'Booking follow-up recommended',
      summary,
      prompt,
      origin_agent: 'booking_detail',
      requires_staff_follow_up: true,
      requires_human_approval: false,
    },
  };
};

export const buildClassSessionMarshalIntent = ({ booking, company, waitlistEntries = [] }) => {
  const serviceName = sanitize(getSessionServiceName(booking)) || 'Class Session';
  const coachNames = sanitize(getSessionCoachNames(booking)) || 'Unassigned';
  const resourceNames = sanitize(getSessionResourceNames(booking)) || 'None assigned';
  const locationName = sanitize(booking?.location?.name || booking?.location_name) || 'Unknown location';
  const sessionDate = booking?.start_time ? formatDateInTz(booking.start_time, company, 'long') : 'Unknown date';
  const startTime = booking?.start_time ? formatTimeInTz(booking.start_time, company) : 'Unknown time';
  const endTime = booking?.end_time ? formatTimeInTz(booking.end_time, company) : '';
  const timeRange = endTime ? `${startTime} – ${endTime}` : startTime;

  const attendees = booking?.attendees || booking?.bookings || booking?.enrollments || [];
  const attendeeNames = Array.isArray(attendees)
    ? attendees.map((a) => getPersonName(a?.client || a?.user || a)).filter(Boolean)
    : [];
  const waitlistNames = Array.isArray(waitlistEntries)
    ? waitlistEntries.map((e) => getPersonName(e?.client || e?.user || e)).filter(Boolean)
    : [];
  const capacity = booking?.capacity ?? booking?.service?.capacity ?? null;
  const available = booking?.available ?? null;
  const bookedCount = typeof capacity === 'number' && typeof available === 'number'
    ? Math.max(capacity - available, 0)
    : attendeeNames.length;

  const summary = `Review ${serviceName} class session on ${sessionDate}${timeRange ? ` at ${timeRange}` : ''}.`;

  const promptLines = [
    'Class session follow-up handoff for Marshal',
    'Reason: class_session_follow_up',
    `Class session ID: ${booking?.class_session_id || booking?.id || 'unknown'}`,
    `Service: ${serviceName}`,
    `Date: ${sessionDate}`,
    `Time: ${timeRange}`,
    `Location: ${locationName}`,
    `Coach: ${coachNames}`,
    `Resources: ${resourceNames}`,
    `Attendee count: ${bookedCount}`,
  ];

  if (typeof capacity === 'number') promptLines.push(`Capacity: ${capacity}`);
  if (attendeeNames.length > 0) promptLines.push(`Attendees: ${attendeeNames.join(', ')}`);
  if (waitlistNames.length > 0) promptLines.push(`Waitlist: ${waitlistNames.join(', ')}`);
  promptLines.push('Please review this class session and recommend the most important facility-side follow-up. Any mutation still requires explicit human approval.');

  const prompt = promptLines.join('\n');

  return {
    id: `class-session-${booking?.class_session_id || booking?.id || 'unknown'}-marshal-intent`,
    message: prompt,
    handoff: {
      target: 'marshal',
      reason: 'class_session_follow_up',
      title: 'Class session follow-up recommended',
      summary,
      prompt,
      origin_agent: 'class_session_detail',
      requires_staff_follow_up: true,
      requires_human_approval: false,
    },
  };
};

export const buildOnboardingMarshalIntent = ({ stepId, step }) => {
  const stepTitle = sanitize(step?.title) || 'Go-live setup';
  const summary = `Help complete the ${stepTitle} setup step.`;
  const prompt = [
    'Onboarding setup handoff for Marshal',
    'Reason: onboarding_setup_assist',
    `Step ID: ${stepId || 'unknown'}`,
    `Step: ${stepTitle}`,
    `Completed: ${step?.completed ? 'Yes' : 'No'}`,
    `Estimate: ${sanitize(step?.estimate) || 'Unknown'}`,
    `Description: ${sanitize(step?.description) || 'No description provided'}`,
    `Rationale: ${sanitize(step?.rationale) || 'No rationale provided'}`,
    'Please guide the staff user through the most useful next setup action. Any mutation still requires explicit human approval.',
  ].join('\n');

  return {
    id: `onboarding-${stepId || 'unknown'}-marshal-intent`,
    message: prompt,
    handoff: {
      target: 'marshal',
      reason: 'onboarding_setup_assist',
      title: 'Onboarding help recommended',
      summary,
      prompt,
      origin_agent: 'welcome_widget',
      requires_staff_follow_up: true,
      requires_human_approval: false,
    },
  };
};

export const buildInsightMarshalIntent = ({ insightType, data }) => {
  const builders = {
    expiring_memberships: () => {
      const members = Array.isArray(data?.members) ? data.members : [];
      return {
        title: 'Expiring memberships follow-up recommended',
        summary: `Review ${data?.count ?? 0} memberships expiring in the next 30 days.`,
        promptLines: [
          'Insight type: expiring_memberships',
          `Expiring count: ${data?.count ?? 0}`,
          `Urgent within 7 days: ${members.filter((m) => m?.days_left <= 7).length}`,
          `Members: ${members.length > 0 ? members.map((m) => `${m.name} (${m.days_left}d, expires ${m.expires_at})`).join(', ') : 'None'}`,
        ],
      };
    },
    caddie_demand: () => {
      const highlights = Array.isArray(data?.highlights) ? data.highlights : [];
      return {
        title: 'Caddie demand analysis recommended',
        summary: `Review ${data?.total_signals ?? 0} Caddie friction signal(s) from the last ${data?.period_days ?? 7} days.`,
        promptLines: [
          'Insight type: caddie_demand (friction signals)',
          `Total friction signals: ${data?.total_signals ?? 0}`,
          `Period: last ${data?.period_days ?? 7} days`,
          `Availability misses: ${data?.counts?.availability_misses ?? 0}`,
          `Booking abandonments: ${data?.counts?.booking_abandonments ?? 0}`,
          `Membership inquiries: ${data?.counts?.membership_inquiries ?? 0}`,
          `Package inquiries: ${data?.counts?.package_inquiries ?? 0}`,
          `Cancellations via Caddie: ${data?.counts?.cancellation_attempts ?? 0}`,
          `Cancellations blocked: ${data?.counts?.cancellation_blocked ?? 0}`,
          `Price sensitivity signals: ${data?.counts?.price_sensitivity ?? 0}`,
          `Top highlights: ${highlights.map((h) => h.label).join('; ') || 'None'}`,
        ],
      };
    },
    conversions: () => {
      return {
        title: 'Conversion activity analysis',
        summary: `Review ${data?.total_signals ?? 0} conversion event(s) from the last ${data?.period_days ?? 7} days.`,
        promptLines: [
          'Insight type: conversions',
          `Total conversion events: ${data?.total_signals ?? 0}`,
          `Period: last ${data?.period_days ?? 7} days`,
          `Bookings completed: ${data?.counts?.bookings_completed ?? 0}`,
          `Bookings cancelled: ${data?.counts?.bookings_cancelled ?? 0}`,
          `Memberships purchased: ${data?.counts?.memberships_purchased ?? 0}`,
          `Packages purchased: ${data?.counts?.packages_purchased ?? 0}`,
        ],
      };
    },
    revenue_trend: () => ({
      title: 'Revenue trend follow-up recommended',
      summary: 'Review revenue performance for this month versus last month.',
      promptLines: [
        'Insight type: revenue_trend',
        `This month revenue: ${data?.this_month_fmt ?? '$0'}`,
        `Last month revenue: ${data?.last_month_fmt ?? '$0'}`,
        `Change: ${data?.change_pct ?? 0}%`,
      ],
    }),
    capacity: () => ({
      title: 'Capacity follow-up recommended',
      summary: 'Review weekly capacity and booking volume.',
      promptLines: [
        'Insight type: capacity',
        `Week: ${data?.week_label || 'Current week'}`,
        `Booked hours: ${data?.booked_hours ?? 0}`,
        `Last week hours: ${data?.last_week_hours ?? 0}`,
        `Total bookings: ${data?.total_bookings ?? 0}`,
        `Coach count: ${data?.coach_count ?? 0}`,
        `Change: ${data?.change_pct ?? 0}%`,
      ],
    }),
  };

  const builder = builders[insightType];
  const { title, summary, promptLines } = builder
    ? builder()
    : {
        title: 'Client engagement follow-up recommended',
        summary: `Review ${data?.inactive_count ?? 0} clients inactive for more than 30 days.`,
        promptLines: [
          'Insight type: client_engagement',
          `Inactive count: ${data?.inactive_count ?? 0}`,
          `Total clients: ${data?.total_clients ?? 0}`,
        ],
      };

  const fullPromptLines = [
    'Proactive insight handoff for Marshal',
    'Reason: proactive_insight_follow_up',
    ...promptLines,
    'Please review and recommend the most important facility-side follow-up. Any mutation still requires explicit human approval.',
  ];
  const prompt = fullPromptLines.join('\n');

  return {
    id: `insight-${insightType || 'unknown'}-${Date.now()}-marshal-intent`,
    message: prompt,
    handoff: {
      target: 'marshal',
      reason: 'proactive_insight_follow_up',
      title,
      summary,
      prompt,
      origin_agent: 'proactive_insights_widget',
      requires_staff_follow_up: true,
      requires_human_approval: false,
    },
  };
};

export const buildClientMarshalIntent = ({ client, company, upcomingBookings = [], pastBookings = [] }) => {
  const clientName = getPersonName(client) || 'Unknown client';
  const nextBooking = Array.isArray(upcomingBookings) && upcomingBookings.length > 0 ? upcomingBookings[0] : null;
  const nextService = nextBooking ? getSessionServiceName(nextBooking) : 'No upcoming booking';
  const nextDate = nextBooking?.start_time ? formatDateInTz(nextBooking.start_time, company, 'long') : 'No upcoming booking';
  const nextTime = nextBooking?.start_time ? formatTimeInTz(nextBooking.start_time, company) : '';
  const membershipName = client?.membership?.plan?.name || (client?.membership?.is_active ? 'Active membership' : 'No active membership');
  const phone = client?.phone || client?.details?.phone || '';
  const email = client?.email || '';
  const missingFields = [];
  if (!phone) missingFields.push('phone number');
  if (!email) missingFields.push('email');
  const summary = `Review follow-up needs for ${clientName}.`;

  const promptLines = [
    'Client follow-up handoff for Marshal',
    'Reason: client_follow_up',
    `Client ID: ${client?.id ?? 'unknown'}`,
    `Client: ${clientName}`,
  ];

  if (email) promptLines.push(`Email: ${email}`);
  if (phone) promptLines.push(`Phone: ${phone}`);
  if (missingFields.length > 0) promptLines.push(`Missing contact info: ${missingFields.join(', ')}`);

  promptLines.push(`Upcoming bookings: ${Array.isArray(upcomingBookings) ? upcomingBookings.length : 0}`);
  promptLines.push(`Past bookings: ${Array.isArray(pastBookings) ? pastBookings.length : 0}`);
  promptLines.push(`Membership: ${membershipName}`);
  const membership = client?.membership;
  if (membership) {
    if (membership.stripe_status) promptLines.push(`Membership status: ${membership.stripe_status}`);
    if (membership.renews_at) promptLines.push(`Renews at: ${membership.renews_at}`);
    if (membership.cancel_at_period_end) promptLines.push('Cancel at period end: yes');
  }
  promptLines.push(`Next booking service: ${nextService}`);
  promptLines.push(`Next booking date: ${nextDate}`);
  promptLines.push(`Next booking time: ${nextTime || 'Unknown time'}`);

  promptLines.push('Please review this client and recommend the most important facility-side follow-up. Any mutation still requires explicit human approval.');

  const prompt = promptLines.join('\n');

  return {
    id: `client-${client?.id ?? 'unknown'}-marshal-intent`,
    message: prompt,
    handoff: {
      target: 'marshal',
      reason: 'client_follow_up',
      title: 'Client follow-up recommended',
      summary,
      prompt,
      origin_agent: 'client_detail',
      requires_staff_follow_up: true,
      requires_human_approval: false,
    },
  };
};
