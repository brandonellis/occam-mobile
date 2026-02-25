import dayjs from '../utils/dayjs';

/**
 * Build grouped-by-coach structure and a flattened slot list
 * from availableByCoach API result for class sessions.
 *
 * Exact port of occam-client/src/utils/classSessionHelpers.js.
 *
 * @param {object} result - API response; supports shapes: { data: {coachId: {coach, sessions[]}} } or { groups: ... } or raw object
 * @param {dayjs.Dayjs|string|Date} selectedDate - the currently selected date (used to compute is_past)
 * @returns {{ groups: Array<{coach: object|null, slots: Array<object>}>, flat: Array<object> }}
 */
export function buildClassSessionGroups(result, selectedDate) {
  const groupsObj = result?.data || result?.groups || result || {};
  const isSameDayAsToday = dayjs(selectedDate).isSame(dayjs(), 'day');

  const groups = [];
  const flat = [];

  Object.values(groupsObj).forEach((group) => {
    const slots = (group.sessions || []).map((s) => ({
      id: s.id,
      class_session_id: s.id,
      start_time: s.start_at,
      end_time: s.end_at,
      resource_id: s.resource_id || null,
      // Normalize remaining availability
      capacity: typeof s.capacity === 'number' ? s.capacity : null,
      active_attendees: typeof s.active_attendees === 'number' ? s.active_attendees : null,
      // Prefer remaining = capacity - active_attendees when both provided; fallback to s.available
      available: (typeof s.capacity === 'number' && typeof s.active_attendees === 'number')
        ? Math.max(0, s.capacity - s.active_attendees)
        : (typeof s.available === 'number' ? s.available : null),
      // Derive is_full based on normalized available when possible
      is_full: (typeof s.capacity === 'number' && typeof s.active_attendees === 'number')
        ? (s.capacity - s.active_attendees) <= 0
        : ((s.available ?? 0) <= 0),
      already_attending: !!s.already_attending,
      on_waitlist: !!s.on_waitlist,
      waitlist_count: typeof s.waitlist_count === 'number' ? s.waitlist_count : 0,
      is_past: isSameDayAsToday && dayjs(s.start_at).isBefore(dayjs()),
      coach: group.coach || s.coach || null,
      location: s.location || null,
      // Display time for slot rendering
      display_time: dayjs(s.start_at).format('h:mm A'),
    }));

    slots.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
    groups.push({ coach: group.coach || null, slots });
    flat.push(...slots);
  });

  flat.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
  return { groups, flat };
}
