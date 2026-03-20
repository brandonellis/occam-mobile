import { formatDateInTz, formatTimeInTz } from './timezone.helper';
import { getSessionCoachNames, getSessionResourceNames, getSessionServiceName } from './booking.helper';

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

  const promptLines = [
    'Booking follow-up handoff for Marshal',
    'Reason: booking_follow_up',
    `Booking ID: ${booking?.id ?? 'unknown'}`,
    `Client: ${clientName}`,
    `Service: ${serviceName}`,
    `Date: ${bookingDate}`,
    `Time: ${timeRange}`,
    `Location: ${locationName}`,
    `Coach: ${coachNames}`,
    `Resources: ${resourceNames}`,
    `Status: ${status}`,
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

export const buildClientMarshalIntent = ({ client, company, upcomingBookings = [], pastBookings = [] }) => {
  const clientName = getPersonName(client) || 'Unknown client';
  const nextBooking = Array.isArray(upcomingBookings) && upcomingBookings.length > 0 ? upcomingBookings[0] : null;
  const nextService = nextBooking ? getSessionServiceName(nextBooking) : 'No upcoming booking';
  const nextDate = nextBooking?.start_time ? formatDateInTz(nextBooking.start_time, company, 'long') : 'No upcoming booking';
  const nextTime = nextBooking?.start_time ? formatTimeInTz(nextBooking.start_time, company) : '';
  const membershipName = client?.membership?.plan?.name || (client?.membership?.is_active ? 'Active membership' : 'No active membership');
  const summary = `Review follow-up needs for ${clientName}.`;

  const promptLines = [
    'Client follow-up handoff for Marshal',
    'Reason: client_follow_up',
    `Client ID: ${client?.id ?? 'unknown'}`,
    `Client: ${clientName}`,
    `Email: ${client?.email || 'Unknown email'}`,
    `Upcoming bookings: ${Array.isArray(upcomingBookings) ? upcomingBookings.length : 0}`,
    `Past bookings: ${Array.isArray(pastBookings) ? pastBookings.length : 0}`,
    `Membership: ${membershipName}`,
    `Next booking service: ${nextService}`,
    `Next booking date: ${nextDate}`,
    `Next booking time: ${nextTime || 'Unknown time'}`,
  ];

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
